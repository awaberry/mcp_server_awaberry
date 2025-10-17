# Testing the MCP Server

This guide explains how to test the different transport versions of the awaBerry MCP server.

## Prerequisites

Before you begin, please follow the instructions in the `../httpservertest` folder to ensure the underlying API methods are working correctly with your project setup.

## Testing the JSON/HTTP Version

This test runs the MCP server over an HTTP endpoint that communicates via JSON.

### 1. Configure Environment

In the `.env` file located in the root directory of this project, add the following line:

Note: if your server is deployed on another environment already (e.g. Cloudflare), there is no need to start the local server.

```env
mcpServerUrl="http://localhost:3000/mcp"
```

### 2. Start the Server

In your first terminal, from the project's root folder, execute:

```bash
npm run start:mcp:json
```

You should see the following output, indicating the server is running:

```text
> mcp_server_awaberry@1.0.0 start:mcp
> node mcpserver/awaBerryAgenticMcpServerHttpJson.js

awaberry-mcp-server running on http://localhost:3000/mcp
```

### 3. Run the Test

In a second terminal, from the project's root folder, execute:

```bash
npm run test:mcp:json
```

This will run a test script that interacts with the running JSON server.

---

## Testing the Stdio Version

This test runs the MCP server over standard input/output, which is the mode used by clients like Claude Desktop.

### 1. Start the Server

In your first terminal, from the project's root folder, execute:

```bash
npm run start:mcp:stdio
```

You should see the following output:

```text
> mcp_server_awaberry@1.0.0 start:mcp:stdio
> node mcpserver/awaBerryAgenticMcpServerStdio.js

awaberry-mcp-server running on stdio
```

### 2. Run the Test

In a second terminal, from the project's root folder, execute:

```bash
npm run test:mcp:stdio
```

This will run a test script that communicates with the server via stdio.



## Support

For documentation and questions:

- **awaberry Documentation:** [www.awaberry.com/manual](https://www.awaberry.com/manual)
- **awaberry Support:** [www.awaberry.com/support](https://www.awaberry.com/support)