import { Injectable } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

/**
 * Centralized logging service for the application
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private logLevel: LogLevel = LogLevel.INFO;
  private readonly logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  /**
   * Log debug message
   */
  debug(message: string, data?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, source?: string): void {
    this.log(LogLevel.ERROR, message, error, source);
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.length = 0;
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source
    };

    // Add to internal log storage
    this.logs.push(logEntry);

    // Maintain max log limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    this.outputToConsole(logEntry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const source = entry.source ? `[${entry.source}]` : '';
    const logMessage = `${timestamp} ${source} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, entry.data);
        break;
    }
  }
}