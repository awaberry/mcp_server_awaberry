# awaberry MCP Server - Cloudflare Worker

This directory contains the implementation of the awaberry MCP server as a Cloudflare Worker. 

It provides a serverless, globally distributed endpoint for connecting to your devices and executing commands via the awaberry Agentic platform.

Read more about awaBerry at [www.awaberry.com](https://www.awaberry.com/)

## 1. Prerequisites

- You have a [Cloudflare account](https://dash.cloudflare.com/sign-up).
- You have an [awaberry Agentic](https://app.awaberry.com/) account with a project and at least one device registered.
- You have Node.js and npm installed ([Download](https://nodejs.org/)).

## 2. Initial Setup

### Install Wrangler CLI

Wrangler is the command-line tool for building and managing Cloudflare Workers. If you don't have it installed, run the following command:

```bash
npm install -g wrangler
```

### Log in to Cloudflare

Connect Wrangler to your Cloudflare account. This will open a browser window asking you to log in and authorize the CLI.

```bash
wrangler login
```

## 3. Running Locally for Development

Running the worker locally is the recommended way to test its functionality before deploying.

### Start the Local Server

From within this directory (`cloudflare/worker/awaberrymcpserver`), start the development server.

```bash
wrangler dev
```

Wrangler will start a local server, typically on `http://localhost:8787`. You will see output similar to this:

```
[wrangler] Ready on http://localhost:8787
```

### Test the Local Server

In the .env file of the root directory of this project, add

    mcpServerUrl = "http://localhost:3000/mcp"

In a second terminal from root folder of this project execute

```bash    
    npm run test:mcp:json
```

The test output should end with

```
🏁 [MCP Test] Ended on terminal: true

🎉 [MCP Test] === All tests completed ===
```

## 4. Deploying to Cloudflare

Once you have tested your worker locally, you can deploy it to the Cloudflare global network.


### Deploy the Worker

Deploy the worker to your Cloudflare account.

```bash
wrangler deploy
```

After a successful deployment, Wrangler will output your worker's public URL, for example: `https://awaberrymcpserver.<your-subdomain>.workers.dev`.

### Test the Deployed Worker

You can test the live worker in the same way you tested the local one, just by replacing the URL in the .env File.

    mcpServerUrl = "https://awaberrymcpserver.<your-subdomain>.workers.dev/mcp"

Your MCP server is now running on Cloudflare and can be used as a serverless endpoint for your agents.



## Support

For documentation and questions:

- **awaberry Documentation:** [www.awaberry.com/manual](https://www.awaberry.com/manual)
- **awaberry Support:** [www.awaberry.com/support](https://www.awaberry.com/support)