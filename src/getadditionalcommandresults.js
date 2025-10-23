import fetch from 'node-fetch';
import winston from 'winston';

const setserviceurl = "https://agentic.awaberry.net/apirequests";

// Configure the logger (adapted from connecttodevice.js)
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

// Adapted callApi from connecttodevice.js
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

/**
 * Gets more output for a command which did not terminate called via executeCommand
 * @param {string} sessionToken - The session token obtained from initSession.
 * @param {string} deviceuuid - The UUID of the target device.
 * @returns {Promise<object>} An object containing the result of the command execution or an error.
 */
export async function getAdditionalCommandResults(sessionToken, deviceuuid) {
  logger.info(`Attempting to executegetAdditionalCommandResults on device '${deviceuuid}' with session '${sessionToken}'`);
  try {
    if (!sessionToken || !deviceuuid ) {
      logger.error('Missing required parameters for executeCommand.');
      return { success: false, error: 'Missing sessionToken or deviceuuid.' };
    }


    const commandResult = await callApi('/getAdditionalCommandResults', {
      sessionToken: sessionToken,
      deviceuuid: deviceuuid
    });

    logger.info(`Command getAdditionalCommandResults successful for device '${deviceuuid}'. Result: ${JSON.stringify(commandResult)}`);
    return { success: true, result: commandResult };

  } catch (err) {
    logger.error(`Error executing command '${command}' on device '${deviceuuid}': ${err.message}`);
    return { success: false, error: err.message };
  }
}