import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import winston from 'winston';
import { connectToDevice } from '../src/connecttodevice.js';
import { executeCommand } from '../src/executecommand.js';

// Configure the logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new winston.transports.File({ filename: 'activitylog.log' })
    ],
});

// Store current connection state
let currentConnection = null;

// Create and configure MCP server
export function createMcpServer() {
    const server = new McpServer({
        name: 'awaberry-mcp-server',
        version: '1.0.0'
    });

    // Tool 1: Connect to Device
    server.registerTool(
        'connect_to_device',
        {
            title: 'Connect to Device',
            description: 'Connects to a MAC, Linux, Windows or Docker environment linked via awaberry to execute commands on terminal',
            inputSchema: {
                projectKey: z.string().optional().describe('The project key for authentication (defaults to AWABERRY_PROJECT_KEY env var)'),
                projectSecret: z.string().optional().describe('The project secret for authentication (defaults to AWABERRY_PROJECT_SECRET env var)'),
                deviceName: z.string().describe('The name of the device to connect to')
            },
            outputSchema: {
                sessionToken: z.string(),
                status: z.string(),
                deviceuuid: z.string()
            }
        },
        async ({ projectKey, projectSecret, deviceName }) => {
            logger.info(`📥 [Tool] connect_to_device called`);
            logger.info(`📋 [Tool] Device name: ${deviceName}`);

            const key = projectKey || process.env.AWABERRY_PROJECT_KEY;
            const secret = projectSecret || process.env.AWABERRY_PROJECT_SECRET;

            if (!key || !secret) {
                const errorResult = {
                    sessionToken: '',
                    status: 'error',
                    deviceuuid: '',
                    error: 'Project key and secret required (provide as arguments or set AWABERRY_PROJECT_KEY and AWABERRY_PROJECT_SECRET env vars)'
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult) }],
                    structuredContent: errorResult
                };
            }

            try {
                const result = await connectToDevice(key, secret, deviceName);

                // Store connection state
                if (result.status === 'connected') {
                    currentConnection = {
                        deviceName,
                        sessionToken: result.sessionToken,
                        deviceuuid: result.deviceuuid,
                        connectedAt: new Date().toISOString()
                    };
                    logger.info(`✅ [Connection State] Stored: ${JSON.stringify(currentConnection)}`);
                }

                logger.info(`✅ [Tool] connect_to_device successful - Session: ${result.sessionToken?.substring(0, 8)}...`);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result) }],
                    structuredContent: result
                };
            } catch (error) {
                logger.error(`❌ [Tool] connect_to_device failed: ${error.message}`);
                const errorResult = {
                    sessionToken: '',
                    status: 'error',
                    deviceuuid: '',
                    error: error.message
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult) }],
                    structuredContent: errorResult
                };
            }
        }
    );

    // Tool 2: Execute Terminal Command
    server.registerTool(
        'execute_terminal_command',
        {
            title: 'Execute terminal command',
            description: 'Executes a terminal command - can be calling a script as well as querying a database or reading a file or writing to a file.',
            inputSchema: {
                sessionToken: z.string().describe('The session token from device connection'),
                deviceuuid: z.string().describe('The device UUID to execute the command on'),
                command: z.string().describe('The terminal command to execute')
            },
            outputSchema: {
                success: z.boolean(),
                result: z.object({
                    commandResult: z.string(),
                    lastCommandEndedOnTerminal: z.boolean()
                })
            }
        },
        async ({ sessionToken, deviceuuid, command }) => {
            logger.info(`📥 [Tool] execute_terminal_command called`);
            logger.info(`📋 [Tool] Command: ${command}`);
            logger.info(`📋 [Tool] Device UUID: ${deviceuuid}`);
            try {
                const result = await executeCommand(sessionToken, deviceuuid, command);
                logger.info(`✅ [Tool] execute_terminal_command successful`);
                logger.info(`📤 [Tool] Result length: ${result.result?.commandResult?.length || 0} chars`);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result) }],
                    structuredContent: result
                };
            } catch (error) {
                logger.error(`❌ [Tool] execute_terminal_command failed: ${error.message}`);
                const errorResult = {
                    success: false,
                    result: {
                        commandResult: error.message,
                        lastCommandEndedOnTerminal: false
                    }
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult) }],
                    structuredContent: errorResult
                };
            }
        }
    );

    return server;
}