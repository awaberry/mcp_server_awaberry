import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envFilePath });

const SERVER_URL = 'http://localhost:8090';

async function testHttpServer() {
  const projectKey = process.env.projectKey;
  const projectSecret = process.env.projectSecret;
  const deviceName = process.env.deviceName;

  if (!projectKey || !projectSecret || !deviceName) {
    console.error('Error: Please make sure projectKey, projectSecret, and deviceName are defined in your .env file.');
    return;
  }

  try {
    // 1. Connect to the device
    console.log('Attempting to connect to device...');
    const connectResponse = await fetch(`${SERVER_URL}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectKey, projectSecret, deviceName })
    });

    const connectResult = await connectResponse.json();
    console.log('Connection Response:', JSON.stringify(connectResult, null, 2));

    // 2. If connected, execute a command
    if (connectResult.status === 'connected') {
      console.log('\nDevice connected. Executing command...');
      const { sessionToken, deviceuuid } = connectResult;
      const command = process.env.command || 'date'; // Use command from .env or default to 'date'

      const executeResponse = await fetch(`${SERVER_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, deviceuuid, command })
      });

      const executeResult = await executeResponse.json();
      console.log('Execute Command Response:', JSON.stringify(executeResult, null, 2));
    } else {
      console.log('\nCould not execute command because device connection failed.');
    }

  } catch (error) {
    console.error('An error occurred during the test:', error);
  }
}

testHttpServer();
