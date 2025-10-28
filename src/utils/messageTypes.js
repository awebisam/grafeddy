/**
 * messageTypes.js
 * 
 * Defines message type constants and validation utilities
 * 
 * @module messageTypes
 */

/**
 * Message type constants
 * @enum {string}
 */
const MessageTypes = {
  // System messages
  SYSTEM: 'system',
  
  // User messages
  MESSAGE: 'message',
  
  // Connection management
  PING: 'ping',
  PONG: 'pong',
  
  // Error messages
  ERROR: 'error'
};

/**
 * System message subtype constants
 * @enum {string}
 */
const SystemSubtypes = {
  WELCOME: 'welcome',
  DISCONNECT: 'disconnect',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

/**
 * Validates a message object
 * 
 * @param {Object} message - Message to validate
 * @returns {boolean} True if valid
 */
function isValidMessage(message) {
  if (!message || typeof message !== 'object') {
    return false;
  }

  // Must have a type
  if (!message.type || typeof message.type !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validates a system message
 * 
 * @param {Object} message - Message to validate
 * @returns {boolean} True if valid
 */
function isValidSystemMessage(message) {
  if (!isValidMessage(message)) {
    return false;
  }

  if (message.type !== MessageTypes.SYSTEM) {
    return false;
  }

  // System messages should have subtype and message
  if (!message.subtype || !message.message) {
    return false;
  }

  return true;
}

/**
 * Creates a system message object
 * 
 * @param {string} subtype - System message subtype
 * @param {string} message - Message text
 * @param {Object} [additionalData={}] - Additional data to include
 * @returns {Object} System message object
 */
function createSystemMessage(subtype, message, additionalData = {}) {
  return {
    type: MessageTypes.SYSTEM,
    subtype: subtype,
    message: message,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
}

/**
 * Creates a user message object
 * 
 * @param {string} text - Message text
 * @param {Object} [additionalData={}] - Additional data to include
 * @returns {Object} User message object
 */
function createUserMessage(text, additionalData = {}) {
  return {
    type: MessageTypes.MESSAGE,
    text: text,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
}

/**
 * Creates an error message object
 * 
 * @param {string} message - Error message
 * @param {Object} [additionalData={}] - Additional data to include
 * @returns {Object} Error message object
 */
function createErrorMessage(message, additionalData = {}) {
  return {
    type: MessageTypes.ERROR,
    message: message,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
}

module.exports = {
  MessageTypes,
  SystemSubtypes,
  isValidMessage,
  isValidSystemMessage,
  createSystemMessage,
  createUserMessage,
  createErrorMessage
};
