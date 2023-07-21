import { LogLevel } from './logLevel';

export interface LogMessageDetail {
  id: number;
  formattedMessage: string;
  level: LogLevel;
}
