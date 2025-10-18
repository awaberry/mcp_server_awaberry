import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendMcpRequest } from '../../mcpclients/start-awaberry-mcp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFilePath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envFilePath });

if (result.error) {
    console.error('❌ [MCP Test] Error loading .env file:', result.error);
    process.exit(1);
}

console.log(`✅ [MCP Test] Loaded environment from: ${envFilePath}`);
console.log('- DEVICE_NAME:', process.env.deviceName ? '✓' : '✗');

if (!process.env.deviceName) {
    console.error('\n❌ [MCP Test] Missing required environment variable: deviceName');
    process.exit(1);
}

async function testMcpServer() {
    try {
        console.log('\n🚀 [MCP Test] === Testing via start-awaberry-mcp.js ===\n');

        // Test 1: Initialize
        console.log('🔵 [MCP Test] --- Test 1: Initialize ---');
        const initResponse = await sendMcpRequest('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' }
        });

        if (!initResponse.result) {
            console.log('❌ [MCP Test] Initialization failed');
            process.exit(1);
        }
        console.log('✅ [MCP Test] Initialized');

        // Test 2: List tools
        console.log('\n🔵 [MCP Test] --- Test 2: List Tools ---');
        const toolsResponse = await sendMcpRequest('tools/list', {});

        if (!toolsResponse.result?.tools) {
            console.log('❌ [MCP Test] Failed to list tools');
            process.exit(1);
        }
        console.log(`✅ [MCP Test] Found ${toolsResponse.result.tools.length} tools`);

        // Test 3: Connect (credentials auto-injected)
        console.log('\n🔵 [MCP Test] --- Test 3: Connect ---');
        const connectResponse = await sendMcpRequest('tools/call', {
            name: 'connect_to_device',
            arguments: { deviceName: process.env.deviceName }
        });

        let sessionToken, deviceuuid;
        if (connectResponse.result?.content?.[0]?.text) {
            const data = JSON.parse(connectResponse.result.content[0].text);
            sessionToken = data.sessionToken;
            deviceuuid = data.deviceuuid;
            console.log('✅ [MCP Test] Connected');
        } else {
            console.log('❌ [MCP Test] Connection failed');
            process.exit(1);
        }

        // Test 4: Execute command
        console.log('\n🔵 [MCP Test] --- Test 4: Execute Command ---');
        const executeResponse = await sendMcpRequest('tools/call', {
            name: 'execute_terminal_command',
            arguments: {
                sessionToken,
                deviceuuid,
                command: 'date'
            }
        });

        if (executeResponse.result?.content?.[0]?.text) {
            const result = JSON.parse(executeResponse.result.content[0].text);

            console.log("result : " , result);

            if (result.success) {
                console.log('✅ [MCP Test] Command executed');
            } else {
                console.log('❌ [MCP Test] Command failed');
                process.exit(1);
            }
        } else {
            console.log('❌ [MCP Test] Execute failed');
            process.exit(1);
        }

        console.log('\n🎉 [MCP Test] All tests passed\n');

    } catch (error) {
        console.error('❌ [MCP Test] Error:', error.message);
        process.exit(1);
    }
}

testMcpServer();