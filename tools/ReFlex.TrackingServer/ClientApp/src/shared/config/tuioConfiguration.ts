import { ProtocolVersion } from './protocolVersion';
import { TransportProtocol } from './transportProtocol';
import { TuioInterpretation } from './tuioInterpretation';

export interface TuioConfiguration {
  sensorWidth: number;
  sensorHeight: number;
  sensorDescription: string;
  sessionId: number;
  serverAddress: string;
  serverPort: number;
  protocol: ProtocolVersion;
  transport: TransportProtocol;
  interpretation: TuioInterpretation;
}
