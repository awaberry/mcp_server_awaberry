import { spawn } from 'child_process';
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

// Spawn MCP server process
const serverPath = path.resolve(__dirname, '../../mcpserver/awaBerryAgenticMcpServerStdio.js');
const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
});

let requestId = 1;

// Helper to send JSON-RPC request via stdio
async function sendStdioRequest(method, params) {
    return new Promise((resolve, reject) => {
        const request = {
            jsonrpc: '2.0',
            id: requestId++,
            method: method,
            params: params
        };

        console.log(`\n🔵 [MCP Test] Sending ${method} request`);
        console.log('📤 [MCP Test] Request payload:', JSON.stringify(request, null, 2));

        let responseData = '';

        const dataHandler = (data) => {
            responseData += data.toString();
            try {
                const response = JSON.parse(responseData);
                console.log('📥 [MCP Test] Response received:', JSON.stringify(response, null, 2));
                serverProcess.stdout.off('data', dataHandler);
                resolve(response);
            } catch (e) {
                // Continue accumulating data
            }
        };

        serverProcess.stdout.on('data', dataHandler);

        setTimeout(() => {
            serverProcess.stdout.off('data', dataHandler);
            reject(new Error('Request timeout'));
        }, 30000);

        serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
}

async function testMcpServer() {
    try {
        console.log('\n🚀 [MCP Test] === Testing awaberry-mcp-server (stdio) ===\n');

        // Listen to server stderr for startup messages
        serverProcess.stderr.on('data', (data) => {
            console.log(`[Server]: ${data.toString().trim()}`);
        });

        // Wait for server to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 1: Initialize session
        console.log('🔵 [MCP Test] --- Test 1: Initialize MCP Session ---');
        const initResponse = await sendStdioRequest('initialize', {
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
            serverProcess.kill();
            process.exit(1);
        }

        // Test 2: List available tools
        console.log('\n🔵 [MCP Test] --- Test 2: List Available Tools ---');
        const toolsResponse = await sendStdioRequest('tools/list', {});

        if (toolsResponse.result?.tools) {
            console.log(`✅ [MCP Test] Found ${toolsResponse.result.tools.length} tools:`);
            toolsResponse.result.tools.forEach(tool => {
                console.log(`   - ${tool.name}: ${tool.description}`);
            });
        } else {
            console.log('❌ [MCP Test] Failed to list tools');
            serverProcess.kill();
            process.exit(1);
        }

        // Test 3: Connect to Device
        console.log('\n🔵 [MCP Test] --- Test 3: Connect to Device ---');
        console.log(`📍 [MCP Test] Using device: ${process.env.deviceName}`);

        const connectResponse = await sendStdioRequest('tools/call', {
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
            serverProcess.kill();
            process.exit(1);
        }

        // Test 4: Execute Terminal Command
        if (sessionToken && deviceuuid) {
            console.log('\n🔵 [MCP Test] --- Test 4: Execute Terminal Command ---');
            const testCommand = 'date';
            console.log(`💻 [MCP Test] Executing command: ${testCommand}`);

            const executeResponse = await sendStdioRequest('tools/call', {
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
                    serverProcess.kill();
                    process.exit(1);
                }
            } else {
                console.log('❌ [MCP Test] Failed to execute command');
                serverProcess.kill();
                process.exit(1);
            }
        } else {
            console.log('\n⚠️ [MCP Test] --- Test 4: Skipped (no session token) ---');
            serverProcess.kill();
            process.exit(1);
        }

        console.log('\n🎉 [MCP Test] === All tests completed ===\n');
        serverProcess.kill();

    } catch (error) {
        console.error('❌ [MCP Test] Test error:', error.message);
        if (error.cause) {
            console.error('❌ [MCP Test] Cause:', error.cause);
        }
        serverProcess.kill();
        process.exit(1);
    }
}

// Run tests
console.log('🏁 [MCP Test] Starting MCP server tests (stdio)...');
testMcpServer();