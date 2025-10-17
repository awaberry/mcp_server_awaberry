Follow first the instructions in folder ../methodtest and ensure
the methods return results for your project setup.

In a terminal run the command
    node httpserver/server.js

Expected output should be

    MCP Server running on http://localhost:8080
    Endpoints:
      POST /connect
      POST /execute

In a second terminal run the command
    node test/httpservertest/testHttpServer.js

Expected output should be the current date received with terminal command 'date' from the configured device
