## Setup MCP Server on local environments or at Cloudflare

If you have received the awaBerry MCP Server URL (e.g. to use for your company), there is no need to do the installation.

For setting an own server, e.g. in Cloudflare, follow the instructions in section JSON based MCP Server.

See [JSON server configuration in Claude Desktop](#claude-json-server-config) for the required setup.

### Prerequisites

- Node.js >= 18 ([Download](https://nodejs.org/)).
- Git installed ([Download](https://git-scm.com/downloads)).



### Available MCP Server Implementations

#### JSON based MCP Server

The JSON based MCP server is the best choice in company setups. Install one instance which can be accessed by all employees.

- On premise installation

See mcpserver/awaBerryAgenticMcpServerHttpJson.js as a reference implementation of the awaBerry MCP server on a server running in the company intranet or cloud.

- Cloudflare installation

To deploy a Cloudflare worker instance, follow the instructions of [README.md](cloudflare/worker/awaberrymcpserver/README.md) in folder cloudflare/worker/awaberrymcpserver

### Run & Test

Before using this MCP server within Agent environments, it is recommended to test the awaBerry project credentials

#### Method test

Test the correct awaBerry Agentic project setup by calling the methods to connect to device and execute commands directly.

Follow the instructions of [README.md](test/methodtest/README.md) in folder test/methodtest.

#### MCP server test to remote server via json

Follow the setup routines in the previous section before testing the mcp server.

- Test MCP server json mode :
  In a terminal screen A execute
```bash
  npm run start:mcp:json
```

In a terminal screen B execute
```bash
  npm run test:mcp:json
```


- Test MCP server stdio mode :
  In a terminal screen A execute
```bash
  npm run start:mcp:stdio
```

In a terminal screen B execute
```bash
  npm run test:mcp:stdio
```
