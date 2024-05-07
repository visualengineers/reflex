import { Component } from 'react'
import { Interaction } from '@reflex/shared-types';

// component for rendering point
export class TouchPoint extends Component<Interaction> {
  render() {
    return (
        <div key={this.props.touchId} className='touchPoint' style = {
            {
              transform: `translate(${this.props.position.x}px, ${this.props.position.y}px) scale(${Math.abs(this.props.position.z)}, ${Math.abs(this.props.position.z)})`
            }
          } >
          <div className={`touchPoint__outerCircle ${this.props.position.z < 0 ? ' push' : ' pull'}`}></div>
          <div className='touchPoint__innerCircle'>
            <p>{this.props.touchId}</p>
          </div>

        </div>
    )
  }
}
