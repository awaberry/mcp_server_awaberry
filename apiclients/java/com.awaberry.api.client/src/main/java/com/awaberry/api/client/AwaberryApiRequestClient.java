package com.awaberry.api.client;


import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

public class AwaberryApiRequestClient {
    private final String baseUrl;
    private final String projectKey;
    private final String projectSecret;
    private String sessionToken;

    public AwaberryApiRequestClient(String baseUrl, String projectKey, String projectSecret) {
        this.baseUrl = baseUrl;
        this.projectKey = projectKey;
        this.projectSecret = projectSecret;
    }

    private JSONObject makeRequest(String endpoint, JSONObject payload) throws IOException {
        URL url = new URL(baseUrl + "/" + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");

        // Set a connection timeout of 5 seconds (5000 milliseconds)
        conn.setConnectTimeout(5000);

        conn.setReadTimeout(60000);

        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(payload.toString().getBytes());
            os.flush();
        }

        int status = conn.getResponseCode();
        InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();
        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = br.readLine()) != null) {
                response.append(line);
            }
        }
        if (status < 200 || status >= 300) {
            throw new IOException("HTTP Error " + status + ": " + conn.getResponseMessage());
        }

        return new JSONObject(response.toString());
    }

    private boolean makeRequestBool(String endpoint, JSONObject payload) throws IOException {
            URL url = new URL(baseUrl + "/" + endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");

            // Set a connection timeout of 5 seconds (5000 milliseconds)
            conn.setConnectTimeout(5000);

            conn.setReadTimeout(60000);

            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(payload.toString().getBytes());
                os.flush();
            }

            int status = conn.getResponseCode();
            InputStream is = (status >= 200 && status < 300) ? conn.getInputStream() : conn.getErrorStream();
            StringBuilder response = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
            }
            if (status < 200 || status >= 300) {
                throw new IOException("HTTP Error " + status + ": " + conn.getResponseMessage());
            }


            if (response.toString().equals("true"))
            {
                return true;
            }

            return false;
        }


    public JSONObject getProject() throws IOException {
        JSONObject payload = new JSONObject();
        payload.put("projectkey", projectKey);
        payload.put("projectsecret", projectSecret);
        return makeRequest("getProject", payload);
    }

    public String initSession() throws IOException {
        JSONObject payload = new JSONObject();
        payload.put("projectkey", projectKey);
        payload.put("projectsecret", projectSecret);
        JSONObject data = makeRequest("initSession", payload);
        sessionToken = data.optString("sessionToken", null);
        if (sessionToken == null) {
            throw new IllegalStateException("sessionToken not found in API response");
        }
        return sessionToken;
    }

    public boolean startDeviceConnection(String deviceuuid) throws IOException {
        JSONObject payload = new JSONObject();
        payload.put("sessionToken", sessionToken);
        payload.put("deviceuuid", deviceuuid);
        return makeRequestBool("startDeviceConnection", payload);
    }

    public boolean getDeviceConnectionStatus(String deviceuuid) throws IOException {
        JSONObject payload = new JSONObject();
        payload.put("sessionToken", sessionToken);
        payload.put("deviceuuid", deviceuuid);
        return makeRequestBool("getDeviceConnectionStatus", payload);
    }

    public JSONObject disconnectDeviceConnection(String deviceuuid) throws IOException {
        JSONObject payload = new JSONObject();
        payload.put("sessionToken", sessionToken);
        payload.put("deviceuuid", deviceuuid);
        return makeRequest("disconnectDeviceConnection", payload);
    }

    public JSONObject executeCommand(String deviceuuid, String command) throws IOException {
        JSONObject payload = new JSONObject();
        payload.put("sessionToken", sessionToken);
        payload.put("deviceuuid", deviceuuid);
        payload.put("command", command);
        return makeRequest("executeCommand", payload);
    }

    public JSONObject getAdditionalCommandResults(String deviceuuid) throws IOException {
        JSONObject payload = new JSONObject();
        payload.put("sessionToken", sessionToken);
        payload.put("deviceuuid", deviceuuid);
        return makeRequest("getAdditionalCommandResults", payload);
    }
}