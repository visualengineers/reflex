import { ProtocolVersion } from './protocol-version';
import { TransportProtocol } from './transport-protocol';
import { TuioInterpretation } from './tuio-interpretation';

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
