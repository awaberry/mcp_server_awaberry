import readline from 'readline';
import AwaberryApiRequestClient from './awaberryapirequestclient.ts';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const [,, projectKeyArg, projectSecretArg] = process.argv;

const getCredentials = async (): Promise<{ projectKey: string; projectSecret: string }> => {
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
    const setupEntries: Array<{ deviceName: string; deviceuuid: string }> = setup.setupEntries;

    let deviceuuid: string | undefined;
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
    console.log('Session initialized successfully - startDeviceConnection - please wait');

    const connectionRes = await client.startDeviceConnection(deviceuuid!);
    console.log('Device connection started:', connectionRes);

    const statusRes = await client.getDeviceConnectionStatus(deviceuuid!);
    console.log('Device connection status:', statusRes);

    if (statusRes) {
      console.log("ready to send commands");

      // 1: write content testcontent\n\nthis is test content to file executiontest.txt
      const writeFile = 'echo "testcontent\\n\\nthis is test content" > executiontest.txt';
      const resultWriteFile = await client.executeCommand(deviceuuid!, writeFile);
      console.log("Response write file (empty output expected): ", resultWriteFile.commandResult);

      // 2: read content from executiontest.txt
      const readFile = 'cat executiontest.txt';
      const resultReadFile = await client.executeCommand(deviceuuid!, readFile);
      console.log("resultReadFile : ", resultReadFile);
      console.log("Response read file: ", resultReadFile.commandResult);

      rl.close();
    } else {
      rl.close();
    }
  } catch (err: any) {
    console.error('Error:', err.message);
    rl.close();
  }
})();