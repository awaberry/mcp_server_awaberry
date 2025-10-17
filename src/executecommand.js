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
 * Executes a command on a connected device.
 * @param {string} sessionToken - The session token obtained from initSession.
 * @param {string} deviceuuid - The UUID of the target device.
 * @param {string} command - The command string to execute.
 * @returns {Promise<object>} An object containing the result of the command execution or an error.
 */
export async function executeCommand(sessionToken, deviceuuid, command) {
  logger.info(`Attempting to execute command '${command}' on device '${deviceuuid}' with session '${sessionToken}'`);
  try {
    if (!sessionToken || !deviceuuid || !command) {
      logger.error('Missing required parameters for executeCommand.');
      return { success: false, error: 'Missing sessionToken, deviceuuid, or command.' };
    }

    // Assuming an API endpoint like '/executeCommand'
    // You might need to confirm the exact endpoint and expected body structure
    // with the API documentation for "awaberry.net/apirequests"
    const commandResult = await callApi('/executeCommand', {
      sessionToken: sessionToken,
      deviceuuid: deviceuuid,
      command: command
    });

    logger.info(`Command execution successful for device '${deviceuuid}'. Result: ${JSON.stringify(commandResult)}`);
    return { success: true, result: commandResult };

  } catch (err) {
    logger.error(`Error executing command '${command}' on device '${deviceuuid}': ${err.message}`);
    return { success: false, error: err.message };
  }
}