import json
import requests

from typing import Any, Dict, Optional

class AwaberryApiRequestClient:
    """
    A synchronous client for the Awaberry API using standard libraries.
    """
    def __init__(self, base_url: str, project_key: str, project_secret: str):
        self.base_url = base_url
        self.project_key = project_key
        self.project_secret = project_secret
        self.session_token: Optional[str] = None

    def _make_request(self, endpoint: str, payload: dict) -> dict:
        url = f"{self.base_url}/{endpoint}"
        try:
            response = requests.post(url, json=payload)
            print("Status code:", response.status_code)
            if response.status_code >= 200 and response.status_code < 300:
                return response.json()
            else:
                print(f"HTTP Error {response.status_code}: {response.reason}")
                response.raise_for_status()
        except requests.RequestException as e:
            print(f"Request failed: {e}")
            raise

    def get_project(self) -> Dict[str, Any]:
        """Gets project details."""
        payload = {
            "projectkey": self.project_key,
            "projectsecret": self.project_secret,
        }

        print("payload : " , payload)

        return self._make_request("getProject", payload)

    def init_session(self) -> str:
        """Initializes a session and returns a session token."""
        payload = {
            "projectkey": self.project_key,
            "projectsecret": self.project_secret,
        }
        data = self._make_request("initSession", payload)
        self.session_token = data.get("sessionToken")
        if not self.session_token:
            raise ValueError("sessionToken not found in API response")
        return self.session_token

    def start_device_connection(self, deviceuuid: str) -> Dict[str, Any]:
        """Starts a device connection."""
        payload = {"sessionToken": self.session_token, "deviceuuid": deviceuuid}
        return self._make_request("startDeviceConnection", payload)

    def get_device_connection_status(self, deviceuuid: str) -> Dict[str, Any]:
        """Gets the status of a device connection."""
        payload = {"sessionToken": self.session_token, "deviceuuid": deviceuuid}
        return self._make_request("getDeviceConnectionStatus", payload)

    def disconnect_device_connection(self, deviceuuid: str) -> Dict[str, Any]:
        """Disconnects a device connection."""
        payload = {"sessionToken": self.session_token, "deviceuuid": deviceuuid}
        return self._make_request("disconnectDeviceConnection", payload)

    def execute_command(self, deviceuuid: str, command: str) -> Dict[str, Any]:
        """Executes a command on a device."""
        payload = {
            "sessionToken": self.session_token,
            "deviceuuid": deviceuuid,
            "command": command,
        }
        return self._make_request("executeCommand", payload)

    def get_additional_command_results(self, deviceuuid: str) -> Dict[str, Any]:
        """Gets additional results from the last command."""
        payload = {"sessionToken": self.session_token, "deviceuuid": deviceuuid}
        return self._make_request("getAdditionalCommandResults", payload)