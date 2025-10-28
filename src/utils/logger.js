/**
 * logger.js
 * 
 * Logging utility for the chat system
 * 
 * @module logger
 */

/**
 * Log levels
 * @enum {string}
 */
const LogLevels = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Logger class for structured logging
 * 
 * @class
 */
class Logger {
  /**
   * Creates a new Logger instance
   * 
   * @param {Object} options - Logger options
   * @param {string} [options.name='App'] - Logger name
   * @param {string} [options.level='info'] - Minimum log level
   * @param {boolean} [options.enabled=true] - Enable logging
   */
  constructor(options = {}) {
    this.name = options.name || 'App';
    this.level = options.level || LogLevels.INFO;
    this.enabled = options.enabled !== false;
    
    this.levels = {
      [LogLevels.DEBUG]: 0,
      [LogLevels.INFO]: 1,
      [LogLevels.WARN]: 2,
      [LogLevels.ERROR]: 3
    };
  }

  /**
   * Checks if a log level should be logged
   * 
   * @private
   * @param {string} level - Log level to check
   * @returns {boolean} True if should log
   */
  _shouldLog(level) {
    if (!this.enabled) {
      return false;
    }
    
    return this.levels[level] >= this.levels[this.level];
  }

  /**
   * Formats a log message
   * 
   * @private
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [meta={}] - Additional metadata
   * @returns {string} Formatted log message
   */
  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  /**
   * Logs a debug message
   * 
   * @param {string} message - Log message
   * @param {Object} [meta={}] - Additional metadata
   */
  debug(message, meta = {}) {
    if (this._shouldLog(LogLevels.DEBUG)) {
      console.log(this._formatMessage(LogLevels.DEBUG, message, meta));
    }
  }

  /**
   * Logs an info message
   * 
   * @param {string} message - Log message
   * @param {Object} [meta={}] - Additional metadata
   */
  info(message, meta = {}) {
    if (this._shouldLog(LogLevels.INFO)) {
      console.log(this._formatMessage(LogLevels.INFO, message, meta));
    }
  }

  /**
   * Logs a warning message
   * 
   * @param {string} message - Log message
   * @param {Object} [meta={}] - Additional metadata
   */
  warn(message, meta = {}) {
    if (this._shouldLog(LogLevels.WARN)) {
      console.warn(this._formatMessage(LogLevels.WARN, message, meta));
    }
  }

  /**
   * Logs an error message
   * 
   * @param {string} message - Log message
   * @param {Error|Object} [meta={}] - Error object or additional metadata
   */
  error(message, meta = {}) {
    if (this._shouldLog(LogLevels.ERROR)) {
      const errorMeta = meta instanceof Error ? 
        { error: meta.message, stack: meta.stack } : meta;
      console.error(this._formatMessage(LogLevels.ERROR, message, errorMeta));
    }
  }
}

module.exports = { Logger, LogLevels };
