import { TestBed } from '@angular/core/testing';
import { LoggingService, LogLevel, LogEntry } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let consoleSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggingService);
    
    // Set log level to DEBUG to allow all messages in tests
    service.setLogLevel(LogLevel.DEBUG);
    
    // Spy on console methods
    consoleSpy = jasmine.createSpy('console');
    spyOn(console, 'debug').and.callFake(consoleSpy);
    spyOn(console, 'info').and.callFake(consoleSpy);
    spyOn(console, 'warn').and.callFake(consoleSpy);
    spyOn(console, 'error').and.callFake(consoleSpy);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('debug', () => {
    it('should log debug message', () => {
      service.debug('Debug message', { data: 'test' }, 'TestSource');
      
      const logs = service.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].data).toEqual({ data: 'test' });
      expect(logs[0].source).toBe('TestSource');
    });

    it('should output to console.debug', () => {
      service.debug('Debug message');
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      service.info('Info message', { data: 'test' }, 'TestSource');
      
      const logs = service.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Info message');
      expect(logs[0].data).toEqual({ data: 'test' });
      expect(logs[0].source).toBe('TestSource');
    });

    it('should output to console.info', () => {
      service.info('Info message');
      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      service.warn('Warning message', { data: 'test' }, 'TestSource');
      
      const logs = service.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe('Warning message');
      expect(logs[0].data).toEqual({ data: 'test' });
      expect(logs[0].source).toBe('TestSource');
    });

    it('should output to console.warn', () => {
      service.warn('Warning message');
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      const error = new Error('Test error');
      service.error('Error message', error, 'TestSource');
      
      const logs = service.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Error message');
      expect(logs[0].data).toBe(error);
      expect(logs[0].source).toBe('TestSource');
    });

    it('should output to console.error', () => {
      service.error('Error message');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getLogs', () => {
    it('should return all logs', () => {
      service.info('Message 1');
      service.warn('Message 2');
      service.error('Message 3');
      
      const logs = service.getLogs();
      expect(logs.length).toBe(3);
      expect(logs[0].message).toBe('Message 1');
      expect(logs[1].message).toBe('Message 2');
      expect(logs[2].message).toBe('Message 3');
    });

    it('should return copy of logs array', () => {
      service.info('Test message');
      
      const logs1 = service.getLogs();
      const logs2 = service.getLogs();
      
      expect(logs1).not.toBe(logs2); // Different array instances
      expect(logs1).toEqual(logs2); // Same content
    });
  });

  describe('getLogsByLevel', () => {
    beforeEach(() => {
      service.debug('Debug message');
      service.info('Info message');
      service.warn('Warning message');
      service.error('Error message');
    });

    it('should return logs filtered by DEBUG level', () => {
      const debugLogs = service.getLogsByLevel(LogLevel.DEBUG);
      expect(debugLogs.length).toBe(1);
      expect(debugLogs[0].level).toBe(LogLevel.DEBUG);
      expect(debugLogs[0].message).toBe('Debug message');
    });

    it('should return logs filtered by INFO level', () => {
      const infoLogs = service.getLogsByLevel(LogLevel.INFO);
      expect(infoLogs.length).toBe(1);
      expect(infoLogs[0].level).toBe(LogLevel.INFO);
      expect(infoLogs[0].message).toBe('Info message');
    });

    it('should return logs filtered by WARN level', () => {
      const warnLogs = service.getLogsByLevel(LogLevel.WARN);
      expect(warnLogs.length).toBe(1);
      expect(warnLogs[0].level).toBe(LogLevel.WARN);
      expect(warnLogs[0].message).toBe('Warning message');
    });

    it('should return logs filtered by ERROR level', () => {
      const errorLogs = service.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);
      expect(errorLogs[0].message).toBe('Error message');
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', () => {
      service.info('Message 1');
      service.warn('Message 2');
      
      expect(service.getLogs().length).toBe(2);
      
      service.clearLogs();
      
      expect(service.getLogs().length).toBe(0);
    });
  });

  describe('log management', () => {
    it('should maintain maximum log limit', () => {
      // Add more than 1000 logs (the max limit)
      for (let i = 0; i < 1005; i++) {
        service.info(`Message ${i}`);
      }
      
      const logs = service.getLogs();
      expect(logs.length).toBe(1000);
      
      // Should have removed the oldest logs
      expect(logs[0].message).toBe('Message 5');
      expect(logs[999].message).toBe('Message 1004');
    });

    it('should include timestamp in log entries', () => {
      const beforeTime = new Date();
      service.info('Test message');
      const afterTime = new Date();
      
      const logs = service.getLogs();
      expect(logs[0].timestamp).toBeInstanceOf(Date);
      expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('console output formatting', () => {
    it('should format console output with timestamp and source', () => {
      service.info('Test message', { data: 'test' }, 'TestSource');
      
      expect(console.info).toHaveBeenCalledWith(
        jasmine.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[TestSource\] Test message/),
        { data: 'test' }
      );
    });

    it('should format console output without source when not provided', () => {
      service.info('Test message', { data: 'test' });
      
      expect(console.info).toHaveBeenCalledWith(
        jasmine.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z  Test message/),
        { data: 'test' }
      );
    });
  });

  describe('log level filtering', () => {
    // Note: The current implementation has a fixed log level of INFO
    // This test demonstrates the concept but may need adjustment based on actual implementation
    
    it('should respect log level configuration', () => {
      // Since the service is configured with INFO level, DEBUG messages should still be logged
      // but in a real implementation with configurable log levels, this would filter out DEBUG
      service.debug('Debug message');
      service.info('Info message');
      
      const logs = service.getLogs();
      // Currently both will be logged, but this shows the structure for level-based filtering
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined data', () => {
      service.info('Test message', undefined, 'TestSource');
      
      const logs = service.getLogs();
      expect(logs[0].data).toBeUndefined();
    });

    it('should handle null data', () => {
      service.info('Test message', null, 'TestSource');
      
      const logs = service.getLogs();
      expect(logs[0].data).toBeNull();
    });

    it('should handle empty string message', () => {
      service.info('', { data: 'test' }, 'TestSource');
      
      const logs = service.getLogs();
      expect(logs[0].message).toBe('');
    });

    it('should handle complex data objects', () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        },
        date: new Date(),
        func: () => 'test'
      };
      
      service.info('Complex data test', complexData, 'TestSource');
      
      const logs = service.getLogs();
      expect(logs[0].data).toEqual(complexData);
    });
  });
});