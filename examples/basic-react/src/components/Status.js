import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

// component for rendering point
class Status extends Component {
    constructor(props) {
        super(props);

        // initial state: touch point with default values
        this.state = {
            updatedPoint : {
                points: props.points,
                webSocketAddress: props.webSocketAddress,
                frameNumber: props.frameNumber,
                isConnected: props.isConnected
            }
        };
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

// map stet to props (according to react/redux, state should never be manipulated directly)
const mapStateToProps = (state) => {
    return {
      points: state.touchReducer.updatedState.points,
      frameNumber: state.touchReducer.updatedState.frameNumber,
      webSocketAddress: state.touchReducer.updatedState.webSocketAddress,
      isConnected: state.touchReducer.updatedState.isConnected
    };
 };

 // handle dispatch messages
 const mapDispatchToProps = (dispatch) => {
   return {
     update: (points, frameNumber, webSocketAddress, isConnected) => {
       dispatch(points, frameNumber, webSocketAddress, isConnected);
     }
   };
 };

 // just for type safety
Status.propTypes = {
    points: PropTypes.array.isRequired,
    frameNumber: PropTypes.number.isRequired,
    webSocketAddress: PropTypes.string.isRequired,
    isConnected: PropTypes.bool.isRequired
}

// connect mapping methods to modify state
export default connect(mapStateToProps, mapDispatchToProps)(Status)