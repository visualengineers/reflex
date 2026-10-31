import { LogLevel, LogMessageDetail } from '@reflex/shared-types';

export const logService = {
  getLogs: vi.fn().mockName('fakeLogService.getLogs'),
  sendErrorLog: vi.fn().mockName('fakeLogService.sendErrorLog'),
  reset: vi.fn().mockName('fakeLogService.reset')
};

export const messages: Array<LogMessageDetail> = [
  { id: 0, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
  { id: 1, level: LogLevel.Debug, formattedMessage: 'Lorem ipsum' },
  { id: 2, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
  { id: 3, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
  { id: 4, level: LogLevel.Warn, formattedMessage: 'Lorem ipsum' },
  { id: 5, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' },
  { id: 6, level: LogLevel.Error, formattedMessage: 'Lorem ipsum' },
  { id: 7, level: LogLevel.Error, formattedMessage: 'Lorem ipsum' },
  { id: 8, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' },
  { id: 9, level: LogLevel.Error, formattedMessage: 'Lorem ipsum' },
  { id: 10, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' },
  { id: 11, level: LogLevel.Fatal, formattedMessage: 'Lorem ipsum' },
  { id: 12, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' },
  { id: 13, level: LogLevel.Error, formattedMessage: 'Lorem ipsum' },
  { id: 14, level: LogLevel.Trace, formattedMessage: 'Lorem ipsum' }
];

logService.reset.mockReturnValue(undefined);

logService.sendErrorLog.mockReturnValue(undefined);
