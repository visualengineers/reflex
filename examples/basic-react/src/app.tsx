import { Component, ReactNode } from 'react';
import { AppProps } from './types/app-props';
import { TouchPoint } from './components/TouchPoint';
import { TouchPointState } from './types/touch-point-state';
import { Interaction } from '@reflex/shared-types';
import { Status } from './components/Status';
import { History } from './components/History';

export class ReFlexApp extends Component<AppProps, TouchPointState> {
  private readonly ws: WebSocket;

  constructor(props: AppProps) {
    super(props);
    this.state = {
      points: [],
      frameNumber: 0,
      webSocketAddress: props.wsAddress,
      isConnected: false,
    };

    this.ws = new WebSocket(props.wsAddress);
  }

  componentDidMount(): void {
    this.update = this.update.bind(this);

    this.ws.onopen = () => {
      console.log("Successfully connected to " + this.props.wsAddress);

      this.update([], true);
    };

    this.ws.onmessage = (evt) => {
      // convert json from PascalCase to camelCase
      const convertToLowerCase = evt.data.replace(
        /"([^"]+)":/g,
        (_$0: string, $1: string) => {
          return '"' + $1.charAt(0).toLowerCase() + $1.slice(1) + '":';
        }
      );

      // parse data
      const points: Interaction[] = JSON.parse(
        convertToLowerCase
      ) as Interaction[];

      if (!points || points.length < 0) {
        return;
      }

      points.forEach((p) => {
        p.position.x = p.position.x * this.props.width;
        p.position.y = p.position.y * this.props.height;
      });

      this.update(points, true);
    };

    this.ws.onclose = () => {
      // websocket is closed.
      console.warn("Connection is closed...");

      this.update([], false);
    };
  }

  render(): ReactNode {
    return (
      <div>
        <div className="status__panel">
          <Status
            webSocketAddress={this.state.webSocketAddress}
            points={this.state.points}
            isConnected={this.state.isConnected}
            frameNumber={this.state.frameNumber}
          />
        </div>
        <div className="touchpoints__panel">
          {this.state.points.map((p) => (
            <TouchPoint
              key={p.touchId}
              touchId={p.touchId}
              position={p.position}
              confidence={p.confidence}
              type={p.type}
              time={p.time}
              extremumDescription={p.extremumDescription}
            />
          ))}
        </div>
        <div className="message-container">
            <History
              frameId={this.state.frameNumber}
              interactions={this.state.points}
            />
      </div>
      </div>
    );
  }

  private update(points: Interaction[], isConnected: boolean): void {
    this.setState({
      points: points,
      frameNumber: this.state.frameNumber + 1,
      isConnected: isConnected,
      webSocketAddress: this.state.webSocketAddress,
    });
  }
}
