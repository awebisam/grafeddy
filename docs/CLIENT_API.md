# ChatClient API Documentation

## Overview

`ChatClient` is the WebSocket client class for connecting to the ChatServer. It provides automatic reconnection, event-driven message handling, and a simple API for sending messages.

## Class: ChatClient

### Constructor

```javascript
new ChatClient(options)
```

Creates a new ChatClient instance.

#### Parameters

- **options** `Object` - Configuration options
  - **url** `string` (required) - WebSocket server URL (e.g., `'ws://localhost:8080'`)
  - **autoReconnect** `boolean` (optional) - Enable automatic reconnection. Default: `true`
  - **reconnectInterval** `number` (optional) - Reconnection interval in milliseconds. Default: `5000`
  - **maxReconnectAttempts** `number` (optional) - Maximum reconnection attempts (`0` = unlimited). Default: `5`
  - **enableLogging** `boolean` (optional) - Enable client logging. Default: `true`

#### Throws

- **Error** - If `url` is not provided

#### Example

```javascript
const client = new ChatClient({
  url: 'ws://localhost:8080',
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  enableLogging: true
});
```

---

### Methods

#### connect()

Connects to the WebSocket server.

```javascript
client.connect() → Promise<void>
```

**Returns:** `Promise<void>` - Resolves when connected successfully

**Throws:** `Error` - If connection fails

**Example:**
```javascript
try {
  await client.connect();
  console.log('Connected to server');
} catch (error) {
  console.error('Connection failed:', error);
}
```

**Note:** If already connected or connecting, this method resolves immediately without creating a new connection.

---

#### disconnect(reason)

Disconnects from the WebSocket server.

```javascript
client.disconnect(reason)
```

**Parameters:**
- **reason** `string` (optional) - Reason for disconnect. Default: `'Client disconnect'`

**Example:**
```javascript
client.disconnect('User logged out');
```

**Note:** This sets manual disconnect flag and cancels any pending reconnection attempts.

---

#### send(message)

Sends a message to the server.

```javascript
client.send(message) → boolean
```

**Parameters:**
- **message** `Object` - Message object to send

**Returns:** `boolean` - `true` if message was sent successfully, `false` otherwise

**Example:**
```javascript
const success = client.send({
  type: 'message',
  text: 'Hello, server!',
  timestamp: new Date().toISOString()
});

if (!success) {
  console.error('Failed to send message');
}
```

---

#### sendMessage(text, additionalData)

Sends a text message to the server.

```javascript
client.sendMessage(text, additionalData) → boolean
```

**Parameters:**
- **text** `string` - Message text
- **additionalData** `Object` (optional) - Additional data to include in the message. Default: `{}`

**Returns:** `boolean` - `true` if message was sent successfully

**Example:**
```javascript
client.sendMessage('Hello!', { priority: 'high' });

// Sends:
// {
//   type: 'message',
//   text: 'Hello!',
//   timestamp: '2024-01-01T00:00:00.000Z',
//   priority: 'high'
// }
```

---

#### ping()

Sends a ping message to the server.

```javascript
client.ping() → boolean
```

**Returns:** `boolean` - `true` if ping was sent successfully

**Example:**
```javascript
if (client.ping()) {
  console.log('Ping sent');
}
```

**Note:** Useful for testing connection or triggering server's pong response.

---

#### getConnectionStatus()

Gets the current connection status.

```javascript
client.getConnectionStatus() → boolean
```

**Returns:** `boolean` - `true` if connected, `false` otherwise

**Example:**
```javascript
if (client.getConnectionStatus()) {
  console.log('Client is connected');
} else {
  console.log('Client is disconnected');
}
```

---

#### getClientId()

Gets the client ID assigned by the server.

```javascript
client.getClientId() → string|null
```

**Returns:** `string|null` - Client ID or `null` if not connected or not yet received

**Example:**
```javascript
const clientId = client.getClientId();
if (clientId) {
  console.log(`My client ID: ${clientId}`);
}
```

**Note:** The client ID is assigned by the server in the welcome message.

---

### Events

The ChatClient emits the following events:

#### Event: 'connected'

Emitted when successfully connected to the server.

```javascript
client.on('connected', () => {
  console.log('Connected to server');
});
```

---

#### Event: 'disconnected'

Emitted when disconnected from the server.

```javascript
client.on('disconnected', ({ code, reason }) => {
  console.log(`Disconnected: ${reason} (code: ${code})`);
});
```

**Event Data:**
- **code** `number` - WebSocket close code
- **reason** `string` - Disconnect reason

---

#### Event: 'message'

Emitted when any message is received from the server.

```javascript
client.on('message', (message) => {
  console.log('Received:', message);
});
```

**Event Data:**
- **message** `Object` - The received message

**Note:** This is the main event for handling all incoming messages.

---

#### Event: 'welcome'

Emitted when the welcome message is received from the server.

```javascript
client.on('welcome', (message) => {
  console.log(`Welcome! Client ID: ${message.clientId}`);
});
```

**Event Data:**
- **message** `Object` - Welcome message containing clientId

---

#### Event: 'systemMessage'

Emitted for generic system messages.

```javascript
client.on('systemMessage', (message) => {
  console.log('System:', message.message);
});
```

**Event Data:**
- **message** `Object` - System message

---

#### Event: 'systemInfo'

Emitted for system info messages (subtype: 'info').

```javascript
client.on('systemInfo', (message) => {
  console.log('Info:', message.message);
});
```

---

#### Event: 'systemWarning'

Emitted for system warning messages (subtype: 'warning').

```javascript
client.on('systemWarning', (message) => {
  console.warn('Warning:', message.message);
});
```

---

#### Event: 'systemError'

Emitted for system error messages (subtype: 'error').

```javascript
client.on('systemError', (message) => {
  console.error('Error:', message.message);
});
```

---

#### Event: 'serverDisconnect'

Emitted when the server initiates a disconnect.

```javascript
client.on('serverDisconnect', (message) => {
  console.log('Server disconnecting:', message.message);
});
```

---

#### Event: 'reconnecting'

Emitted when attempting to reconnect.

```javascript
client.on('reconnecting', ({ attempt }) => {
  console.log(`Reconnection attempt ${attempt}...`);
});
```

**Event Data:**
- **attempt** `number` - Current reconnection attempt number

---

#### Event: 'reconnectFailed'

Emitted when all reconnection attempts have failed.

```javascript
client.on('reconnectFailed', () => {
  console.error('Failed to reconnect after all attempts');
});
```

---

#### Event: 'error'

Emitted when a connection error occurs.

```javascript
client.on('error', (error) => {
  console.error('Connection error:', error);
});
```

**Event Data:**
- **error** `Error` - The error object

---

## Usage Examples

### Basic Client

```javascript
const ChatClient = require('./src/client/ChatClient');

const client = new ChatClient({
  url: 'ws://localhost:8080'
});

client.on('connected', () => {
  console.log('Connected!');
  client.sendMessage('Hello, server!');
});

client.on('message', (message) => {
  console.log('Received:', message);
});

await client.connect();
```

### Client with Reconnection Handling

```javascript
const client = new ChatClient({
  url: 'ws://localhost:8080',
  autoReconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10
});

client.on('connected', () => {
  console.log('Connected to server');
});

client.on('disconnected', ({ reason }) => {
  console.log(`Disconnected: ${reason}`);
});

client.on('reconnecting', ({ attempt }) => {
  console.log(`Reconnecting... (attempt ${attempt})`);
});

client.on('reconnectFailed', () => {
  console.error('Could not reconnect. Please check server status.');
  process.exit(1);
});

await client.connect();
```

### Interactive Client with Message Handling

```javascript
const ChatClient = require('./src/client/ChatClient');
const readline = require('readline');

const client = new ChatClient({
  url: 'ws://localhost:8080'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You> '
});

client.on('welcome', (message) => {
  console.log(`Connected! Your ID: ${message.clientId}`);
  rl.prompt();
});

client.on('systemInfo', (message) => {
  console.log(`[INFO] ${message.message}`);
  rl.prompt();
});

client.on('systemWarning', (message) => {
  console.log(`[WARN] ${message.message}`);
  rl.prompt();
});

rl.on('line', (input) => {
  if (input.trim()) {
    client.sendMessage(input.trim());
  }
  rl.prompt();
});

await client.connect();
```

### Handling Different Message Types

```javascript
client.on('message', (message) => {
  switch (message.type) {
    case 'system':
      handleSystemMessage(message);
      break;
    
    case 'notification':
      handleNotification(message);
      break;
    
    case 'pong':
      console.log('Pong received from server');
      break;
    
    case 'error':
      console.error('Server error:', message.message);
      break;
    
    default:
      console.log('Unknown message type:', message);
  }
});

function handleSystemMessage(message) {
  console.log(`[SYSTEM] ${message.message}`);
}

function handleNotification(message) {
  console.log(`[NOTIFICATION] ${message.text}`);
}
```

### Ping/Pong Monitoring

```javascript
client.on('connected', () => {
  // Send ping every 10 seconds to monitor connection
  setInterval(() => {
    if (client.getConnectionStatus()) {
      const success = client.ping();
      if (!success) {
        console.warn('Failed to send ping');
      }
    }
  }, 10000);
});

client.on('message', (message) => {
  if (message.type === 'pong') {
    console.log('Connection alive - pong received');
  }
});
```

### Graceful Client Shutdown

```javascript
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  
  // Send final message
  client.sendMessage('Goodbye!');
  
  // Disconnect after a short delay
  setTimeout(() => {
    client.disconnect('User exit');
    process.exit(0);
  }, 500);
});
```

### Error Handling

```javascript
// Connection error handling
client.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  
  // Handle specific error types
  if (error.code === 'ECONNREFUSED') {
    console.error('Server is not running');
  } else if (error.code === 'ETIMEDOUT') {
    console.error('Connection timeout');
  }
});

// Send with error handling
function safeSend(message) {
  if (!client.getConnectionStatus()) {
    console.error('Cannot send: not connected');
    return false;
  }
  
  try {
    return client.sendMessage(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}
```

### Custom Message Types

```javascript
// Send custom message type
function sendCustomMessage(type, data) {
  return client.send({
    type: type,
    ...data,
    timestamp: new Date().toISOString()
  });
}

// Example usage
sendCustomMessage('chat', {
  text: 'Hello!',
  metadata: { mood: 'happy' }
});

sendCustomMessage('command', {
  command: 'status',
  params: { verbose: true }
});
```

## Connection Lifecycle

1. **Initialization**: Create client with options
2. **Connection**: Call `connect()` method
3. **Welcome**: Receive welcome message with clientId
4. **Communication**: Send/receive messages
5. **Disconnection**: Manual or server-initiated
6. **Reconnection** (if enabled): Automatic reconnection attempts
7. **Shutdown**: Clean disconnect with `disconnect()`

## Auto-Reconnection Behavior

When `autoReconnect` is enabled:

1. On disconnect (not manual), client schedules reconnection
2. Waits for `reconnectInterval` milliseconds
3. Emits `reconnecting` event with attempt number
4. Attempts to connect
5. On success: resets attempt counter
6. On failure: repeats until `maxReconnectAttempts` reached
7. After max attempts: emits `reconnectFailed` event

**Manual disconnects** (via `disconnect()` method) do NOT trigger auto-reconnection.

## Best Practices

1. **Always handle errors**: Listen to `error` and `reconnectFailed` events
2. **Check connection status**: Use `getConnectionStatus()` before sending
3. **Handle all message types**: Implement handlers for expected message types
4. **Graceful shutdown**: Call `disconnect()` before exiting
5. **Use specific events**: Listen to specific system events (`systemInfo`, etc.) for better organization
6. **Validate data**: Check message structure before processing
7. **Configure reconnection**: Set appropriate reconnection parameters for your use case
8. **Handle welcome**: Wait for `welcome` event before assuming full connectivity
9. **Log appropriately**: Enable logging in development, disable in production if needed
10. **Timeout handling**: Implement application-level timeouts for expected responses

## Troubleshooting

### Client won't connect
- Verify server is running
- Check URL format (must start with `ws://` or `wss://`)
- Check firewall/network settings
- Review server logs for connection errors

### Messages not sending
- Verify connection status with `getConnectionStatus()`
- Check message format is valid JSON
- Ensure message size doesn't exceed server's `maxMessageSize`
- Look for error events

### Reconnection not working
- Verify `autoReconnect` is `true`
- Check if disconnect was manual (won't reconnect)
- Ensure `maxReconnectAttempts` hasn't been exceeded
- Review reconnection event logs

### Not receiving messages
- Ensure you're listening to the `message` event
- Check server is actually sending messages
- Verify no JSON parsing errors in console
- Confirm connection is established (wait for `connected` event)
