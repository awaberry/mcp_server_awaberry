import { connectToDevice as connect } from '../src/connecttodevice.js';
import { executeCommand as exec } from '../src/executecommand.js';

class awaBerryAgenticHttpServer {
  /**
   * Connects to a device using project credentials and a device name.
   * @param {string} projectKey - The project key.
   * @param {string} projectSecret - The project secret.
   * @param {string} deviceName - The name of the device to connect to.
   * @returns {Promise<object>} A promise that resolves with the connection result.
   */
  async connectToDevice(projectKey, projectSecret, deviceName) {
    return await connect(projectKey, projectSecret, deviceName);
  }

  /**
   * Executes a command on a connected device.
   * @param {string} sessionToken - The session token for the device connection.
   * @param {string} deviceuuid - The UUID of the device.
   * @param {string} command - The command to execute.
   * @returns {Promise<object>} A promise that resolves with the command execution result.
   */
  async executeCommand(sessionToken, deviceuuid, command) {
    return await exec(sessionToken, deviceuuid, command);
  }
}

export { awaBerryAgenticHttpServer as awaBerryAgenticMcpServer };
