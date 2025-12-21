import express from 'express';
import { awaBerryAgenticMcpServer } from './awaBerryAgenticHttpServer.js';

const mcpServer = new awaBerryAgenticMcpServer();
const app = express();
const PORT = 8090;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to connect to a device
app.post('/connect', async (req, res) => {
  try {
    const { projectKey, projectSecret, deviceName } = req.body;
    if (!projectKey || !projectSecret || !deviceName) {
      return res.status(400).json({ error: 'Missing required parameters for /connect' });
    }
    const result = await mcpServer.connectToDevice(projectKey, projectSecret, deviceName);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Endpoint to execute a command
app.post('/execute', async (req, res) => {
  try {
    const { sessionToken, deviceuuid, command } = req.body;
    if (!sessionToken || !deviceuuid || !command) {
      return res.status(400).json({ error: 'Missing required parameters for /execute' });
    }
    const result = await mcpServer.executeCommand(sessionToken, deviceuuid, command);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Handle 404 for any other routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /connect');
  console.log('  POST /execute');
});
