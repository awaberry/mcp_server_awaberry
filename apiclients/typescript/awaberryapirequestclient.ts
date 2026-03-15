import axios from 'axios';

export interface ProjectResponse {
    projectid: string;
    projectname: string;
    projectdescription: string;
    datecreated: string; // ISO datetime string
    dateupdated: string; // ISO datetime string
    agentprojectsetup: string;
    useruuid: string;
}

export interface CommandResult {
  commandResult: string;
  lastCommandEndedOnTerminal: boolean;
}

class AwaberryApiRequestClient {
  private baseUrl: string;
  private projectKey: string;
  private projectSecret: string;
  private sessionToken: string | null;

  constructor(baseUrl: string, projectKey: string, projectSecret: string) {
    this.baseUrl = baseUrl;
    this.projectKey = projectKey;
    this.projectSecret = projectSecret;
    this.sessionToken = null;
  }

  async getProject(): Promise<ProjectResponse> {
    const res = await axios.post(`${this.baseUrl}/getProject`, {
      projectkey: this.projectKey,
      projectsecret: this.projectSecret,
    });
    return res.data;
  }

  async initSession(): Promise<string> {
    const res = await axios.post(`${this.baseUrl}/initSession`, {
      projectkey: this.projectKey,
      projectsecret: this.projectSecret,
    });
    this.sessionToken = res.data.sessionToken;
    return this.sessionToken;
  }

  async startDeviceConnection(deviceuuid: string): Promise<any> {
    const res = await axios.post(`${this.baseUrl}/startDeviceConnection`, {
      sessionToken: this.sessionToken,
      deviceuuid,
    });
    return res.data;
  }

  async getDeviceConnectionStatus(deviceuuid: string): Promise<any> {
    const res = await axios.post(`${this.baseUrl}/getDeviceConnectionStatus`, {
      sessionToken: this.sessionToken,
      deviceuuid,
    });
    return res.data;
  }

  async disconnectDeviceConnection(deviceuuid: string): Promise<any> {
    const res = await axios.post(`${this.baseUrl}/disconnectDeviceConnection`, {
      sessionToken: this.sessionToken,
      deviceuuid,
    });
    return res.data;
  }

  async executeCommand(deviceuuid: string, command: string): Promise<CommandResult> {
    const res = await axios.post(`${this.baseUrl}/executeCommand`, {
      sessionToken: this.sessionToken,
      deviceuuid,
      command,
    });
    return res.data;
  }

  async getAdditionalCommandResults(deviceuuid: string): Promise<any> {
    const res = await axios.post(`${this.baseUrl}/getAdditionalCommandResults`, {
      sessionToken: this.sessionToken,
      deviceuuid,
    });
    return res.data;
  }
}

export default AwaberryApiRequestClient;