# Message Types Documentation

## Overview

The chat system uses a structured message format based on JSON. All messages have a `type` field that determines how they should be processed. This document describes all message types and their structures.

## Message Type Constants

```javascript
const MessageTypes = {
  SYSTEM: 'system',      // System-initiated messages
  MESSAGE: 'message',    // User messages
  PING: 'ping',         // Heartbeat ping
  PONG: 'pong',         // Heartbeat pong response
  ERROR: 'error'        // Error messages
};
```

---

## System Messages

System messages are sent by the server to communicate system-level information to clients.

### Structure

```javascript
{
  type: 'system',
  subtype: string,      // 'welcome' | 'disconnect' | 'info' | 'warning' | 'error'
  message: string,      // Human-readable message
  timestamp: string,    // ISO 8601 timestamp
  ...additionalFields   // Optional additional data
}
```

### System Message Subtypes

#### 1. Welcome Message

Sent when a client first connects to the server.

```javascript
{
  type: 'system',
  subtype: 'welcome',
  message: 'Welcome to the chat system',
  clientId: 'uuid-v4-string',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Fields:**
- **clientId** `string` - Unique identifier assigned to the client

**When sent:** Immediately after client connection is established

**Example usage:**
```javascript
server.on('clientConnected', ({ clientId }) => {
  // Welcome message is sent automatically
});
```

---

#### 2. Disconnect Message

Sent when the server is about to disconnect a client.

```javascript
{
  type: 'system',
  subtype: 'disconnect',
  message: 'Disconnected by server',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**When sent:** Before server closes a client connection

**Example usage:**
```javascript
server.disconnectClient(clientId, 'Idle timeout');
```

---

#### 3. Info Message

General informational messages.

```javascript
{
  type: 'system',
  subtype: 'info',
  message: 'Your session will expire in 5 minutes',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**When sent:** For general information that doesn't require immediate action

**Example usage:**
```javascript
server.sendSystemMessage(clientId, 'New feature available!', 'info');
```

---

#### 4. Warning Message

Warning messages that indicate potential issues.

```javascript
{
  type: 'system',
  subtype: 'warning',
  message: 'Server maintenance scheduled in 10 minutes',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**When sent:** For important notifications that require user awareness

**Example usage:**
```javascript
server.broadcastSystemMessage('Server restart in 5 minutes', 'warning');
```

---

#### 5. Error Message

Error notifications.

```javascript
{
  type: 'system',
  subtype: 'error',
  message: 'Invalid command format',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**When sent:** When an error occurs that the client should know about

**Example usage:**
```javascript
server.sendSystemMessage(clientId, 'Command not recognized', 'error');
```

---

## User Messages

User messages are sent by clients to the server.

### Structure

```javascript
{
  type: 'message',
  text: string,         // Message content
  timestamp: string,    // ISO 8601 timestamp
  ...additionalFields   // Optional additional data
}
```

### Example

```javascript
{
  type: 'message',
  text: 'Hello, server!',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### With Additional Data

```javascript
{
  type: 'message',
  text: 'Hello, server!',
  timestamp: '2024-01-01T00:00:00.000Z',
  metadata: {
    priority: 'high',
    category: 'support'
  }
}
```

**Sent by:** Client using `client.sendMessage(text, additionalData)`

**Received by:** Server via `message` event with added `clientId` and `receivedAt` fields

---

## Ping/Pong Messages

Used for connection health checks.

### Ping Message

Sent by client to test server responsiveness.

```javascript
{
  type: 'ping',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Sent by:** Client using `client.ping()`

---

### Pong Message

Sent by server in response to a ping.

```javascript
{
  type: 'pong',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Sent by:** Server automatically in response to ping

---

## Error Messages

Standalone error messages (different from system error messages).

### Structure

```javascript
{
  type: 'error',
  message: string,      // Error description
  timestamp: string,    // ISO 8601 timestamp
  ...additionalFields   // Optional error details
}
```

### Example

```javascript
{
  type: 'error',
  message: 'Invalid message format',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

**Sent by:** Server when message validation fails

---

## Message Metadata

### Server-Added Metadata

When the server receives a message from a client, it adds metadata:

```javascript
{
  ...originalMessage,
  clientId: 'uuid-v4-string',     // Sender's client ID
  receivedAt: '2024-01-01T00:00:00.000Z'  // Server receipt timestamp
}
```

### Example

Client sends:
```javascript
{
  type: 'message',
  text: 'Hello',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

Server receives and emits:
```javascript
{
  type: 'message',
  text: 'Hello',
  timestamp: '2024-01-01T00:00:00.000Z',
  clientId: 'abc-123-def',
  receivedAt: '2024-01-01T00:00:00.100Z'
}
```

---

## Custom Message Types

You can define custom message types for your application:

### Example: Chat Message

```javascript
{
  type: 'chat',
  userId: 'user-123',
  username: 'John',
  text: 'Hello everyone!',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Example: Command Message

```javascript
{
  type: 'command',
  command: 'get_status',
  params: {
    verbose: true
  },
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Example: Notification

```javascript
{
  type: 'notification',
  title: 'New Message',
  body: 'You have a new message from Admin',
  priority: 'high',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

---

## Utility Functions

The `messageTypes` module provides utility functions for creating and validating messages.

### createSystemMessage(subtype, message, additionalData)

Creates a system message object.

```javascript
const { createSystemMessage } = require('./src/utils/messageTypes');

const msg = createSystemMessage('info', 'Server maintenance tonight', {
  scheduledTime: '2024-01-01T22:00:00.000Z'
});

// Result:
// {
//   type: 'system',
//   subtype: 'info',
//   message: 'Server maintenance tonight',
//   timestamp: '2024-01-01T00:00:00.000Z',
//   scheduledTime: '2024-01-01T22:00:00.000Z'
// }
```

---

### createUserMessage(text, additionalData)

Creates a user message object.

```javascript
const { createUserMessage } = require('./src/utils/messageTypes');

const msg = createUserMessage('Hello!', {
  metadata: { priority: 'normal' }
});

// Result:
// {
//   type: 'message',
//   text: 'Hello!',
//   timestamp: '2024-01-01T00:00:00.000Z',
//   metadata: { priority: 'normal' }
// }
```

---

### createErrorMessage(message, additionalData)

Creates an error message object.

```javascript
const { createErrorMessage } = require('./src/utils/messageTypes');

const msg = createErrorMessage('Invalid command', {
  code: 'INVALID_CMD',
  details: 'Command not found'
});

// Result:
// {
//   type: 'error',
//   message: 'Invalid command',
//   timestamp: '2024-01-01T00:00:00.000Z',
//   code: 'INVALID_CMD',
//   details: 'Command not found'
// }
```

---

### isValidMessage(message)

Validates a message object.

```javascript
const { isValidMessage } = require('./src/utils/messageTypes');

isValidMessage({ type: 'message', text: 'Hello' });  // true
isValidMessage({ text: 'Hello' });                   // false (no type)
isValidMessage(null);                                // false
isValidMessage('string');                            // false
```

---

### isValidSystemMessage(message)

Validates a system message object.

```javascript
const { isValidSystemMessage } = require('./src/utils/messageTypes');

isValidSystemMessage({
  type: 'system',
  subtype: 'info',
  message: 'Hello'
});  // true

isValidSystemMessage({
  type: 'system',
  message: 'Hello'
});  // false (no subtype)

isValidSystemMessage({
  type: 'message',
  text: 'Hello'
});  // false (not a system message)
```

---

## Message Flow Examples

### Client → Server → Client

```
1. Client sends message:
{
  type: 'message',
  text: 'What time is it?',
  timestamp: '2024-01-01T10:00:00.000Z'
}

2. Server receives with metadata:
{
  type: 'message',
  text: 'What time is it?',
  timestamp: '2024-01-01T10:00:00.000Z',
  clientId: 'abc-123',
  receivedAt: '2024-01-01T10:00:00.050Z'
}

3. Server sends response:
{
  type: 'system',
  subtype: 'info',
  message: 'Current time: 10:00:00 AM',
  timestamp: '2024-01-01T10:00:00.100Z'
}

4. Client receives response
```

### Broadcast Flow

```
1. Server broadcasts:
{
  type: 'system',
  subtype: 'warning',
  message: 'Server restarting in 5 minutes',
  timestamp: '2024-01-01T10:00:00.000Z'
}

2. All connected clients receive the same message
```

---

## Best Practices

### 1. Always Include Timestamps

```javascript
// Good
{
  type: 'message',
  text: 'Hello',
  timestamp: new Date().toISOString()
}

// Bad
{
  type: 'message',
  text: 'Hello'
}
```

### 2. Use Appropriate Message Types

```javascript
// Good - using system message for server notifications
server.sendSystemMessage(clientId, 'Session timeout warning', 'warning');

// Bad - using generic message
server.sendToClient(clientId, { type: 'message', text: 'Session timeout warning' });
```

### 3. Validate Before Processing

```javascript
server.on('message', (message) => {
  if (!isValidMessage(message)) {
    server.sendSystemMessage(message.clientId, 'Invalid message format', 'error');
    return;
  }
  
  // Process valid message
  handleMessage(message);
});
```

### 4. Use Subtypes for System Messages

```javascript
// Good - clear intent
server.sendSystemMessage(clientId, 'Error occurred', 'error');

// Bad - ambiguous
server.sendToClient(clientId, { type: 'system', message: 'Error occurred' });
```

### 5. Include Context in Messages

```javascript
// Good - includes context
{
  type: 'system',
  subtype: 'info',
  message: 'File uploaded successfully',
  timestamp: '2024-01-01T10:00:00.000Z',
  fileName: 'document.pdf',
  fileSize: 1024000
}

// Okay - minimal but functional
{
  type: 'system',
  subtype: 'info',
  message: 'File uploaded successfully',
  timestamp: '2024-01-01T10:00:00.000Z'
}
```

### 6. Handle Unknown Message Types

```javascript
client.on('message', (message) => {
  switch (message.type) {
    case 'system':
      handleSystemMessage(message);
      break;
    case 'notification':
      handleNotification(message);
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
});
```

---

## Message Size Limits

The server enforces a maximum message size (default: 1MB). Plan your messages accordingly:

```javascript
// Configure on server
const server = new ChatServer({
  maxMessageSize: 1048576  // 1MB in bytes
});
```

**Recommendations:**
- Keep messages concise
- Use references for large data (e.g., file IDs instead of file contents)
- Split large payloads into multiple messages
- Compress data if needed before sending

---

## Error Handling

### Invalid Message Format

When server receives invalid JSON:
```javascript
// Server sends:
{
  type: 'error',
  message: 'Invalid message format',
  timestamp: '2024-01-01T10:00:00.000Z'
}
```

### Message Too Large

When message exceeds `maxMessageSize`:
- Connection is closed by WebSocket layer
- Client receives disconnect event

### Missing Required Fields

Validate messages and respond with errors:
```javascript
if (!message.type) {
  server.sendSystemMessage(clientId, 'Message type is required', 'error');
}
```

---

## TypeScript Type Definitions

For TypeScript users, here are type definitions:

```typescript
type MessageType = 'system' | 'message' | 'ping' | 'pong' | 'error';
type SystemSubtype = 'welcome' | 'disconnect' | 'info' | 'warning' | 'error';

interface BaseMessage {
  type: MessageType;
  timestamp: string;
}

interface SystemMessage extends BaseMessage {
  type: 'system';
  subtype: SystemSubtype;
  message: string;
  clientId?: string;
}

interface UserMessage extends BaseMessage {
  type: 'message';
  text: string;
}

interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
}

interface PingMessage extends BaseMessage {
  type: 'ping';
}

interface PongMessage extends BaseMessage {
  type: 'pong';
}

type Message = SystemMessage | UserMessage | ErrorMessage | PingMessage | PongMessage;
```
