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
            description: "Connect to a device via awaBerry Remote without the need for ssh/scp/firewalls. This establishes a secure terminal connection to manage files, connect to databases and execute terminal commands in a persistent long running terminal session.",
            inputSchema: {
                projectKey: z.string().optional().describe('The project key for authentication'),
                projectSecret: z.string().optional().describe('The project secret for authentication'),
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

                // Parse error for device name mismatch
                let errorMessage = error.message;
                let availableDevices = null;

                try {
                    const errorData = JSON.parse(error.message);
                    if (errorData.error && errorData.error.includes('not found') && errorData.availableDevices) {
                        availableDevices = errorData.availableDevices;
                        errorMessage = `Device '${deviceName}' not found. Available devices: ${availableDevices.join(', ')}. Please retry with the correct device name from this list.`;
                    }
                } catch (parseError) {
                    // Not JSON or different error format, use original message
                }

                const errorResult = {
                    sessionToken: '',
                    status: 'error',
                    deviceuuid: '',
                    error: errorMessage,
                    ...(availableDevices && { availableDevices })
                };

                return {
                    content: [{
                        type: 'text',
                        text: availableDevices
                            ? `❌ Connection failed: Device '${deviceName}' not found.\n\n📋 Available devices:\n${availableDevices.map(d => `  • ${d}`).join('\n')}\n\nPlease use connect_to_device again with one of these device names.`
                            : JSON.stringify(errorResult)
                    }],
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


    // Tool 3: Execute Database Command
    server.registerTool(
        'execute_database_command_postgres',
        {
            title: 'Execute Database Command in PostgreSQL',
            description: 'Execute a PostgreSQL command via awaBerry Remote and return the results. Automatically handles output file creation and cleanup.',
            inputSchema: {
                sessionToken: z.string().describe('The session token from device connection'),
                deviceuuid: z.string().describe('The device UUID to execute the command on'),
                user: z.string().describe('PostgreSQL username'),
                database: z.string().describe('PostgreSQL database name'),
                sqlCommand: z.string().describe('SQL command to execute'),
                outputFile: z.string().optional().default('psql_output.txt').describe('Temporary file for command output')
            },
            outputSchema: {
                success: z.boolean(),
                sqlResult: z.string(),
                error: z.string().optional()
            }
        },
        async ({ sessionToken, deviceuuid, user, database, sqlCommand, outputFile }) => {
            logger.info(`📥 [Tool] execute_database_command called`);
            logger.info(`📋 [Tool] Database: ${database}, User: ${user}`);

            try {
                // Step 1: Execute psql command
                const psqlCommand = `psql -U ${user} -d ${database} -c "${sqlCommand}" -o ${outputFile}`;
                logger.info(`📋 [Tool] Executing: ${psqlCommand}`);

                const execResult = await executeCommand(sessionToken, deviceuuid, psqlCommand);

                if (!execResult.success) {
                    throw new Error(`psql command failed: ${execResult.result.commandResult}`);
                }

                // Step 2: Read the output file
                const catCommand = `cat ${outputFile}`;
                const readResult = await executeCommand(sessionToken, deviceuuid, catCommand);

                if (!readResult.success) {
                    throw new Error(`Failed to read output file: ${readResult.result.commandResult}`);
                }

                const result = {
                    success: true,
                    sqlResult: readResult.result.commandResult
                };

                logger.info(`✅ [Tool] execute_database_command successful`);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result) }],
                    structuredContent: result
                };

            } catch (error) {
                logger.error(`❌ [Tool] execute_database_command failed: ${error.message}`);
                const errorResult = {
                    success: false,
                    sqlResult: '',
                    error: error.message
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResult) }],
                    structuredContent: errorResult
                };
            }
        }
    );


    // Tool 4: Describe Database Schema
    server.registerTool(
        'describe_database_schema_postgres',
        {
            title: 'Describe PostgreSQL Database Schema',
            description: 'Retrieve the schema information for tables in a PostgreSQL database. Returns column names, types, and constraints. Use this to understand table structure before writing SQL queries.',
            inputSchema: {
                sessionToken: z.string().describe('The session token from device connection'),
                deviceuuid: z.string().describe('The device UUID to execute the command on'),
                user: z.string().describe('PostgreSQL username'),
                database: z.string().describe('PostgreSQL database name'),
                tableName: z.string().optional().describe('Specific table name to describe (omit to list all tables)')
            },
            outputSchema: {
                success: z.boolean(),
                schema: z.string(),
                error: z.string().optional()
            }
        },
        async ({ sessionToken, deviceuuid, user, database, tableName }) => {
            logger.info(`📥 [Tool] describe_database_schema called`);
            logger.info(`📋 [Tool] Database: ${database}, Table: ${tableName || 'all tables'}`);

            try {
                let sqlCommand;

                if (tableName) {
                    // Get detailed schema for specific table
                    sqlCommand = `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default 
                                 FROM information_schema.columns 
                                 WHERE table_schema = 'public' AND table_name = '${tableName}' 
                                 ORDER BY ordinal_position;`;
                } else {
                    // List all tables in the database
                    sqlCommand = `SELECT table_name, table_type 
                                 FROM information_schema.tables 
                                 WHERE table_schema = 'public' 
                                 ORDER BY table_name;`;
                }

                const outputFile = 'schema_output.txt';
                const psqlCommand = `psql -U ${user} -d ${database} -c "${sqlCommand}" -o ${outputFile}`;
                logger.info(`📋 [Tool] Executing: ${psqlCommand}`);

                const execResult = await executeCommand(sessionToken, deviceuuid, psqlCommand);

                if (!execResult.success) {
                    throw new Error(`psql command failed: ${execResult.result.commandResult}`);
                }

                const catCommand = `cat ${outputFile}`;
                const readResult = await executeCommand(sessionToken, deviceuuid, catCommand);

                if (!readResult.success) {
                    throw new Error(`Failed to read output file: ${readResult.result.commandResult}`);
                }

                const result = {
                    success: true,
                    schema: readResult.result.commandResult
                };

                logger.info(`✅ [Tool] describe_database_schema successful`);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result) }],
                    structuredContent: result
                };

            } catch (error) {
                logger.error(`❌ [Tool] describe_database_schema failed: ${error.message}`);
                const errorResult = {
                    success: false,
                    schema: '',
                    error: error.message
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