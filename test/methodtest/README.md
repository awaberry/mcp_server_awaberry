# How to Run Method Tests

This guide explains how to run the local method tests for `connectToDevice` and `executeCommand`.

## Preconditions

Before running the tests, ensure you have the following:

- **awaBerry Connect Installed:** The `awaBerry Connect` agent must be installed on the device you want to connect to. You can download it from [download.awaberry.com](https://download.awaberry.com).
- **awaBerry Remote Account:** You need an account at [app.awaberry.com](https://app.awaberry.com) with web-based access to your device.
- **awaBerry Agentic Project:** You must have a project created in the "awaBerry Agentic" section of the app. From this project, you will need your `<projectKey>` and `<projectSecret>`.

## Configuration

1.  **Create `.env` file:**
    In the root directory of this project, create a file named `.env`.

2.  **Add Credentials:**
    Add the following content to the `.env` file, replacing the placeholder values with your actual project credentials and device name:

    ```env
    projectKey=your_project_key
    projectSecret=your_project_secret
    deviceName=your_device_name
    ```

3.  **Install Dependencies:**
    Open your terminal in the project's root directory and run:
    ```bash
    npm install
    ```

## Running the Tests

Run the test files from your project's root directory.

### 1. Test Device Connection

This test will attempt to connect to your specified device.

```bash
node test/methodtest/testConnectToDevice.js
```

Expected end of test output

```
✅ Method execution was succesful
```

### 2. Test Command Execution

If the connection test is successful, you can use this command to execute a test command on the connected device.

```bash
node test/methodtest/testExecuteCommand.js
```

Enter a simple command such as 'date' or 'ls' to test the command execution.
 
On success the json result the of the command result is printed ending with

```
✅ Method execution was succesful
```


## Troubleshooting

### Missing or invalid inputs

Double-check the provided values in projectKey and projectSecret and try again

### Device with name '...' not found



## Support

For documentation and questions:

- **awaberry Documentation:** [www.awaberry.com/manual](https://www.awaberry.com/manual)
- **awaberry Support:** [www.awaberry.com/support](https://www.awaberry.com/support)
