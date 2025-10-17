/**
 * This test file reads session details from a .env file, prompts the user
 * for a command via the console, and then calls the executeCommand function.
 *
 * To run this test:
 * 1. Make sure you have a .env file in the root of the project with:
 *    sessionToken=your_session_token
 *    deviceuuid=your_device_uuid
 *    (You can generate these by running `node test/testConnectToDevice.js` first)
 * 2. Run `npm install dotenv` if you haven't already.
 * 3. Execute this file from your terminal: `node test/testExecuteCommand.js`
 */

import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { executeCommand } from '../../src/executecommand.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  const { sessionToken, deviceuuid } = process.env;

  if (!sessionToken || !deviceuuid) {
    console.error('Error: Please ensure sessionToken and deviceuuid are set in your .env file.');
    console.log('You can generate them by running `node test/testConnectToDevice.js` first.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // Define a recursive function to create a command loop
  function askForCommand() {
    rl.question("Enter command or type 'exit' to exit: ", async (command) => {
      const trimmedCommand = command.trim();

      // Check for the exit condition
      if (trimmedCommand.toLowerCase() === 'exit') {
        console.log('Exiting...');
        rl.close();
        return;
      }

      // If the command is not empty, execute it
      if (trimmedCommand) {
        console.log(`Executing command: "${trimmedCommand}"...`);
        const result = await executeCommand(sessionToken, deviceuuid, trimmedCommand);
        console.log('Command execution result:', result);


          if (result && result.success) {
              console.log('✅ Method execution was succesfull');
          }
          else
          {
              console.log('❌Method execution failed - response : ' , result);
          }
      }


      // Loop back to ask for the next command
      askForCommand();
    });
  }

  // Start the command loop
  askForCommand();
}

main();