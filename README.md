# Grafeddy - WebSocket Chat System

A robust, production-ready WebSocket-based chat system designed for system-to-user conversations. This implementation provides a reliable foundation for real-time communication between a server and multiple clients without the need for a UI.

## Features

- 🚀 **Robust WebSocket Server**: Production-ready server with connection management
- 💬 **System-to-User Chat**: Designed for server-initiated conversations with clients
- 🔄 **Auto-Reconnection**: Client automatically reconnects on connection loss
- ❤️ **Heartbeat Monitoring**: Automatic detection and cleanup of dead connections
- 📨 **Message Types**: Support for system messages, user messages, and errors
- 🔍 **Client Management**: Track and manage individual client connections
- 📡 **Broadcasting**: Send messages to all connected clients or specific targets
- 🛡️ **Error Handling**: Comprehensive error handling and validation
- 📝 **Extensive Logging**: Built-in logging with configurable levels
- 📚 **Well Documented**: Complete API documentation and examples

## Installation

```bash
npm install
```

## Quick Start

### Running the Server

```bash
npm run start:server
```

The server will start on `ws://localhost:8080` by default.

### Running the Client

In a separate terminal:

```bash
npm run start:client
```

## Basic Usage

### Server Implementation

```javascript
const { ChatServer } = require('grafeddy');

// Create server
const server = new ChatServer({
  port: 8080,
  heartbeatInterval: 30000,
  enableLogging: true
});

// Handle client connections
server.on('clientConnected', ({ clientId, clientIp }) => {
  console.log(`Client ${clientId} connected from ${clientIp}`);
  server.sendSystemMessage(clientId, 'Welcome to the chat!', 'info');
});

// Handle messages
server.on('message', (message) => {
  console.log('Received:', message);
  // Process and respond to the message
  server.sendSystemMessage(message.clientId, `Echo: ${message.text}`, 'info');
});

// Start server
await server.start();
```

### Client Implementation

```javascript
const { ChatClient } = require('grafeddy');

// Create client
const client = new ChatClient({
  url: 'ws://localhost:8080',
  autoReconnect: true
});

// Handle connection
client.on('connected', () => {
  console.log('Connected to server');
});

// Handle messages
client.on('message', (message) => {
  console.log('Received:', message);
});

// Connect and send message
await client.connect();
client.sendMessage('Hello, server!');
```

## API Documentation

Complete API documentation is available in the `/docs` folder:

- [Server API Documentation](docs/SERVER_API.md)
- [Client API Documentation](docs/CLIENT_API.md)
- [Message Types](docs/MESSAGE_TYPES.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

## Project Structure

```
grafeddy/
├── src/
│   ├── server/
│   │   └── ChatServer.js      # WebSocket server implementation
│   ├── client/
│   │   └── ChatClient.js      # WebSocket client implementation
│   └── utils/
│       ├── messageTypes.js    # Message type definitions
│       └── logger.js          # Logging utility
├── examples/
│   ├── server-example.js      # Example server implementation
│   └── client-example.js      # Example client implementation
├── docs/
│   ├── SERVER_API.md          # Server API documentation
│   ├── CLIENT_API.md          # Client API documentation
│   ├── MESSAGE_TYPES.md       # Message types documentation
│   └── ARCHITECTURE.md        # Architecture overview
├── index.js                   # Main entry point
└── package.json
```

## Message Types

The system supports several message types:

### System Messages
Server-initiated messages to clients:
```javascript
{
  type: 'system',
  subtype: 'info|warning|error|welcome|disconnect',
  message: 'Message text',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### User Messages
Client-initiated messages:
```javascript
{
  type: 'message',
  text: 'Message text',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Error Messages
Error notifications:
```javascript
{
  type: 'error',
  message: 'Error description',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

## Advanced Features

### Broadcasting Messages

```javascript
// Broadcast to all clients
server.broadcast({ type: 'announcement', text: 'Server maintenance in 5 minutes' });

// Broadcast excluding specific clients
server.broadcast(message, [clientId1, clientId2]);

// Broadcast system message
server.broadcastSystemMessage('System update available', 'info');
```

### Client Management

```javascript
// Get all connected clients
const clients = server.getConnectedClients();

// Get client info
const info = server.getClientInfo(clientId);

// Disconnect a client
server.disconnectClient(clientId, 'Reason for disconnect');

// Update client metadata
server.updateClientMetadata(clientId, { username: 'John' });
```

### Auto-Reconnection

The client supports automatic reconnection with configurable parameters:

```javascript
const client = new ChatClient({
  url: 'ws://localhost:8080',
  autoReconnect: true,
  reconnectInterval: 5000,      // 5 seconds
  maxReconnectAttempts: 5       // 0 = unlimited
});
```

## Configuration Options

### Server Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| port | number | 8080 | WebSocket server port |
| heartbeatInterval | number | 30000 | Ping interval in milliseconds |
| maxMessageSize | number | 1048576 | Maximum message size (bytes) |
| enableLogging | boolean | true | Enable server logging |

### Client Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| url | string | required | WebSocket server URL |
| autoReconnect | boolean | true | Enable auto-reconnection |
| reconnectInterval | number | 5000 | Reconnection interval (ms) |
| maxReconnectAttempts | number | 5 | Max reconnection attempts |
| enableLogging | boolean | true | Enable client logging |

## Examples

See the `/examples` directory for complete, runnable examples:

- `server-example.js`: Full-featured server with command handling
- `client-example.js`: Interactive client with readline interface

## Error Handling

The system includes comprehensive error handling:

```javascript
// Server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

server.on('clientError', ({ clientId, error }) => {
  console.error(`Client ${clientId} error:`, error);
});

// Client errors
client.on('error', (error) => {
  console.error('Connection error:', error);
});

client.on('reconnectFailed', () => {
  console.error('Failed to reconnect');
});
```

## Security Considerations

- Message size limits prevent memory exhaustion
- Heartbeat mechanism detects and removes dead connections
- Input validation prevents malformed message processing
- Connection metadata can be used for authentication/authorization

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing style conventions
2. All functions are documented with JSDoc comments
3. Examples are updated if API changes
4. Documentation is updated for new features

## License

ISC

## Support

For issues, questions, or contributions, please visit the project repository.
