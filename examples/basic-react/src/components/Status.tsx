import { Component } from 'react'
import { TouchPointState } from '../types/touch-point-state';

// component for rendering point
export class Status extends Component<TouchPointState> {
  constructor(props: TouchPointState) {
      super(props);
  }

  render() {
    return (
        <div className="status__stats">
        <div className="status__stats--header">
            <div className={`status__indicator ${this.props.isConnected ? ' connected' : ' disconnected'}`}></div>
            <p>Address</p>
        </div>
        <div className="status__stats--item">{this.props.webSocketAddress}</div>
        <div className="status__stats--header">FrameNumber</div>
        <div className="status__stats--item">{this.props.frameNumber}</div>
        <div className="status__stats--header">Touches</div>
        <div className="status__stats--item">{this.props.points.length}</div>
      </div>
    )
  }
}
