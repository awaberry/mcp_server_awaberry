import fetch from 'node-fetch';
import winston from 'winston';

const setserviceurl = "https://agentic.awaberry.net/apirequests";

// Configure the logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [

      new winston.transports.File({ filename: 'activitylog.log' })
  ],
});

async function callApi(endpoint, body) {
  const res = await fetch(setserviceurl + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }
  return await res.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function connectToDevice(projectKey, projectSecret, deviceName) {
  logger.info(`Attempting to connect to device: '${deviceName}'`);
  try {
    // 1. Get Project
    logger.info('Step 1: Fetching project details...');
    const projectData = await callApi('/getProject', { projectkey: projectKey, projectsecret: projectSecret });

    if (!projectData || !projectData.agentprojectsetup) {
      logger.error('Step 1 FAILED: Incorrect projectKey / projectSecret provided.');
      return { error: "incorrect projectKey / projectSecret" };
    }
    logger.info('Step 1 SUCCESS: Project details fetched.');

    // 2. Find Device UUID
    logger.info('Step 2: Parsing project setup and finding device UUID...');
    let agentSetup;
    try {
        agentSetup = JSON.parse(projectData.agentprojectsetup);
    } catch (e) {
        logger.error(`Step 2 FAILED: Could not parse agentprojectsetup JSON. Error: ${e.message}`);
        return { error: "failed to parse agentprojectsetup" };
    }
    
    const devices = agentSetup.setupEntries || [];
    const targetDevice = devices.find(entry => entry.deviceName === deviceName);

    if (!targetDevice || !targetDevice.deviceuuid) {
      const availableDevices = devices.map(entry => entry.deviceName);
      logger.error(`Step 2 FAILED: Device '${deviceName}' not found in project. Available devices: [${availableDevices.join(', ')}]`);
      return {
        error: `Device with name '${deviceName}' not found.`,
        availableDevices: availableDevices
      };
    }
    const deviceuuid = targetDevice.deviceuuid;
    logger.info(`Step 2 SUCCESS: Found device UUID: ${deviceuuid}`);

    // 3. Initialize Session
    logger.info('Step 3: Initializing session...');
    const sessionData = await callApi('/initSession', { projectkey: projectKey, projectsecret: projectSecret });
    const sessionToken = sessionData.sessionToken;

    if (!sessionToken) {
        logger.error('Step 3 FAILED: Did not receive a session token.');
        return { error: "Failed to initialize session." };
    }
    logger.info('Step 3 SUCCESS: Session initialized.');

    // 4. Start Device Connection
    logger.info('Step 4: Requesting to start device connection...');
    let isConnected = await callApi('/startDeviceConnection', { sessionToken, deviceuuid });
    logger.info('Step 4 SUCCESS: Start connection request sent.');

    // 5. Check connection status with retries
    logger.info('Step 5: Polling for connection status...');
    if (isConnected) {
      logger.info('Step 5 SUCCESS: Device reported as connected immediately.');
      return { sessionToken: sessionToken, status: "connected", deviceuuid: deviceuuid };
    } else {
      for (let i = 0; i < 20; i++) {
        await sleep(2000);
        logger.info(`Polling attempt ${i + 1}/20...`);
        isConnected = await callApi('/getDeviceConnectionStatus', { sessionToken, deviceuuid });
        if (isConnected) {
          logger.info('Step 5 SUCCESS: Device is connected.');
          return { sessionToken: sessionToken, status: "connected", deviceuuid: deviceuuid };
        }
      }
    }
    
    // 6. Return final status
    logger.warn('Step 6: Connection timed out. Device did not connect within the polling period.');
    return { sessionToken: sessionToken, status: "notconnected", deviceuuid: deviceuuid };

  } catch (err) {
    logger.error(`An unexpected error occurred during the connection process: ${err.message}`);
    return { error: err.message };
  }
}
