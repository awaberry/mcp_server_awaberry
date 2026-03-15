// awaberryapirequestclient.ts.js
const axios = require('axios');

class AwaberryApiRequestClient {
  constructor(baseUrl, projectKey, projectSecret) {
    this.baseUrl = baseUrl;
    this.projectKey = projectKey;
    this.projectSecret = projectSecret;
    this.sessionToken = null;
  }

  async getProject() {
    const res = await axios.post(`${this.baseUrl}/getProject`, {
      projectkey: this.projectKey,
      projectsecret: this.projectSecret,
    });
    return res.data;
  }

  async initSession() {
    const res = await axios.post(`${this.baseUrl}/initSession`, {
      projectkey: this.projectKey,
      projectsecret: this.projectSecret,
    });
    this.sessionToken = res.data.sessionToken;
    return this.sessionToken;
  }

  async startDeviceConnection(deviceuuid) {
    const res = await axios.post(`${this.baseUrl}/startDeviceConnection`, {
      sessionToken: this.sessionToken,
      deviceuuid,
    });
    return res.data;
  }

  async getDeviceConnectionStatus(deviceuuid) {
    const res = await axios.post(`${this.baseUrl}/getDeviceConnectionStatus`, {
      sessionToken: this.sessionToken,
      deviceuuid,
    });
    return res.data;
  }

  async disconnectDeviceConnection(deviceuuid) {
    const res = await axios.post(`${this.baseUrl}/disconnectDeviceConnection`, {
      sessionToken: this.sessionToken,
      deviceuuid,
    });
    return res.data;
  }

  async executeCommand(deviceuuid, command) {
    const res = await axios.post(`${this.baseUrl}/executeCommand`, {
      sessionToken: this.sessionToken,
      deviceuuid,
      command,
    });
    return res.data;
  }

  async getAdditionalCommandResults(deviceuuid) {
    const res = await axios.post(`${this.baseUrl}/getAdditionalCommandResults`, {
      sessionToken: this.sessionToken,
      deviceuuid,
    });
    return res.data;
  }
}

module.exports = AwaberryApiRequestClient;