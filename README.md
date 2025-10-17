# awaberry Remote MCP Server

A Node.js MCP server to remote connect to devices without the need for SSH, VPN and open ports to manage files, connect to databases and execute terminal commands in a persistent long running terminal session.

This is a JavaScript-based MCP server that provides remote device access through the awaBerry platform. It demonstrates core MCP concepts by providing:

- Integration with the awaberry Agentic platform
- Secure device connection management
- Remote terminal command execution
- Session-based authentication

## Prerequisites

An account at app.awaberry.com and a device linked to awaBerry Remote.

1. Sign up at [awaberry Remote](https://app.awaberry.com/).
2. Add one or more devices.
3. Create a new project under section awaBerryAgentic.
4. Register your devices with the project.
5. Copy your project key and secret from the project settings.

Read more about awaBerry at [www.awaberry.com](https://www.awaberry.com/)

## Features

### Tools

**`connect_to_device`**

Connects to a remote device (Mac, Linux, Windows, or Docker) registered in your awaberry project.

- **Parameters:**
  - `projectKey` (optional): Project authentication key (defaults to `AWABERRY_PROJECT_KEY` env var).
  - `projectSecret` (optional): Project authentication secret (defaults to `AWABERRY_PROJECT_SECRET` env var).
  - `deviceName` (required): Name of the device to connect to.

- **Returns:**
  - `sessionToken` (string): Authentication token for the session.
  - `status` (string): Connection status ("connected" or "notconnected").
  - `deviceuuid` (string): Unique identifier for the device.

The sessionToken is valid for 30 minutes from connection start.

**`execute_terminal_command`**

Executes terminal commands on a connected device to manage files, connect to databases and execute terminal commands in a persistent long running terminal session.

On reconnecting to the device, the last state of the terminal is available - this allows also to start long running commands and get the results ones available.

- **Parameters:**
  - `sessionToken` (required): Session token from the device connection.
  - `deviceuuid` (required): Device UUID to execute the command on.
  - `command` (required): Terminal command to execute.

- **Returns:**
  - `success` (boolean): Indicates if the command was accepted for execution.
  - `result.commandResult` (string): Output from the command.
  - `result.lastCommandEndedOnTerminal` (boolean): Indicates if the command process has completed.

## Setup

### Prerequisites

- Node.js >= 18 ([Download](https://nodejs.org/)).
- Git installed ([Download](https://git-scm.com/downloads)).

### Installation

```bash
# Clone the repository
git clone https://github.com/awaberry/mcp_server_awaberry.git
cd mcp_server_awaberry

# Install dependencies
npm install
```

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



## Setup in Claude Desktop

To use with Claude Desktop, add the server configuration to your `claude_desktop_config.json` file.

- **On macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **On Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

### Configuration of MCP on same device

To access the awaBerry with the configuration on the same device such as Claude Desktop (i.e. your Laptop / PC), use the 
stdio version

```json
{
  "mcpServers": {
    "awaberry": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp_server_awaberry/mcpserver/awaBerryAgenticMcpServerStdio.js"
      ],
      "env": {
        "AWABERRY_PROJECT_KEY": "your_project_key_here",
        "AWABERRY_PROJECT_SECRET": "your_project_secret_here"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/mcp_server_awaberry` with the actual absolute path to your installation (e.g., `/Users/username/projects/mcp_server_awaberry`).


### Configuration of MCP via an installed server instance

To use the JSON based instance, use the json version

```json
{
  "mcpServers": {
    "awaberry": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-everything",
        "${AWABERRY_MCP_SERVER_URL}"
      ],
      "env": {
        "AWABERRY_MCP_SERVER_URL": "https://your-worker.workers.dev/mcp",
        "AWABERRY_PROJECT_KEY": "your_project_key_here",
        "AWABERRY_PROJECT_SECRET": "your_project_secret_here"
      }
    }
  }
}

```

**Important:** Replace `AWABERRY_MCP_SERVER_URL` with the URL of the deployed MCP JSON server endpoint. Ensure the URL ends with /mcp, e.g. http://your-worker.workers.dev/mcp




### Usage Examples

Once configured, restart Claude Desktop and use natural language to interact with your devices:

- **Connect to a device:**
  > Connect to my device "laptop-macos"

- **List files:**
  > Show me all files in /Users/myuser/Documents

- **Read a file:**
  > Read the contents of /etc/hosts

- **Execute complex commands:**
  > Find all JavaScript files modified in the last 7 days in my home directory

- **Run scripts:**
  > Execute the backup script at ~/scripts/backup.sh
  
## Logging

All activity is logged to `activitylog.log` in the project root directory. Logs include:

- Tool invocations with timestamps
- Connection attempts and results
- Command executions and outputs
- Errors and warnings

**Example log output:**

```
2025-01-15 10:30:45 [INFO]: 📥 [Tool] connect_to_device called
2025-01-15 10:30:45 [INFO]: 📋 [Tool] Device name: laptop-macos
2025-01-15 10:30:46 [INFO]: ✅ [Tool] connect_to_device successful - Session: a1b2c3d4...
```

## Rate Limits

Rate limits are enforced by the awaberry platform:

- **Connection attempts:** As needed.
- **Command executions:** Based on your plan tier.

Check your plan details at [awaberry Agentic](https://www.awaberry.com/) for specific limits.

## Troubleshooting

### Server doesn't start

- Ensure Node.js >= 18 is installed: `node --version`
- Check that all dependencies are installed: `npm install`
- Verify the file path in `claude_desktop_config.json` is absolute and correct.
- Check for syntax errors in the config JSON file.

### Connection fails

- Verify your project key and secret are correct in the environment variables.
- Ensure the device name matches exactly (it is case-sensitive).
- Check that the device is online and connected to awaberry.
- Review `activitylog.log` for detailed error messages.
- Confirm the device is registered in your awaberry project.

### Commands don't execute

- Verify the session token is valid.
- Check that the device is still connected.
- Ensure the command syntax is correct for the target OS.
- Review command output in `activitylog.log`.
- Check device permissions for the command you're trying to run.

### Claude Desktop doesn't show the MCP server

- Restart Claude Desktop after modifying the config file.
- Check the JSON syntax in `claude_desktop_config.json`.
- Ensure the file path uses forward slashes (`/`) or properly escaped backslashes (`\\`).
- Look for errors in Claude Desktop's logs.

## Security Considerations

- Store your `AWABERRY_PROJECT_KEY` and `AWABERRY_PROJECT_SECRET` securely.
- Never commit credentials to version control.
- Use environment variables for sensitive configuration.
- Session tokens are temporary and expire automatically.
- All communication with awaberry servers uses HTTPS.

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or contact us.
- **Contact us:** [www.awaberry.com/contact](https://www.awaberry.com/contact)

## Support

For documentation and questions:

- **awaberry Documentation:** [www.awaberry.com/manual](https://www.awaberry.com/manual)
- **awaberry Support:** [www.awaberry.com/support](https://www.awaberry.com/support)

