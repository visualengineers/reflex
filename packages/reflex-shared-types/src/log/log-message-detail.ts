import { LogLevel } from './log-level';

export interface LogMessageDetail {
  id: number;
  formattedMessage: string;
  level: LogLevel;
}
