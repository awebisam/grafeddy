/**
 * client-example.js
 * 
 * Example implementation of a WebSocket chat client
 * Demonstrates how to connect to the chat server and exchange messages
 */

const ChatClient = require('../src/client/ChatClient');
const readline = require('readline');

// Create client instance
const client = new ChatClient({
  url: 'ws://localhost:8080',
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  enableLogging: true
});

// Setup readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You> '
});

// Handle successful connection
client.on('connected', () => {
  console.log('\n=== Connected to Chat Server ===\n');
});

// Handle welcome message
client.on('welcome', (message) => {
  console.log(`\n[SYSTEM] ${message.message}`);
  console.log(`[SYSTEM] Your Client ID: ${message.clientId}\n`);
  console.log('Type your message and press Enter to send.');
  console.log('Type "exit" or "quit" to disconnect.\n');
  rl.prompt();
});

// Handle incoming messages
client.on('message', (message) => {
  // Clear the current prompt line
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  
  // Display message based on type
  if (message.type === 'system') {
    console.log(`\n[SYSTEM] ${message.message}\n`);
  } else if (message.type === 'pong') {
    console.log(`\n[PONG] Server responded to ping\n`);
  } else if (message.type === 'error') {
    console.log(`\n[ERROR] ${message.message}\n`);
  } else {
    console.log(`\n[MESSAGE] ${JSON.stringify(message, null, 2)}\n`);
  }
  
  // Re-display the prompt
  rl.prompt();
});

// Handle system info messages
client.on('systemInfo', (message) => {
  // Already handled in generic message handler
});

// Handle system warnings
client.on('systemWarning', (message) => {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  console.log(`\n[WARNING] ${message.message}\n`);
  rl.prompt();
});

// Handle system errors
client.on('systemError', (message) => {
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  console.log(`\n[ERROR] ${message.message}\n`);
  rl.prompt();
});

// Handle disconnection
client.on('disconnected', ({ code, reason }) => {
  console.log(`\n=== Disconnected from Server ===`);
  console.log(`Code: ${code}`);
  console.log(`Reason: ${reason}\n`);
});

// Handle server-initiated disconnect
client.on('serverDisconnect', (message) => {
  console.log(`\n[SYSTEM] Server is disconnecting you: ${message.message}\n`);
});

// Handle reconnection attempts
client.on('reconnecting', ({ attempt }) => {
  console.log(`\n[INFO] Attempting to reconnect (${attempt})...\n`);
});

// Handle reconnection failure
client.on('reconnectFailed', () => {
  console.log('\n[ERROR] Failed to reconnect after maximum attempts\n');
  console.log('Please restart the client to try again.\n');
  rl.close();
  process.exit(1);
});

// Handle errors
client.on('error', (error) => {
  console.error(`\n[ERROR] ${error.message}\n`);
});

// Handle user input
rl.on('line', (line) => {
  const input = line.trim();
  
  if (!input) {
    rl.prompt();
    return;
  }
  
  // Check for exit commands
  if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
    console.log('\nDisconnecting...\n');
    client.disconnect('User requested disconnect');
    rl.close();
    process.exit(0);
  }
  
  // Check for special commands
  if (input === '/ping') {
    console.log('\nSending ping...\n');
    client.ping();
    rl.prompt();
    return;
  }
  
  if (input === '/status') {
    console.log(`\nConnection Status: ${client.getConnectionStatus() ? 'Connected' : 'Disconnected'}`);
    console.log(`Client ID: ${client.getClientId() || 'Not assigned'}\n`);
    rl.prompt();
    return;
  }
  
  if (input === '/help') {
    console.log('\nAvailable local commands:');
    console.log('  /ping    - Send a ping to the server');
    console.log('  /status  - Show connection status');
    console.log('  /help    - Show this help message');
    console.log('  exit     - Disconnect and exit');
    console.log('\nServer commands:');
    console.log('  help      - Show server help');
    console.log('  status    - Show your server status');
    console.log('  time      - Get server time');
    console.log('  stats     - Show session statistics');
    console.log('  broadcast <message> - Broadcast to all clients\n');
    rl.prompt();
    return;
  }
  
  // Send the message to the server
  if (client.sendMessage(input)) {
    // Message sent successfully
  } else {
    console.log('\n[ERROR] Failed to send message. Not connected to server.\n');
  }
  
  rl.prompt();
});

// Handle readline close
rl.on('close', () => {
  console.log('\nGoodbye!\n');
  client.disconnect('Client closing');
  process.exit(0);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nReceived SIGINT. Shutting down gracefully...\n');
  client.disconnect('SIGINT');
  rl.close();
  process.exit(0);
});

// Connect to server
async function main() {
  console.log('=== WebSocket Chat Client ===');
  console.log('Connecting to server...\n');
  
  try {
    await client.connect();
  } catch (error) {
    console.error('Failed to connect to server:', error.message);
    console.error('\nMake sure the server is running on ws://localhost:8080\n');
    process.exit(1);
  }
}

// Run the client
main();
