/**
 * ChatClient.js
 * 
 * WebSocket client implementation for connecting to the chat server.
 * Handles connection management, message sending/receiving, and reconnection logic.
 * 
 * @module ChatClient
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

/**
 * ChatClient class manages WebSocket connection to the chat server
 * 
 * @class
 * @extends EventEmitter
 */
class ChatClient extends EventEmitter {
  /**
   * Creates a new ChatClient instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.url - WebSocket server URL (e.g., 'ws://localhost:8080')
   * @param {boolean} [options.autoReconnect=true] - Enable automatic reconnection
   * @param {number} [options.reconnectInterval=5000] - Reconnection interval in ms
   * @param {number} [options.maxReconnectAttempts=5] - Maximum reconnection attempts (0 = unlimited)
   * @param {boolean} [options.enableLogging=true] - Enable client logging
   */
  constructor(options = {}) {
    super();
    
    if (!options.url) {
      throw new Error('WebSocket URL is required');
    }
    
    this.url = options.url;
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.enableLogging = options.enableLogging !== false;
    
    this.ws = null;
    this.clientId = null;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.isManualDisconnect = false;
  }

  /**
   * Connects to the WebSocket server
   * 
   * @returns {Promise<void>}
   * @throws {Error} If connection fails
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected || this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.isManualDisconnect = false;
      
      this._log('info', `Connecting to ${this.url}...`);

      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          this._log('info', 'Connected to server');
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data) => this._handleMessage(data));

        this.ws.on('close', (code, reason) => {
          this.isConnected = false;
          this.isConnecting = false;
          
          this._log('info', `Disconnected from server (code: ${code}, reason: ${reason})`);
          this.emit('disconnected', { code, reason });

          if (!this.isManualDisconnect && this.autoReconnect) {
            this._scheduleReconnect();
          }
        });

        this.ws.on('error', (error) => {
          this._log('error', `WebSocket error: ${error.message}`);
          this.emit('error', error);
          
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(error);
          }
        });

        this.ws.on('ping', () => {
          this._log('debug', 'Received ping from server');
        });

      } catch (error) {
        this.isConnecting = false;
        this._log('error', `Failed to connect: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server
   * 
   * @param {string} [reason='Client disconnect'] - Disconnect reason
   */
  disconnect(reason = 'Client disconnect') {
    this.isManualDisconnect = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws && this.isConnected) {
      this._log('info', `Disconnecting: ${reason}`);
      this.ws.close(1000, reason);
    }
    
    this.isConnected = false;
  }

  /**
   * Sends a message to the server
   * 
   * @param {Object} message - Message object to send
   * @returns {boolean} Success status
   */
  send(message) {
    if (!this.isConnected || !this.ws) {
      this._log('warn', 'Cannot send message: not connected');
      return false;
    }

    try {
      const payload = JSON.stringify(message);
      this.ws.send(payload);
      this._log('debug', `Sent message: ${payload}`);
      return true;
    } catch (error) {
      this._log('error', `Error sending message: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends a text message to the server
   * 
   * @param {string} text - Message text
   * @param {Object} [additionalData={}] - Additional data to include
   * @returns {boolean} Success status
   */
  sendMessage(text, additionalData = {}) {
    return this.send({
      type: 'message',
      text: text,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  /**
   * Sends a ping message to the server
   * 
   * @returns {boolean} Success status
   */
  ping() {
    return this.send({
      type: 'ping',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handles incoming messages from the server
   * 
   * @private
   * @param {Buffer|string} data - Message data
   */
  _handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      this._log('debug', `Received message: ${JSON.stringify(message)}`);
      
      // Handle system messages
      if (message.type === 'system') {
        this._handleSystemMessage(message);
      }
      
      // Emit message event
      this.emit('message', message);
      
    } catch (error) {
      this._log('error', `Error parsing message: ${error.message}`);
    }
  }

  /**
   * Handles system messages
   * 
   * @private
   * @param {Object} message - System message
   */
  _handleSystemMessage(message) {
    switch (message.subtype) {
      case 'welcome':
        this.clientId = message.clientId;
        this._log('info', `Received client ID: ${this.clientId}`);
        this.emit('welcome', message);
        break;
      
      case 'disconnect':
        this._log('info', `Server disconnect: ${message.message}`);
        this.emit('serverDisconnect', message);
        break;
      
      case 'info':
        this.emit('systemInfo', message);
        break;
      
      case 'warning':
        this.emit('systemWarning', message);
        break;
      
      case 'error':
        this.emit('systemError', message);
        break;
      
      default:
        this.emit('systemMessage', message);
    }
  }

  /**
   * Schedules a reconnection attempt
   * 
   * @private
   */
  _scheduleReconnect() {
    if (this.maxReconnectAttempts > 0 && 
        this.reconnectAttempts >= this.maxReconnectAttempts) {
      this._log('error', 'Max reconnection attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    
    this._log('info', `Reconnecting in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this._log('info', `Reconnection attempt ${this.reconnectAttempts}...`);
      this.emit('reconnecting', { attempt: this.reconnectAttempts });
      
      this.connect().catch(error => {
        this._log('error', `Reconnection failed: ${error.message}`);
      });
    }, this.reconnectInterval);
  }

  /**
   * Gets the current connection status
   * 
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }

  /**
   * Gets the client ID assigned by the server
   * 
   * @returns {string|null} Client ID or null if not connected
   */
  getClientId() {
    return this.clientId;
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
    const logMessage = `[${timestamp}] [CLIENT] [${level.toUpperCase()}] ${message}`;
    
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

module.exports = ChatClient;
