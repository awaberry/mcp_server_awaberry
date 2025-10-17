import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './awaBerryAgenticMcpServer.js';
import winston from 'winston';

// Configure the logger for stdio wrapper
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

logger.info('🚀 [MCP Server] awaberry-mcp-server starting on stdio');

// Create the shared MCP server
const server = createMcpServer();

// Connect stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

logger.info('✅ [MCP Server] running on stdio');