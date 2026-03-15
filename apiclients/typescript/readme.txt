Awaberry API client for typescript

See usageExampleBasic.ts for a end to end example of calling a device programmatically using the awaBerry api based on a configured project.

Prerequisists
*********************
node installed

TS-Node installed
npm install -g ts-node

Axios installed:
npm install axios


usageFullScenario.ts
*********************

A full scenario implementation to allow entering commands to device and get results back

Execution
Open terminal and type
ts-node usageFullScenario.js <projectKey> <projectSecret>

usageWriteAFileToFolderAndReadBack.js
*********************

Create a project in awaBerry agentic using the permission config of awaberry_agent_project_limitedprojecttoreadandwritefilesinfolder.json (upload it in the project creation view)
Change the configured folder for the project if required.
Select only one device (in case you have connected more than one)
Create the project.

Execution
Open terminal and type
ts-node usageFullScenario.js <projectKey> <projectSecret>




