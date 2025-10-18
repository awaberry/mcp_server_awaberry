import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// --- Internal API Functions ---

const AWABERRY_API_URL = "https://agentic.awaberry.net/apirequests";

async function callApi(endpoint, body) {
    const res = await fetch(AWABERRY_API_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`awaBerry API Error: ${errorText}`);
    }
    return res.json();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectToDevice(projectKey, projectSecret, deviceName) {
    const projectData = await callApi('/getProject', { projectkey: projectKey, projectsecret: projectSecret });
    if (!projectData || !projectData.agentprojectsetup) {
        throw new Error('Incorrect projectKey / projectSecret');
    }

    const agentSetup = JSON.parse(projectData.agentprojectsetup);
    const devices = agentSetup.setupEntries || [];
    const targetDevice = devices.find((entry) => entry.deviceName === deviceName);

    if (!targetDevice) {
        const available = devices.map(d => d.deviceName).join(', ');
        throw new Error(`Device '${deviceName}' not found. Available devices: ${available}`);
    }

    const { deviceuuid } = targetDevice;
    const { sessionToken } = await callApi('/initSession', { projectkey: projectKey, projectsecret: projectSecret });

    let isConnected = await callApi('/startDeviceConnection', { sessionToken, deviceuuid });

    if (!isConnected) {
        for (let i = 0; i < 20; i++) {
            await sleep(2000);
            isConnected = await callApi('/getDeviceConnectionStatus', { sessionToken, deviceuuid });
            if (isConnected) break;
        }
    }

    return {
        sessionToken,
        status: isConnected ? 'connected' : 'notconnected',
        deviceuuid,
    };
}

async function executeCommand(sessionToken, deviceuuid, command) {
    return callApi('/executeCommand', { sessionToken, deviceuuid, command });
}

// --- MCP Server Implementation ---

function createMcpServer(env) {
    const server = new McpServer({
        name: 'awaberry-mcp-server-worker',
        version: '1.0.0',
    });



    server.tool(
        'connect_to_device',
        'Connect to a device via awaBerry Remote without the need for ssh/scp/firewalls. This establishes a secure terminal connection to manage files, connect to databases and execute terminal commands in a persistent long running terminal session.',
        {
            projectKey: z.string().optional().describe('Authentication key AWABERRY_PROJECT_KEY'),
            projectSecret: z.string().optional().describe('Authentication secret AWABERRY_PROJECT_SECRET'),
            deviceName: z.string().describe('The name of the device to connect to'),
        },
        async (args) => {
            const key = args.projectKey || env.AWABERRY_PROJECT_KEY;
            const secret = args.projectSecret || env.AWABERRY_PROJECT_SECRET;

            if (!key || !secret) {
                throw new Error('Project key and secret are required.');
            }

            const result = await connectToDevice(key, secret, args.deviceName);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        }
    );

    server.tool(
        'execute_terminal_command',
        'Executes a shell command on the connected device',
        {
            sessionToken: z.string().describe('Session token from connect_to_device'),
            deviceuuid: z.string().describe('Device UUID from connect_to_device'),
            command: z.string().describe('Shell command to execute'),
        },
        async (args) => {
            const apiResponse = await executeCommand(args.sessionToken, args.deviceuuid, args.command);

            // Extract the actual result from the API response
            const result = apiResponse.result || apiResponse;

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: apiResponse.success !== false,
                            result: result
                        })
                    }
                ],
                // Include structured content for better integration
                structuredContent: {
                    success: apiResponse.success !== false,
                    result: result
                }
            };
        }
    );

    return server;
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Handle OPTIONS for CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        if (url.pathname !== '/mcp' || request.method !== 'POST') {
            return new Response('Not Found', { status: 404 });
        }

        try {
            const server = createMcpServer(env);
            const requestBody = await request.json();

            // Collect all response messages
            const responseMessages = [];
            let resolveResponse;
            const responsePromise = new Promise(resolve => {
                resolveResponse = resolve;
            });

            let responseCount = 0;

            // Custom transport that collects messages
            const transport = {
                start: async () => {},
                send: async (message) => {
                    responseMessages.push(message);
                    responseCount++;
                    // Resolve after first response (for request/response pattern)
                    if (responseCount === 1) {
                        resolveResponse();
                    }
                },
                close: async () => {
                    resolveResponse();
                },
                onmessage: undefined
            };

            // Connect server to transport
            await server.connect(transport);

            // Store the onmessage callback that was set by the server
            const messageCallback = transport.onmessage;

            // Invoke the callback with the request
            if (messageCallback) {
                // Call the callback and handle both sync and async cases
                try {
                    const result = messageCallback(requestBody);
                    if (result && typeof result.catch === 'function') {
                        result.catch(error => {
                            console.error('Error in message callback:', error);
                            resolveResponse();
                        });
                    }
                } catch (error) {
                    console.error('Error invoking message callback:', error);
                    resolveResponse();
                }
            } else {
                throw new Error('MCP server did not set up message handler');
            }

            // Wait for response with timeout
            const timeoutPromise = new Promise(resolve =>
                setTimeout(() => resolve(), 30000) // 30 second timeout
            );

            await Promise.race([responsePromise, timeoutPromise]);

            // Return collected messages
            const response = responseMessages.length === 1
                ? responseMessages[0]
                : responseMessages;

            return new Response(JSON.stringify(response), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        } catch (error) {
            console.error('Error processing MCP request:', error);
            return new Response(JSON.stringify({
                error: {
                    code: -32603,
                    message: error.message
                }
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
    },
};