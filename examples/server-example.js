/**
 * server-example.js
 * 
 * Example implementation of a WebSocket chat server
 * Demonstrates how to use the ChatServer class for system-to-user communication
 */

const ChatServer = require('../src/server/ChatServer');
const { createSystemMessage } = require('../src/utils/messageTypes');

// Create server instance
const server = new ChatServer({
  port: 8080,
  heartbeatInterval: 30000,
  enableLogging: true
});

// Track conversation state for each client
const conversations = new Map();

// Handle new client connections
server.on('clientConnected', ({ clientId, clientIp }) => {
  console.log(`\n=== New Client Connected ===`);
  console.log(`Client ID: ${clientId}`);
  console.log(`IP Address: ${clientIp}`);
  
  // Initialize conversation state
  conversations.set(clientId, {
    messageCount: 0,
    startTime: new Date()
  });
  
  // Send a personalized welcome message
  setTimeout(() => {
    server.sendSystemMessage(
      clientId,
      'Welcome! I am the chat system. You can send me messages and I will respond.',
      'info'
    );
  }, 1000);
});

// Handle incoming messages from clients
server.on('message', (message) => {
  const { clientId, type, text } = message;
  
  console.log(`\n=== Message Received ===`);
  console.log(`From: ${clientId}`);
  console.log(`Type: ${type}`);
  console.log(`Content: ${JSON.stringify(message)}`);
  
  // Update conversation state
  const conversation = conversations.get(clientId);
  if (conversation) {
    conversation.messageCount++;
  }
  
  // Handle different message types
  if (type === 'message' && text) {
    // Simple echo response with some intelligence
    handleUserMessage(clientId, text, conversation);
  }
});

// Handle client disconnections
server.on('clientDisconnected', ({ clientId, code, reason }) => {
  console.log(`\n=== Client Disconnected ===`);
  console.log(`Client ID: ${clientId}`);
  console.log(`Code: ${code}`);
  console.log(`Reason: ${reason}`);
  
  const conversation = conversations.get(clientId);
  if (conversation) {
    const duration = Math.floor((new Date() - conversation.startTime) / 1000);
    console.log(`Session duration: ${duration} seconds`);
    console.log(`Messages exchanged: ${conversation.messageCount}`);
    conversations.delete(clientId);
  }
});

// Handle client errors
server.on('clientError', ({ clientId, error }) => {
  console.error(`\n=== Client Error ===`);
  console.error(`Client ID: ${clientId}`);
  console.error(`Error: ${error.message}`);
});

// Handle client timeouts
server.on('clientTimeout', ({ clientId }) => {
  console.log(`\n=== Client Timeout ===`);
  console.log(`Client ID: ${clientId}`);
  conversations.delete(clientId);
});

/**
 * Handles user messages and generates appropriate responses
 */
function handleUserMessage(clientId, text, conversation) {
  const lowercaseText = text.toLowerCase().trim();
  
  // Simple command handling
  if (lowercaseText === 'help') {
    server.sendSystemMessage(
      clientId,
      'Available commands:\n- help: Show this help message\n- status: Show your connection status\n- time: Get current server time\n- stats: Show session statistics',
      'info'
    );
  } else if (lowercaseText === 'status') {
    const info = server.getClientInfo(clientId);
    server.sendSystemMessage(
      clientId,
      `You are connected as ${clientId}\nConnected since: ${info.connectedAt}\nTotal clients: ${server.getClientCount()}`,
      'info'
    );
  } else if (lowercaseText === 'time') {
    server.sendSystemMessage(
      clientId,
      `Current server time: ${new Date().toISOString()}`,
      'info'
    );
  } else if (lowercaseText === 'stats') {
    const duration = Math.floor((new Date() - conversation.startTime) / 1000);
    server.sendSystemMessage(
      clientId,
      `Session Statistics:\n- Duration: ${duration} seconds\n- Messages sent: ${conversation.messageCount}\n- Connected clients: ${server.getClientCount()}`,
      'info'
    );
  } else if (lowercaseText.startsWith('broadcast ')) {
    // Broadcast a message to all clients
    const broadcastMsg = text.substring(10);
    const count = server.broadcastSystemMessage(
      `Broadcast from ${clientId.substring(0, 8)}: ${broadcastMsg}`,
      'info'
    );
    server.sendSystemMessage(
      clientId,
      `Message broadcasted to ${count} clients`,
      'info'
    );
  } else {
    // Echo back the message with a friendly response
    server.sendSystemMessage(
      clientId,
      `I received your message: "${text}"\n\nYou can type "help" to see available commands.`,
      'info'
    );
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n\n=== Shutting down server ===');
  
  // Notify all clients
  server.broadcastSystemMessage('Server is shutting down. Goodbye!', 'warning');
  
  // Wait a bit for messages to be sent
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Stop the server
  await server.stop();
  
  console.log('Server stopped gracefully');
  process.exit(0);
});

// Start the server
async function main() {
  try {
    console.log('=== WebSocket Chat Server ===');
    console.log('Starting server...\n');
    
    await server.start();
    
    console.log('\n=== Server Information ===');
    console.log(`WebSocket URL: ws://localhost:${server.port}`);
    console.log(`Heartbeat interval: ${server.heartbeatInterval}ms`);
    console.log(`Max message size: ${server.maxMessageSize} bytes`);
    console.log('\nServer is running. Press Ctrl+C to stop.\n');
    
    // Example: Send periodic system messages to all clients
    setInterval(() => {
      const clientCount = server.getClientCount();
      if (clientCount > 0) {
        console.log(`\n[INFO] Active clients: ${clientCount}`);
      }
    }, 60000); // Every minute
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
main();
