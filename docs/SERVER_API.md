# ChatServer API Documentation

## Overview

`ChatServer` is the core WebSocket server class that manages client connections and facilitates system-to-user communication. It extends Node.js EventEmitter to provide event-driven architecture.

## Class: ChatServer

### Constructor

```javascript
new ChatServer(options)
```

Creates a new ChatServer instance.

#### Parameters

- **options** `Object` - Configuration options
  - **port** `number` (optional) - Port number for the WebSocket server. Default: `8080`
  - **heartbeatInterval** `number` (optional) - Interval for ping/pong heartbeat in milliseconds. Default: `30000` (30 seconds)
  - **maxMessageSize** `number` (optional) - Maximum message size in bytes. Default: `1048576` (1MB)
  - **enableLogging** `boolean` (optional) - Enable server logging. Default: `true`

#### Example

```javascript
const server = new ChatServer({
  port: 8080,
  heartbeatInterval: 30000,
  maxMessageSize: 1048576,
  enableLogging: true
});
```

---

### Methods

#### start()

Starts the WebSocket server.

```javascript
server.start() → Promise<void>
```

**Returns:** `Promise<void>` - Resolves when server is started

**Throws:** `Error` - If server fails to start

**Example:**
```javascript
try {
  await server.start();
  console.log('Server started successfully');
} catch (error) {
  console.error('Failed to start server:', error);
}
```

---

#### stop()

Stops the WebSocket server gracefully, closing all client connections.

```javascript
server.stop() → Promise<void>
```

**Returns:** `Promise<void>` - Resolves when server is stopped

**Example:**
```javascript
await server.stop();
console.log('Server stopped');
```

---

#### sendToClient(clientId, message)

Sends a message to a specific client.

```javascript
server.sendToClient(clientId, message) → boolean
```

**Parameters:**
- **clientId** `string` - Client identifier
- **message** `Object` - Message object to send

**Returns:** `boolean` - `true` if message was sent successfully, `false` otherwise

**Example:**
```javascript
const success = server.sendToClient('client-123', {
  type: 'notification',
  text: 'Hello, client!'
});
```

---

#### sendSystemMessage(clientId, message, subtype)

Sends a system message to a specific client.

```javascript
server.sendSystemMessage(clientId, message, subtype) → boolean
```

**Parameters:**
- **clientId** `string` - Client identifier
- **message** `string` - System message text
- **subtype** `string` (optional) - Message subtype: `'info'`, `'warning'`, or `'error'`. Default: `'info'`

**Returns:** `boolean` - `true` if message was sent successfully

**Example:**
```javascript
server.sendSystemMessage('client-123', 'Your session will expire soon', 'warning');
```

---

#### broadcast(message, excludeClients)

Broadcasts a message to all connected clients.

```javascript
server.broadcast(message, excludeClients) → number
```

**Parameters:**
- **message** `Object` - Message object to broadcast
- **excludeClients** `Array<string>` (optional) - Array of client IDs to exclude from broadcast. Default: `[]`

**Returns:** `number` - Number of clients the message was sent to

**Example:**
```javascript
const count = server.broadcast({
  type: 'announcement',
  text: 'Server maintenance in 10 minutes'
});
console.log(`Message sent to ${count} clients`);
```

---

#### broadcastSystemMessage(message, subtype)

Broadcasts a system message to all connected clients.

```javascript
server.broadcastSystemMessage(message, subtype) → number
```

**Parameters:**
- **message** `string` - System message text
- **subtype** `string` (optional) - Message subtype. Default: `'info'`

**Returns:** `number` - Number of clients the message was sent to

**Example:**
```javascript
server.broadcastSystemMessage('New feature available!', 'info');
```

---

#### disconnectClient(clientId, reason)

Disconnects a specific client from the server.

```javascript
server.disconnectClient(clientId, reason) → boolean
```

**Parameters:**
- **clientId** `string` - Client identifier
- **reason** `string` (optional) - Reason for disconnect. Default: `'Disconnected by server'`

**Returns:** `boolean` - `true` if client was disconnected successfully

**Example:**
```javascript
server.disconnectClient('client-123', 'Idle timeout');
```

---

#### getClientInfo(clientId)

Gets information about a specific client.

```javascript
server.getClientInfo(clientId) → Object|null
```

**Parameters:**
- **clientId** `string` - Client identifier

**Returns:** `Object|null` - Client information object or `null` if not found

**Client Info Object:**
```javascript
{
  id: 'client-123',
  ip: '192.168.1.100',
  connectedAt: Date,
  metadata: {}
}
```

**Example:**
```javascript
const info = server.getClientInfo('client-123');
if (info) {
  console.log(`Client connected at: ${info.connectedAt}`);
}
```

---

#### getConnectedClients()

Gets list of all connected client IDs.

```javascript
server.getConnectedClients() → Array<string>
```

**Returns:** `Array<string>` - Array of client IDs

**Example:**
```javascript
const clients = server.getConnectedClients();
console.log(`${clients.length} clients connected`);
```

---

#### getClientCount()

Gets the number of connected clients.

```javascript
server.getClientCount() → number
```

**Returns:** `number` - Number of connected clients

**Example:**
```javascript
const count = server.getClientCount();
console.log(`Active clients: ${count}`);
```

---

#### updateClientMetadata(clientId, metadata)

Updates metadata for a specific client.

```javascript
server.updateClientMetadata(clientId, metadata) → boolean
```

**Parameters:**
- **clientId** `string` - Client identifier
- **metadata** `Object` - Metadata to merge with existing metadata

**Returns:** `boolean` - `true` if metadata was updated successfully

**Example:**
```javascript
server.updateClientMetadata('client-123', {
  username: 'John',
  role: 'admin'
});
```

---

### Events

The ChatServer emits the following events:

#### Event: 'started'

Emitted when the server has started successfully.

```javascript
server.on('started', ({ port }) => {
  console.log(`Server started on port ${port}`);
});
```

---

#### Event: 'stopped'

Emitted when the server has stopped.

```javascript
server.on('stopped', () => {
  console.log('Server stopped');
});
```

---

#### Event: 'clientConnected'

Emitted when a new client connects.

```javascript
server.on('clientConnected', ({ clientId, clientIp }) => {
  console.log(`Client ${clientId} connected from ${clientIp}`);
});
```

**Event Data:**
- **clientId** `string` - Unique client identifier
- **clientIp** `string` - Client IP address

---

#### Event: 'clientDisconnected'

Emitted when a client disconnects.

```javascript
server.on('clientDisconnected', ({ clientId, code, reason }) => {
  console.log(`Client ${clientId} disconnected: ${reason}`);
});
```

**Event Data:**
- **clientId** `string` - Client identifier
- **code** `number` - WebSocket close code
- **reason** `string` - Disconnect reason

---

#### Event: 'message'

Emitted when a message is received from a client.

```javascript
server.on('message', (message) => {
  console.log('Received message:', message);
});
```

**Event Data:**
- **message** `Object` - The received message with added metadata:
  - **clientId** `string` - ID of the client who sent the message
  - **receivedAt** `string` - ISO timestamp when message was received
  - ...original message fields

---

#### Event: 'clientError'

Emitted when a client connection error occurs.

```javascript
server.on('clientError', ({ clientId, error }) => {
  console.error(`Client ${clientId} error:`, error);
});
```

**Event Data:**
- **clientId** `string` - Client identifier
- **error** `Error` - The error object

---

#### Event: 'clientTimeout'

Emitted when a client fails the heartbeat check.

```javascript
server.on('clientTimeout', ({ clientId }) => {
  console.log(`Client ${clientId} timed out`);
});
```

**Event Data:**
- **clientId** `string` - Client identifier

---

#### Event: 'error'

Emitted when a server error occurs.

```javascript
server.on('error', (error) => {
  console.error('Server error:', error);
});
```

**Event Data:**
- **error** `Error` - The error object

---

## Usage Examples

### Basic Server

```javascript
const ChatServer = require('./src/server/ChatServer');

const server = new ChatServer({ port: 8080 });

server.on('clientConnected', ({ clientId }) => {
  server.sendSystemMessage(clientId, 'Welcome!', 'info');
});

server.on('message', (message) => {
  // Echo back to the sender
  server.sendSystemMessage(message.clientId, `You said: ${message.text}`);
});

await server.start();
```

### Advanced Server with Client Tracking

```javascript
const ChatServer = require('./src/server/ChatServer');

const server = new ChatServer({ port: 8080 });
const userSessions = new Map();

server.on('clientConnected', ({ clientId }) => {
  userSessions.set(clientId, {
    connectedAt: new Date(),
    messageCount: 0
  });
  
  server.sendSystemMessage(
    clientId, 
    'Welcome! Type "help" for commands.',
    'info'
  );
});

server.on('message', (message) => {
  const session = userSessions.get(message.clientId);
  session.messageCount++;
  
  if (message.text === 'help') {
    server.sendSystemMessage(
      message.clientId,
      'Available commands: help, stats, exit',
      'info'
    );
  } else if (message.text === 'stats') {
    const duration = Date.now() - session.connectedAt;
    server.sendSystemMessage(
      message.clientId,
      `Messages: ${session.messageCount}, Duration: ${duration}ms`,
      'info'
    );
  }
});

server.on('clientDisconnected', ({ clientId }) => {
  userSessions.delete(clientId);
});

await server.start();
```

### Broadcasting with Exclusions

```javascript
// Send announcement to all except specific clients
const adminClients = ['admin-1', 'admin-2'];
server.broadcast(
  {
    type: 'announcement',
    text: 'System maintenance starting'
  },
  adminClients  // Exclude admins from announcement
);
```

### Graceful Shutdown

```javascript
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  
  // Notify all clients
  server.broadcastSystemMessage('Server shutting down', 'warning');
  
  // Wait for messages to be delivered
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Stop server
  await server.stop();
  
  process.exit(0);
});
```

## Internal Implementation Details

### Connection State Management

Each client connection maintains:
- Unique UUID identifier
- WebSocket connection reference
- IP address
- Connection timestamp
- Heartbeat status
- Custom metadata object

### Heartbeat Mechanism

The server implements a ping/pong heartbeat:
1. Server sends ping at configured interval
2. Client responds with pong
3. Clients that don't respond are terminated
4. Dead connections are cleaned up automatically

### Message Flow

1. Client sends message → WebSocket `message` event
2. Server parses JSON payload
3. Server adds metadata (clientId, receivedAt)
4. Server emits `message` event
5. Application handles message
6. Application sends response via `sendToClient` or `sendSystemMessage`

## Best Practices

1. **Always handle events**: Listen to error events to prevent crashes
2. **Validate messages**: Check message structure before processing
3. **Use system messages**: Leverage structured system messages for consistency
4. **Implement graceful shutdown**: Notify clients before stopping
5. **Monitor client count**: Track connections for capacity planning
6. **Set appropriate limits**: Configure maxMessageSize based on needs
7. **Use metadata**: Store client state in metadata for context
8. **Handle timeouts**: Implement logic for client timeout events
