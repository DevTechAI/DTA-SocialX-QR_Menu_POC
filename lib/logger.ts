/**
 * Logger utility with log levels
 * 
 * Log levels (from most verbose to least):
 * - debug: Detailed debugging information (development only)
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Detailed debug info');
 *   logger.info('General info');
 *   logger.warn('Warning message');
 *   logger.error('Error message');
 * 
 * Environment variable:
 *   LOG_LEVEL=debug|info|warn|error (default: info in production, debug in development)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private currentLevel: LogLevel;

  constructor() {
    // Determine log level from environment
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    
    if (envLogLevel && LOG_LEVELS.hasOwnProperty(envLogLevel)) {
      this.currentLevel = envLogLevel;
    } else {
      // Default: debug in development, info in production
      this.currentLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    // Use appropriate console method
    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.formatMessage('error', message, ...args);
  }

  // Helper for formatted sections (like the current ═══ style)
  section(title: string, level: LogLevel = 'info'): void {
    if (!this.shouldLog(level)) return;
    
    const separator = '═'.repeat(55);
    this.formatMessage(level, separator);
    this.formatMessage(level, title);
    this.formatMessage(level, separator);
  }

  // Get current log level (useful for debugging)
  getLevel(): LogLevel {
    return this.currentLevel;
  }
}

export const logger = new Logger();

