/**
 * ChatServer.js
 * 
 * Core WebSocket server implementation for system-to-user chat.
 * Handles client connections, message routing, and system messages.
 * 
 * @module ChatServer
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

/**
 * ChatServer class manages WebSocket connections and facilitates
 * system-to-user communication.
 * 
 * @class
 * @extends EventEmitter
 */
class ChatServer extends EventEmitter {
  /**
   * Creates a new ChatServer instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} options.port - Port number for the WebSocket server
   * @param {number} [options.heartbeatInterval=30000] - Interval for ping/pong heartbeat
   * @param {number} [options.maxMessageSize=1048576] - Maximum message size in bytes (default 1MB)
   * @param {boolean} [options.enableLogging=true] - Enable server logging
   */
  constructor(options = {}) {
    super();
    
    this.port = options.port || 8080;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.maxMessageSize = options.maxMessageSize || 1048576; // 1MB default
    this.enableLogging = options.enableLogging !== false;
    
    this.wss = null;
    this.clients = new Map(); // Map of clientId -> client info
    this.heartbeatTimer = null;
  }

  /**
   * Starts the WebSocket server
   * 
   * @returns {Promise<void>}
   * @throws {Error} If server fails to start
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocket.Server({ 
          port: this.port,
          maxPayload: this.maxMessageSize
        });

        this.wss.on('connection', (ws, req) => this._handleConnection(ws, req));
        
        this.wss.on('error', (error) => {
          this._log('error', `WebSocket server error: ${error.message}`);
          this.emit('error', error);
        });

        this.wss.on('listening', () => {
          this._log('info', `WebSocket server started on port ${this.port}`);
          this._startHeartbeat();
          this.emit('started', { port: this.port });
          resolve();
        });

      } catch (error) {
        this._log('error', `Failed to start server: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Stops the WebSocket server gracefully
   * 
   * @returns {Promise<void>}
   */
  stop() {
    return new Promise((resolve, reject) => {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }

      if (!this.wss) {
        resolve();
        return;
      }

      // Close all client connections
      this.clients.forEach((clientInfo, clientId) => {
        this._disconnectClient(clientId, 'Server shutting down');
      });

      this.wss.close((error) => {
        if (error) {
          this._log('error', `Error stopping server: ${error.message}`);
          reject(error);
        } else {
          this._log('info', 'WebSocket server stopped');
          this.emit('stopped');
          resolve();
        }
      });
    });
  }

  /**
   * Handles new client connections
   * 
   * @private
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} req - HTTP request object
   */
  _handleConnection(ws, req) {
    const clientId = uuidv4();
    const clientIp = req.socket.remoteAddress;
    
    const clientInfo = {
      id: clientId,
      ws: ws,
      ip: clientIp,
      connectedAt: new Date(),
      isAlive: true,
      metadata: {}
    };

    this.clients.set(clientId, clientInfo);
    
    this._log('info', `Client connected: ${clientId} from ${clientIp}`);
    
    // Send welcome message
    this._sendToClient(clientId, {
      type: 'system',
      subtype: 'welcome',
      message: 'Welcome to the chat system',
      clientId: clientId,
      timestamp: new Date().toISOString()
    });

    // Setup event handlers for this client
    ws.on('message', (data) => this._handleMessage(clientId, data));
    
    ws.on('close', (code, reason) => {
      this._log('info', `Client disconnected: ${clientId} (code: ${code}, reason: ${reason})`);
      this.clients.delete(clientId);
      this.emit('clientDisconnected', { clientId, code, reason });
    });

    ws.on('error', (error) => {
      this._log('error', `Client error (${clientId}): ${error.message}`);
      this.emit('clientError', { clientId, error });
    });

    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
      }
    });

    this.emit('clientConnected', { clientId, clientIp });
  }

  /**
   * Handles incoming messages from clients
   * 
   * @private
   * @param {string} clientId - Client identifier
   * @param {Buffer|string} data - Message data
   */
  _handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      
      this._log('debug', `Message from ${clientId}: ${JSON.stringify(message)}`);
      
      // Add metadata to message
      message.clientId = clientId;
      message.receivedAt = new Date().toISOString();
      
      // Emit message event for application to handle
      this.emit('message', message);
      
      // Handle specific message types
      if (message.type === 'ping') {
        this._sendToClient(clientId, {
          type: 'pong',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      this._log('error', `Error parsing message from ${clientId}: ${error.message}`);
      this._sendToClient(clientId, {
        type: 'error',
        message: 'Invalid message format',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Sends a message to a specific client
   * 
   * @param {string} clientId - Client identifier
   * @param {Object} message - Message object to send
   * @returns {boolean} Success status
   */
  sendToClient(clientId, message) {
    return this._sendToClient(clientId, message);
  }

  /**
   * Internal method to send message to client
   * 
   * @private
   * @param {string} clientId - Client identifier
   * @param {Object} message - Message object to send
   * @returns {boolean} Success status
   */
  _sendToClient(clientId, message) {
    const clientInfo = this.clients.get(clientId);
    
    if (!clientInfo || clientInfo.ws.readyState !== WebSocket.OPEN) {
      this._log('warn', `Cannot send message to ${clientId}: client not connected`);
      return false;
    }

    try {
      const payload = JSON.stringify(message);
      clientInfo.ws.send(payload);
      this._log('debug', `Sent message to ${clientId}: ${payload}`);
      return true;
    } catch (error) {
      this._log('error', `Error sending message to ${clientId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Broadcasts a message to all connected clients
   * 
   * @param {Object} message - Message object to broadcast
   * @param {Array<string>} [excludeClients=[]] - Client IDs to exclude from broadcast
   * @returns {number} Number of clients message was sent to
   */
  broadcast(message, excludeClients = []) {
    let sentCount = 0;
    
    this.clients.forEach((clientInfo, clientId) => {
      if (!excludeClients.includes(clientId)) {
        if (this._sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    });
    
    this._log('debug', `Broadcasted message to ${sentCount} clients`);
    return sentCount;
  }

  /**
   * Sends a system message to a specific client
   * 
   * @param {string} clientId - Client identifier
   * @param {string} message - System message text
   * @param {string} [subtype='info'] - Message subtype (info, warning, error)
   * @returns {boolean} Success status
   */
  sendSystemMessage(clientId, message, subtype = 'info') {
    return this._sendToClient(clientId, {
      type: 'system',
      subtype: subtype,
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcasts a system message to all connected clients
   * 
   * @param {string} message - System message text
   * @param {string} [subtype='info'] - Message subtype (info, warning, error)
   * @returns {number} Number of clients message was sent to
   */
  broadcastSystemMessage(message, subtype = 'info') {
    return this.broadcast({
      type: 'system',
      subtype: subtype,
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Disconnects a specific client
   * 
   * @param {string} clientId - Client identifier
   * @param {string} [reason='Disconnected by server'] - Disconnect reason
   * @returns {boolean} Success status
   */
  disconnectClient(clientId, reason = 'Disconnected by server') {
    return this._disconnectClient(clientId, reason);
  }

  /**
   * Internal method to disconnect a client
   * 
   * @private
   * @param {string} clientId - Client identifier
   * @param {string} reason - Disconnect reason
   * @returns {boolean} Success status
   */
  _disconnectClient(clientId, reason) {
    const clientInfo = this.clients.get(clientId);
    
    if (!clientInfo) {
      return false;
    }

    try {
      // Send disconnect message
      this._sendToClient(clientId, {
        type: 'system',
        subtype: 'disconnect',
        message: reason,
        timestamp: new Date().toISOString()
      });
      
      // Close connection
      clientInfo.ws.close(1000, reason);
      this.clients.delete(clientId);
      
      this._log('info', `Disconnected client ${clientId}: ${reason}`);
      return true;
    } catch (error) {
      this._log('error', `Error disconnecting client ${clientId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Gets information about a specific client
   * 
   * @param {string} clientId - Client identifier
   * @returns {Object|null} Client information or null if not found
   */
  getClientInfo(clientId) {
    const clientInfo = this.clients.get(clientId);
    
    if (!clientInfo) {
      return null;
    }

    return {
      id: clientInfo.id,
      ip: clientInfo.ip,
      connectedAt: clientInfo.connectedAt,
      metadata: { ...clientInfo.metadata }
    };
  }

  /**
   * Gets list of all connected client IDs
   * 
   * @returns {Array<string>} Array of client IDs
   */
  getConnectedClients() {
    return Array.from(this.clients.keys());
  }

  /**
   * Gets the number of connected clients
   * 
   * @returns {number} Number of connected clients
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Updates metadata for a specific client
   * 
   * @param {string} clientId - Client identifier
   * @param {Object} metadata - Metadata to merge with existing metadata
   * @returns {boolean} Success status
   */
  updateClientMetadata(clientId, metadata) {
    const clientInfo = this.clients.get(clientId);
    
    if (!clientInfo) {
      return false;
    }

    clientInfo.metadata = { ...clientInfo.metadata, ...metadata };
    return true;
  }

  /**
   * Starts the heartbeat mechanism to detect dead connections
   * 
   * @private
   */
  _startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.clients.forEach((clientInfo, clientId) => {
        if (!clientInfo.isAlive) {
          this._log('info', `Client ${clientId} failed heartbeat, terminating`);
          clientInfo.ws.terminate();
          this.clients.delete(clientId);
          this.emit('clientTimeout', { clientId });
          return;
        }

        clientInfo.isAlive = false;
        clientInfo.ws.ping();
      });
    }, this.heartbeatInterval);
  }

  /**
   * Internal logging method
   * 
   * @private
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   */
  _log(level, message) {
    if (!this.enableLogging) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'debug':
        // Only log debug in non-production environments
        if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
          console.log(logMessage);
        }
        break;
      default:
        console.log(logMessage);
    }
  }
}

module.exports = ChatServer;
