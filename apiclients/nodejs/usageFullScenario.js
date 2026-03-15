const readline = require('readline');
const AwaberryApiRequestClient = require('./awaberryApiRequestClient');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const [,, projectKeyArg, projectSecretArg] = process.argv;

const getCredentials = async () => {
  if (projectKeyArg && projectSecretArg) {
    return { projectKey: projectKeyArg, projectSecret: projectSecretArg };
  }
  return new Promise((resolve) => {
    rl.question('Enter your Project Key: ', (projectKey) => {
      rl.question('Enter your Project Secret: ', (projectSecret) => {
        resolve({ projectKey, projectSecret });
      });
    });
  });
};

(async () => {
  const { projectKey, projectSecret } = await getCredentials();
  const client = new AwaberryApiRequestClient(
    'https://agentic.awaberry.net/apirequests',
    projectKey,
    projectSecret
  );
  try {
    const projectRes = await client.getProject();
    const setup = JSON.parse(projectRes.agentprojectsetup);
    const setupEntries = setup.setupEntries;

    let deviceuuid;
    if (projectRes && Array.isArray(setupEntries)) {
      console.log('Available devices:');
      setupEntries.forEach(entry => {
        console.log(`${entry.deviceName}. uuid: ${entry.deviceuuid}`);
      });
      if (setupEntries.length === 1) {
        deviceuuid = setupEntries[0].deviceuuid;
        console.log(`Using only available device: ${deviceuuid}`);
      }
    } else {
      console.log('No devices found.');
      rl.close();
      return;
    }

    await client.initSession();
    console.log('Session initialized successfully.');

    const connectDevice = async (uuid) => {
      const connectionRes = await client.startDeviceConnection(uuid);
      console.log('Device connection started:', connectionRes);

      const statusRes = await client.getDeviceConnectionStatus(uuid);
      console.log('Device connection status:', statusRes);

      if (statusRes) {
        console.log("ready to enter commands - type 'exit' to quit");
        const commandLoop = async () => {
          rl.question("type next command: ", async (commandToExecute) => {
            if (commandToExecute === 'exit') {
              rl.close();
              return;
            }
            const result = await client.executeCommand(uuid, commandToExecute);
            console.log('endedOnTerminal:', result.lastCommandEndedOnTerminal, " | Result : " , result.commandResult);
            commandLoop();
          });
        };
        commandLoop();
      } else {
        rl.close();
      }
    };

    if (deviceuuid) {
      await connectDevice(deviceuuid);
    } else {
      rl.question('Enter Device UUID to connect: ', async (inputUuid) => {
        await connectDevice(inputUuid);
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
    rl.close();
  }
})();