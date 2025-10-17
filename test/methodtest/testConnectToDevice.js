/**
 * This test file reads connection details from a .env file
 * in the project root and uses them to call the connectToDevice function.
 *
 * To run this test:
 * 1. Make sure you have a .env file in the root of the project with:
 *    projectKey=your_key
 *    projectSecret=your_secret
 *    deviceName=your_device_name
 * 2. Run `npm install dotenv` if you haven't already.
 * 3. Execute this file from your terminal: `node test/testConnectToDevice.js`
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectToDevice } from '../../src/connecttodevice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envFilePath });

/**
 * Updates the .env file with new key-value pairs.
 * @param {object} newData - An object containing the keys and values to update.
 */
function updateEnvFile(newData) {
  console.log('Updating .env file with new session details...');
  let envContent = '';
  if (fs.existsSync(envFilePath)) {
    envContent = fs.readFileSync(envFilePath, 'utf-8');
  }

  let lines = envContent.split('\n');
  const keysToUpdate = Object.keys(newData);

  // Filter out the old keys we want to replace
  lines = lines.filter(line => !keysToUpdate.some(key => line.startsWith(`${key}=`)));

  // Add the new key-value pairs
  keysToUpdate.forEach(key => lines.push(`${key}=${newData[key]}`));

  fs.writeFileSync(envFilePath, lines.join('\n').trim());
  console.log('.env file updated successfully.');
}

async function main() {
  const { projectKey, projectSecret, deviceName } = process.env;

  if (!projectKey || !projectSecret || !deviceName) {
    console.error('Error: Please ensure projectKey, projectSecret, and deviceName are set in your .env file.');
    return;
  }

  const result = await connectToDevice(projectKey, projectSecret, deviceName);
  console.log('Connection attempt result:', result);

  // If connection is successful, update the .env file
  if (result && result.status === 'connected') {
    updateEnvFile({ sessionToken: result.sessionToken, deviceuuid: result.deviceuuid });

    console.log('✅ Method execution was succesfull');
  }
  else
  {
      console.log('❌Method execution failed - response : ' , result);
  }
}

main();