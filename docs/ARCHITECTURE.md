# Architecture Overview

## System Architecture

The Grafeddy WebSocket Chat System is designed as a robust, event-driven communication platform for system-to-user conversations. This document explains the architectural decisions, component interactions, and design patterns used.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ChatClient Instance                        │ │
│  │  - Connection Management                                │ │
│  │  - Auto-reconnection                                    │ │
│  │  - Event Handling                                       │ │
│  │  - Message Sending/Receiving                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket Connection
                            │ (ws:// or wss://)
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Server Application                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ChatServer Instance                        │ │
│  │  - Connection Management                                │ │
│  │  - Client Tracking (Map)                                │ │
│  │  - Heartbeat Monitor                                    │ │
│  │  - Message Routing                                      │ │
│  │  - Broadcasting                                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Server Components

#### ChatServer Class
**Location:** `src/server/ChatServer.js`

**Responsibilities:**
- Manage WebSocket server lifecycle
- Handle client connections and disconnections
- Route messages between system and clients
- Maintain client registry
- Monitor connection health via heartbeat
- Broadcast messages to multiple clients

**Key Features:**
- Extends `EventEmitter` for event-driven architecture
- Uses `Map` for efficient client lookup
- Implements ping/pong heartbeat mechanism
- Provides both targeted and broadcast messaging

**Data Structures:**
```javascript
// Client Registry
clients: Map<clientId, ClientInfo>

// ClientInfo Structure
{
  id: string,           // UUID v4
  ws: WebSocket,        // WebSocket connection
  ip: string,          // Client IP address
  connectedAt: Date,   // Connection timestamp
  isAlive: boolean,    // Heartbeat status
  metadata: Object     // Custom client data
}
```

---

### 2. Client Components

#### ChatClient Class
**Location:** `src/client/ChatClient.js`

**Responsibilities:**
- Establish and maintain WebSocket connection
- Implement auto-reconnection logic
- Handle incoming messages
- Send messages to server
- Emit events for application handling

**Key Features:**
- Extends `EventEmitter` for event-driven architecture
- Automatic reconnection with exponential backoff
- Connection state management
- Message queue (implicit via WebSocket)

**State Machine:**
```
┌─────────────┐
│ Initialized │
└──────┬──────┘
       │ connect()
       ▼
┌─────────────┐
│ Connecting  │─────► (on error) ──┐
└──────┬──────┘                     │
       │ on 'open'                  │
       ▼                            │
┌─────────────┐                     │
│  Connected  │                     │
└──────┬──────┘                     │
       │ on 'close'                 │
       ▼                            │
┌─────────────┐                     │
│Disconnected │◄────────────────────┘
└──────┬──────┘
       │ (auto-reconnect)
       │
       └────► Connecting (retry)
```

---

### 3. Utility Components

#### Message Types
**Location:** `src/utils/messageTypes.js`

**Responsibilities:**
- Define message type constants
- Provide message validation functions
- Offer message creation helpers

**Message Type Hierarchy:**
```
Message (base)
├── System Message
│   ├── Welcome
│   ├── Disconnect
│   ├── Info
│   ├── Warning
│   └── Error
├── User Message
├── Ping Message
├── Pong Message
└── Error Message
```

#### Logger
**Location:** `src/utils/logger.js`

**Responsibilities:**
- Structured logging
- Log level management
- Consistent log formatting

---

## Communication Flow

### Connection Establishment

```
Client                          Server
  │                               │
  │─────── WebSocket Connect ────►│
  │                               │
  │                               │ Create client record
  │                               │ Generate UUID
  │                               │
  │◄──── Welcome Message ─────────│
  │     (with clientId)           │
  │                               │
  │ Store clientId                │
  │ Emit 'welcome'                │
  │                               │
```

### Message Exchange

```
Client                          Server                    Application
  │                               │                            │
  │──── User Message ────────────►│                            │
  │                               │                            │
  │                               │ Add metadata               │
  │                               │ (clientId, receivedAt)     │
  │                               │                            │
  │                               │────── Emit 'message' ─────►│
  │                               │                            │
  │                               │                            │ Process
  │                               │                            │ message
  │                               │                            │
  │                               │◄──── sendSystemMessage ────│
  │                               │                            │
  │◄──── System Response ─────────│                            │
  │                               │                            │
  │ Emit 'message'                │                            │
  │                               │                            │
```

### Broadcast Flow

```
Server                     Clients
  │                         │ │ │
  │                         │ │ │
  │ broadcast(message) ────►│ │ │
  │                         │ │ │
  │────────────────────────►│ │ │  (sent to all)
  │                         │ │ │
  │────────────────────────►│ │ │
  │                         │ │ │
```

### Heartbeat Mechanism

```
Server                          Client
  │                               │
  │──────── Ping ────────────────►│
  │                               │
  │                               │ Set isAlive = true
  │                               │
  │◄──────── Pong ────────────────│
  │                               │
  │ Client is alive               │
  │                               │
  │                               │
  (30 seconds later)              │
  │                               │
  │──────── Ping ────────────────►│
  │                               │
  │         (no response)         │
  │                               │
  │ Terminate connection          │
  │                               │
```

---

## Design Patterns

### 1. Event-Driven Architecture

Both `ChatServer` and `ChatClient` extend `EventEmitter`, enabling loose coupling between components.

**Benefits:**
- Decoupled components
- Easy to extend functionality
- Reactive programming model
- Multiple listeners per event

**Example:**
```javascript
server.on('clientConnected', handleConnection);
server.on('clientConnected', logConnection);
server.on('clientConnected', updateMetrics);
```

### 2. Observer Pattern

The event system implements the observer pattern where:
- **Subject:** ChatServer/ChatClient
- **Observers:** Event listeners
- **Notifications:** Emitted events

### 3. Factory Pattern

Message creation utilities use factory pattern:

```javascript
// Factory functions
createSystemMessage(subtype, message, data)
createUserMessage(text, data)
createErrorMessage(message, data)
```

### 4. Registry Pattern

Server maintains a client registry using `Map`:

```javascript
clients = new Map<clientId, clientInfo>
```

**Operations:**
- Add: `clients.set(clientId, info)`
- Get: `clients.get(clientId)`
- Remove: `clients.delete(clientId)`
- Iterate: `clients.forEach(...)`

---

## Data Flow

### Message Processing Pipeline

```
┌─────────────┐
│ Raw Message │
│  (WebSocket)│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  JSON Parse     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Validation     │
│  (isValidMsg)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Add Metadata   │
│  (clientId,     │
│   receivedAt)   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Emit Event     │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Application    │
│  Handler        │
└─────────────────┘
```

---

## Concurrency Model

### Server Concurrency

Node.js is single-threaded with event loop:

```
┌──────────────────────────────────────┐
│         Event Loop (Single Thread)    │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │  WebSocket Events              │  │
│  │  - connection                  │  │
│  │  - message                     │  │
│  │  - close                       │  │
│  │  - error                       │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  Timers                        │  │
│  │  - Heartbeat interval          │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  Event Handlers                │  │
│  │  - User defined callbacks      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Implications:**
- No race conditions on client registry
- Synchronous message processing
- Non-blocking I/O for WebSocket operations
- Timers for heartbeat are queued in event loop

### Client Concurrency

Similar single-threaded model:
- One connection per client instance
- Sequential message processing
- Async/await for connection management

---

## Error Handling Strategy

### Layered Error Handling

```
┌─────────────────────────────────────┐
│  Application Layer                  │
│  - Business logic errors            │
│  - Validation errors                │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  Chat System Layer                  │
│  - Invalid message format           │
│  - Connection errors                │
│  - Client not found                 │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│  WebSocket Layer                    │
│  - Network errors                   │
│  - Protocol errors                  │
│  - Connection failures              │
└─────────────────────────────────────┘
```

### Error Recovery

1. **Transient Errors:** Auto-reconnect
2. **Protocol Errors:** Send error message and continue
3. **Fatal Errors:** Disconnect and emit error event
4. **Application Errors:** Application decides recovery strategy

---

## Scalability Considerations

### Current Architecture

**Single Server Instance:**
- All clients connect to one server
- In-memory client registry
- Single process handling all connections

**Limitations:**
- Memory: Limited by available RAM
- CPU: Limited by single thread (event loop)
- Connections: Limited by OS and process limits

### Scaling Strategies (Future)

#### 1. Vertical Scaling
- Increase server resources
- Optimize message processing
- Use binary protocols (MessagePack, Protocol Buffers)

#### 2. Horizontal Scaling
- Multiple server instances
- Load balancer (sticky sessions)
- Shared state (Redis for client registry)
- Pub/Sub for cross-server messaging

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │     │ Client  │     │ Client  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     └───────┬───────┴───────┬───────┘
             │               │
     ┌───────▼─────┐  ┌──────▼──────┐
     │  Server 1   │  │  Server 2   │
     └───────┬─────┘  └──────┬──────┘
             │               │
             └───────┬───────┘
                     │
         ┌───────────▼───────────┐
         │  Redis (Pub/Sub)      │
         │  - Client Registry    │
         │  - Message Broadcasting│
         └───────────────────────┘
```

#### 3. Microservices Architecture
- Separate WebSocket service
- Separate message processing service
- Message queue (RabbitMQ, Kafka)
- Database for persistence

---

## Security Architecture

### Current Security Measures

1. **Message Size Limits**
   - Prevents memory exhaustion
   - Default: 1MB per message

2. **Heartbeat Mechanism**
   - Detects dead connections
   - Cleans up resources

3. **Input Validation**
   - JSON parsing with error handling
   - Message type validation

4. **Connection Metadata**
   - IP address tracking
   - Custom metadata for authentication

### Recommended Enhancements

1. **Authentication**
   - Token-based authentication
   - JWT validation
   - Session management

2. **Authorization**
   - Role-based access control
   - Permission checking
   - Resource isolation

3. **Encryption**
   - Use WSS (WebSocket Secure)
   - TLS/SSL certificates
   - End-to-end encryption for sensitive data

4. **Rate Limiting**
   - Message rate limits per client
   - Connection rate limits
   - Throttling mechanism

5. **Input Sanitization**
   - XSS prevention
   - SQL injection prevention (if using database)
   - Command injection prevention

---

## Performance Characteristics

### Time Complexity

**Server Operations:**
- Add client: O(1) - Map insertion
- Remove client: O(1) - Map deletion
- Get client: O(1) - Map lookup
- Broadcast: O(n) - where n = number of clients
- Heartbeat check: O(n) - iterates all clients

**Client Operations:**
- Send message: O(1)
- Receive message: O(1)
- Reconnect: O(1)

### Space Complexity

**Server Memory:**
- Client registry: O(n) - n clients
- Each client info: ~1KB
- Message buffers: O(m) - m messages in flight

**Client Memory:**
- Connection state: O(1)
- Reconnection state: O(1)

### Network Performance

- **Latency:** Typically <10ms on local network
- **Throughput:** Limited by WebSocket frame size and network bandwidth
- **Overhead:** WebSocket header ~2-14 bytes per frame

---

## Testing Strategy

### Unit Tests
- Message validation functions
- Message creation utilities
- Logger functionality

### Integration Tests
- Server start/stop
- Client connect/disconnect
- Message send/receive
- Broadcast functionality
- Heartbeat mechanism

### Load Tests
- Multiple concurrent clients
- High message volume
- Connection stability
- Memory leaks
- Resource cleanup

### Example Test Scenarios

```javascript
// Connection test
1. Start server
2. Connect client
3. Verify welcome message received
4. Verify client appears in server registry

// Message test
1. Connect client
2. Send message from client
3. Verify server receives message with metadata
4. Send response from server
5. Verify client receives response

// Reconnection test
1. Connect client
2. Stop server
3. Verify client emits disconnected
4. Start server
5. Verify client reconnects
6. Verify new client ID assigned

// Broadcast test
1. Connect 3 clients
2. Broadcast from server
3. Verify all 3 clients receive message

// Heartbeat test
1. Connect client
2. Mock WebSocket to not respond to ping
3. Wait for heartbeat interval
4. Verify client is disconnected
```

---

## Monitoring and Observability

### Metrics to Track

**Server Metrics:**
- Active connections
- Messages per second
- Broadcast operations
- Client timeouts
- Error rate
- Memory usage
- CPU usage

**Client Metrics:**
- Connection state
- Reconnection attempts
- Messages sent
- Messages received
- Connection duration

### Logging

**Log Levels:**
- DEBUG: Detailed message content
- INFO: Connection events, state changes
- WARN: Recoverable issues
- ERROR: Failures, exceptions

**Log Format:**
```
[timestamp] [component] [level] message {metadata}
```

**Example:**
```
[2024-01-01T10:00:00.000Z] [ChatServer] [INFO] Client connected {clientId: "abc-123", ip: "192.168.1.100"}
```

---

## Future Enhancements

### Planned Features

1. **Message Persistence**
   - Store messages in database
   - Message history retrieval
   - Offline message queue

2. **Advanced Routing**
   - Topic-based subscriptions
   - Channel support
   - Private messaging

3. **Clustering Support**
   - Multi-server deployment
   - Load balancing
   - Shared state management

4. **Advanced Security**
   - Authentication plugins
   - Rate limiting
   - IP whitelisting/blacklisting

5. **Monitoring Dashboard**
   - Real-time metrics
   - Client list visualization
   - Message flow tracking

6. **Binary Protocol Support**
   - MessagePack
   - Protocol Buffers
   - Reduced bandwidth

---

## Conclusion

The Grafeddy WebSocket Chat System is built on solid architectural principles:

- **Event-driven** for flexibility
- **Modular** for maintainability  
- **Extensible** for future growth
- **Robust** for production use

The architecture supports the core requirement of system-to-user communication while providing a foundation for advanced features and scalability improvements.
