Awaberry API client for Python

See usageExampleBasic.ts for a end to end example of calling a device programmatically using the awaBerry api based on a configured project.

Prerequisists
*********************
java installed
maven installed

Compile the project
cd com.awaberry.api.client
mvn compile


The examples are in src/main/java/com/awaberry/api/examples

UsageFullScenario.java
*********************

A full scenario implementation to allow entering commands to device and get results back

Execution
Open terminal and paste
mvn exec:java -Dexec.mainClass="com.awaberry.api.examples.UsageFullScenario" -Dexec.args="<projectKey> <projectSecret>"


usageWriteAFileToFolderAndReadBack.js
*********************

Create a project in awaBerry agentic using the permission config of awaberry_agent_project_limitedprojecttoreadandwritefilesinfolder.json (upload it in the project creation view)
Change the configured folder for the project if required.
Select only one device (in case you have connected more than one)
Create the project.

Execution
Open terminal and type
ts-node usageFullScenario.js <projectKey> <projectSecret>


# Usage example for /startDeviceConnectionWebsocket
# This endpoint is not yet implemented in Java client. To use it, add a method:
# public JSONObject startDeviceConnectionWebsocket(String sessionToken, String deviceuuid) { ... }
# Example usage:
# JSONObject result = client.startDeviceConnectionWebsocket(sessionToken, deviceuuid);
# System.out.println(result);

# Usage example for /getWebSocket
# This endpoint is not yet implemented in Java client. To use it, add a method:
# public WebSocket getWebSocket(String sessionToken, String deviceuuid) { ... }
# Example usage:
# WebSocket ws = client.getWebSocket(sessionToken, deviceuuid);
# ws.send("your message");
# ws.close();
