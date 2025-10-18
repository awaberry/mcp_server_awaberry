#!/usr/bin/env node

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config
const configPath = path.join(__dirname, 'awaberry-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Forward MCP request with injected credentials
export async function sendMcpRequest(method, params) {
    // Inject credentials into tool call arguments
    if (method === 'tools/call' && params.arguments) {
        const args = {
            ...params.arguments,
            projectKey: config.env.AWABERRY_PROJECT_KEY,
            projectSecret: config.env.AWABERRY_PROJECT_SECRET
        };
        params = { ...params, arguments: args };
    }

    const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: method,
        params: params
    };

    const response = await fetch(config.serverUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify(request)
    });

    return await response.json();
}


// If run directly (not imported), act as stdio MCP server
if (import.meta.url === `file://${process.argv[1]}`) {
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const { ListToolsRequestSchema, CallToolRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');

    const server = new Server({
        name: 'awaberry-mcp-client',
        version: '1.0.0'
    }, {
        capabilities: {
            tools: {}
        }
    });

    // Forward all tool calls through sendMcpRequest
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        const response = await sendMcpRequest('tools/list', {});
        return response.result;
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const response = await sendMcpRequest('tools/call', request.params);
        return response.result;
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
}