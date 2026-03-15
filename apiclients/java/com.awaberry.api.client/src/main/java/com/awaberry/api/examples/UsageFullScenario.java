package com.awaberry.api.examples;

import com.awaberry.api.client.AwaberryApiRequestClient;
import org.json.JSONObject;
import org.json.JSONArray;
import java.util.Scanner;

public class UsageFullScenario {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String projectKey, projectSecret;

        if (args.length >= 2) {
            projectKey = args[0];
            projectSecret = args[1];
        } else {
            System.out.print("Enter your Project Key: ");
            projectKey = scanner.nextLine();
            System.out.print("Enter your Project Secret: ");
            projectSecret = scanner.nextLine();
        }

        System.out.println("use project key " + projectKey);

        AwaberryApiRequestClient client = new AwaberryApiRequestClient(
                "https://agentic.awaberry.net/apirequests",
                projectKey,
                projectSecret
        );

        try {
            JSONObject projectRes = client.getProject();
            JSONObject setup = new JSONObject(projectRes.getString("agentprojectsetup"));
            JSONArray setupEntries = setup.optJSONArray("setupEntries");

            String deviceuuid = null;
            if (setupEntries != null && setupEntries.length() > 0) {
                System.out.println("Available devices:");
                for (int i = 0; i < setupEntries.length(); i++) {
                    JSONObject entry = setupEntries.getJSONObject(i);
                    System.out.println(entry.getString("deviceName") + ". uuid: " + entry.getString("deviceuuid"));
                }
                if (setupEntries.length() == 1) {
                    deviceuuid = setupEntries.getJSONObject(0).getString("deviceuuid");
                    System.out.println("Using only available device: " + deviceuuid);
                }
            } else {
                System.out.println("No devices found.");
                return;
            }

            client.initSession();
            System.out.println("Session initialized successfully.");

            String uuidToUse = deviceuuid;
            if (uuidToUse == null) {
                System.out.print("Enter Device UUID to connect: ");
                uuidToUse = scanner.nextLine();
            }

            connectDevice(client, uuidToUse, scanner);

        } catch (Exception err) {
            System.out.println("Error: " + err.getMessage());
        }
    }

    private static void connectDevice(AwaberryApiRequestClient client, String uuid, Scanner scanner) throws Exception {

        System.out.println("Starting device connection... " + uuid);



        try {
            boolean connected = client.startDeviceConnection(uuid);
                System.out.println("connected: " + connected);


        } catch (Exception e) {
            System.out.println("Error parsing device connection response: " + e.getMessage());
        }

        boolean connectedStatus = client.getDeviceConnectionStatus(uuid);
        System.out.println("Device connection status: " + connectedStatus);

        if (connectedStatus) {
            System.out.println("ready to enter commands - type 'exit' to quit");
            while (true) {
                System.out.print("type next command: ");
                String commandToExecute = scanner.nextLine();
                if ("exit".equals(commandToExecute)) {
                    break;
                }
                JSONObject result = client.executeCommand(uuid, commandToExecute);
                System.out.println("endedOnTerminal: " + result.opt("lastCommandEndedOnTerminal") +
                        " | Result : " + result.opt("commandResult"));
            }
        }
    }
}