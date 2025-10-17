import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file
const envFilePath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envFilePath });

if (result.error) {
    console.error('❌ [MCP Test] Error loading .env file:', result.error);
    process.exit(1);
}


console.log(`✅ [MCP Test] Loaded environment from: ${envFilePath}`);
console.log('Environment variables loaded:');
console.log('- PROJECT_KEY:', process.env.projectKey ? '✓' : '✗');
console.log('- PROJECT_SECRET:', process.env.projectSecret ? '✓' : '✗');
console.log('- DEVICE_NAME:', process.env.deviceName ? '✓' : '✗');
console.log('- MCP_SERVER_URL:', process.env.mcpServerUrl ? '✓' : '✗');

// Check if all required environment variables are present
if (!process.env.projectKey || !process.env.projectSecret || !process.env.deviceName) {
    console.error('\n❌ [MCP Test] Missing required environment variables');
    console.error('Please ensure your .env file contains:');
    console.error('- projectKey');
    console.error('- projectSecret');
    console.error('- deviceName');
    process.exit(1);
}

console.log('✅ [MCP Test] All required environment variables are present\n');

const MCP_SERVER_URL = process.env.mcpServerUrl;

// JSON-RPC 2.0 request helper
async function sendMcpRequest(method, params) {
    const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params
    };

    console.log(`\n🔵 [MCP Test] Sending ${method} request`);
    console.log('📤 [MCP Test] Request payload:', JSON.stringify(request, null, 2));

    const response = await fetch(MCP_SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify(request)
    });

    const result = await response.json();
    console.log('📥 [MCP Test] Response received:', JSON.stringify(result, null, 2));
    return result;
}

async function testMcpServer() {
    try {
        console.log('\n🚀 [MCP Test] === Testing awaberry-mcp-server ===\n');

        // Test 1: Initialize session
        console.log('🔵 [MCP Test] --- Test 1: Initialize MCP Session ---');
        const initResponse = await sendMcpRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'test-client',
                version: '1.0.0'
            }
        });

        if (initResponse.result) {
            console.log('✅ [MCP Test] Session initialized successfully');
        } else {
            console.log('❌ [MCP Test] Session initialization failed');
            process.exit(1);
        }

        // Test 2: List available tools
        console.log('\n🔵 [MCP Test] --- Test 2: List Available Tools ---');
        const toolsResponse = await sendMcpRequest('tools/list', {});

        if (toolsResponse.result?.tools) {
            console.log(`✅ [MCP Test] Found ${toolsResponse.result.tools.length} tools:`);
            toolsResponse.result.tools.forEach(tool => {
                console.log(`   - ${tool.name}: ${tool.description}`);
            });
        } else {
            console.log('❌ [MCP Test] Failed to list tools');
            process.exit(1);
        }

        // Test 3: Connect to Device
        console.log('\n🔵 [MCP Test] --- Test 3: Connect to Device ---');
        console.log(`📍 [MCP Test] Using device: ${process.env.deviceName}`);

        const connectResponse = await sendMcpRequest('tools/call', {
            name: 'connect_to_device',
            arguments: {
                projectKey: process.env.projectKey,
                projectSecret: process.env.projectSecret,
                deviceName: process.env.deviceName
            }
        });

        // Extract session token and device UUID from response
        let sessionToken, deviceuuid;
        if (connectResponse.result?.content?.[0]?.text) {
            const data = JSON.parse(connectResponse.result.content[0].text);
            sessionToken = data.sessionToken;
            deviceuuid = data.deviceuuid;

            console.log('✅ [MCP Test] Device connected successfully');
            console.log(`🔑 [MCP Test] Session Token: ${sessionToken}`);
            console.log(`🆔 [MCP Test] Device UUID: ${deviceuuid}`);
            console.log(`📊 [MCP Test] Status: ${data.status}`);
        } else {
            console.log('❌ [MCP Test] Device connection failed');
            process.exit(1);
        }

        // Test 4: Execute Terminal Command
        if (sessionToken && deviceuuid) {
            console.log('\n🔵 [MCP Test] --- Test 4: Execute Terminal Command ---');
            const testCommand = 'date';
            console.log(`💻 [MCP Test] Executing command: ${testCommand}`);

            const executeResponse = await sendMcpRequest('tools/call', {
                name: 'execute_terminal_command',
                arguments: {
                    sessionToken: sessionToken,
                    deviceuuid: deviceuuid,
                    command: testCommand
                }
            });

            if (executeResponse.result?.content?.[0]?.text) {
                const result = JSON.parse(executeResponse.result.content[0].text);
                if (result.success) {
                    console.log('✅ [MCP Test] Command executed successfully');
                    console.log(`📤 [MCP Test] Command result: ${result.result.commandResult}`);
                    console.log(`🏁 [MCP Test] Ended on terminal: ${result.result.lastCommandEndedOnTerminal}`);
                } else {
                    console.log('❌ [MCP Test] Command execution failed');
                    process.exit(1);
                }
            } else {
                console.log('❌ [MCP Test] Failed to execute command');
                process.exit(1);
            }
        } else {
            console.log('\n⚠️ [MCP Test] --- Test 4: Skipped (no session token) ---');
            process.exit(1);
        }

        console.log('\n🎉 [MCP Test] === All tests completed ===\n');

    } catch (error) {
        console.error('❌ [MCP Test] Test error:', error.message);
        if (error.cause) {
            console.error('❌ [MCP Test] Cause:', error.cause);
        }
        process.exit(1);
    }
}

// Run tests
console.log('🏁 [MCP Test] Starting MCP server tests...');
testMcpServer();