// TobiiClient.test.js
import WebSocket from "ws";
import jsLogger, { ILogger } from 'js-logger'
const { startServer, stopServer } = require('./mocks/MockServer');
import TobiiClient from '../src/TobiiClient' // Import your client that makes HTTP requests
import { waitForSocketState } from '../src/utils';
import { WSMessage } from '../src/models';

// Create logger
jsLogger.useDefaults()
const tobiiLogger: ILogger = jsLogger.get('tobiiprosdk')

const port = 9999;

describe('TobiiClient Tests', () => {
  let server;

  beforeAll(async () => {
    server = await startServer(port); // Start server on port 3000
  });

  afterAll(async () => {
    await stopServer(server); // Stop the server
  });

  test('TobiiClient should receive test response from mock server', async () => {
    // Assuming TobiiClient has a method getTest() that fetches '/api/test'
    const client = new TobiiClient();
    const response = await client.ping();
    expect(response.message).toBe('This is a test response');
  });

  test("TobiiClient should receive eye trackers from mock server", async () => {
    const client = new TobiiClient();
    const response = await client.getEyeTrackers();
    expect(response.length).toBe(2);
    expect(response[0].model).toBe("Tobii Pro Spark");
  });

  test("WS client receive GAZE_DATA updates from mock server", async () => {
    // Create test client
    const client = new WebSocket(`ws://localhost:${port}/123456789`);
    await waitForSocketState(client, client.OPEN);

    // const testMessage = "This is a test message";
    let responseMessage: WSMessage | null = null;

    client.on("message", (data) => {
      responseMessage = JSON.parse(data.toString());
      tobiiLogger.log(responseMessage)

      // Close the client after it receives the response
      client.close();
    });

    // Perform assertions on the response
    await waitForSocketState(client, client.CLOSED);
    console.log(responseMessage)
    expect(responseMessage).not.toBeNull();
    expect(responseMessage!.type).toBe("GAZE_DATA");
  });

  test("TobiiClient should receive GAZE_DATA updates from mock server", async () => {
    const client = new TobiiClient();
    const ws = await client._createWebSocketConnection("123456789");
    let responseMessage: WSMessage | null = null;

    ws.on("message", (data) => {
      responseMessage = JSON.parse(data.toString());
      tobiiLogger.log(responseMessage)

      // Close the client after it receives the response
      ws.close();
    });

    // Perform assertions on the response
    await waitForSocketState(ws, ws.CLOSED);
    expect(responseMessage).not.toBeNull();
    expect(responseMessage!.type).toBe("GAZE_DATA");
  });

  test("TobiiClient via nice API should receive GAZE_DATA updates from mock server", async () => {
    const client = new TobiiClient();
    const ws = await client.connectToEyeTracker("123456789");
    let responseMessage: WSMessage | null = null;

    ws.on("message", (data) => {
      responseMessage = JSON.parse(data.toString());
      tobiiLogger.log(responseMessage)

      // Close the client after it receives the response
      ws.close();
    });

    // Perform assertions on the response
    await waitForSocketState(ws, ws.CLOSED);
    expect(responseMessage).not.toBeNull();
    expect(responseMessage!.type).toBe("GAZE_DATA");
  });

  test("TobiiClient connect to Serial Number that doesn't exists", async () => {
    const client = new TobiiClient();
    const ws = await client.connectToEyeTracker("111111111");
    let responseMessage: WSMessage | null = null;

    ws.on("message", (data) => {
      responseMessage = JSON.parse(data.toString());
      tobiiLogger.log(responseMessage)

      // Close the client after it receives the response
      ws.close();
    });

    // Perform assertions on the response
    await waitForSocketState(ws, ws.CLOSED);
    expect(responseMessage).toBeNull();
  });

  test("TobiiClient, typical workflow", async () => {
    const client = new TobiiClient();
    const response = await client.getEyeTrackers();
    if (response.length === 0) {
      return;
    }
    const ws = await client.connectToEyeTracker(response[0].serial_number);
    let responseMessage: WSMessage | null = null;

    ws.on("message", (data) => {
      responseMessage = JSON.parse(data.toString());
      tobiiLogger.log(responseMessage)

      // Close the client after it receives the response
      ws.close();
    });

    // Perform assertions on the response
    await waitForSocketState(ws, ws.CLOSED);
    expect(responseMessage).not.toBeNull();
    expect(responseMessage!.type).toBe("GAZE_DATA");
  });

});