/**
 * index.js
 * 
 * Main entry point for the grafeddy WebSocket chat system
 * Exports all public APIs
 * 
 * @module grafeddy
 */

const ChatServer = require('./src/server/ChatServer');
const ChatClient = require('./src/client/ChatClient');
const messageTypes = require('./src/utils/messageTypes');
const { Logger, LogLevels } = require('./src/utils/logger');

module.exports = {
  // Server
  ChatServer,
  
  // Client
  ChatClient,
  
  // Utilities
  MessageTypes: messageTypes.MessageTypes,
  SystemSubtypes: messageTypes.SystemSubtypes,
  createSystemMessage: messageTypes.createSystemMessage,
  createUserMessage: messageTypes.createUserMessage,
  createErrorMessage: messageTypes.createErrorMessage,
  isValidMessage: messageTypes.isValidMessage,
  isValidSystemMessage: messageTypes.isValidSystemMessage,
  
  // Logger
  Logger,
  LogLevels
};
