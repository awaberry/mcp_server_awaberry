import readline from 'readline';
import dotenv from 'dotenv';
import { executeCommand } from '../../src/executecommand.js';
import { getAdditionalCommandResults } from '../../src/getadditionalcommandresults.js';

// Load environment variables at the top of the file
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function testCommandExecution() {
  let shouldQuit = false;

  // Listen for 'q' to quit
  process.stdin.on('keypress', (str, key) => {
    if (str === 'q') {
      console.log('\n🛑 User requested quit...');
      shouldQuit = true;
    }
  });

  // Read from environment variables (lowercase to match .env)
  const sessionToken = process.env.sessionToken;
  const deviceuuid = process.env.deviceuuid;

  if (!sessionToken || !deviceuuid) {
    console.error('❌ sessionToken and deviceuuid must be set in .env file');
    rl.close();
    process.exit(1);
  }

  console.log(`📋 Using session token: ${sessionToken.substring(0, 8)}...`);
  console.log(`📋 Using device UUID: ${deviceuuid}`);

  const command = await new Promise(resolve => {
    rl.question('Enter command to execute: ', resolve);
  });

  console.log(`\n🚀 Executing command: ${command}`);

  try {
    // Initial command execution
    const initialResult = await executeCommand(sessionToken, deviceuuid, command);
    console.log('📥 Initial result:', JSON.stringify(initialResult, null, 2));

    if (!initialResult.success) {
      console.error('❌ Command execution failed');
      rl.close();
      return;
    }

    // Check if command ended
    let lastCommandEndedOnTerminal = initialResult.result?.lastCommandEndedOnTerminal;

    // Loop to get additional results
    while (!lastCommandEndedOnTerminal && !shouldQuit) {
      console.log('⏳ Command still running... sleeping 3 seconds');
      await sleep(3);

      if (shouldQuit) {
        console.log('🛑 Exiting loop due to user quit request');
        break;
      }

      console.log('📡 Fetching additional command results...');
      const additionalResult = await getAdditionalCommandResults(sessionToken, deviceuuid);
      console.log('📥 Additional result:', JSON.stringify(additionalResult, null, 2));

      if (additionalResult.success) {
        lastCommandEndedOnTerminal = additionalResult.result?.lastCommandEndedOnTerminal;

        if (lastCommandEndedOnTerminal) {
          console.log('✅ Command completed!');
          console.log('📋 Final output:', additionalResult.result?.commandResult);
        }
      } else {
        console.error('❌ Failed to get additional results:', additionalResult.error);
        break;
      }
    }

      if (!lastCommandEndedOnTerminal) {
          // Remove all keypress listeners
          process.stdin.removeAllListeners('keypress');

          // Disable raw mode
          if (process.stdin.isTTY) {
              process.stdin.setRawMode(false);
          }

          // Close and recreate readline interface to clear buffer
          rl.close();
          const freshRl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
          });

          const stopCmd = await new Promise(resolve => {
              freshRl.question('\n🛑 Enter stop command to send: ', resolve);
          });

          freshRl.close();

          if (stopCmd && stopCmd.trim().length > 0) {
              console.log(`📤 Sending stop command: ${stopCmd}`);
              try {
                  const stopResult = await executeCommand(sessionToken, deviceuuid, stopCmd);
                  console.log('📥 Stop command result:', JSON.stringify(stopResult, null, 2));
              } catch (err) {
                  console.error('❌ Error sending stop command:', err.message || err);
              }
          }
      }

    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Enable keypress events
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}
readline.emitKeypressEvents(process.stdin);

testCommandExecution();