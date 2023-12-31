import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

// component for rendering point
class TouchPoint extends Component {
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

            this.props.points.map((p) => 
            <div key={p.id} className='touchPoint' style = {
                {
                  transform: `translate(${p.posX}px, ${p.posY}px) scale(${Math.abs(p.posZ)}, ${Math.abs(p.posZ)})`
                }
              } > 
              <div className={`touchPoint__outerCircle ${p.posZ < 0 ? ' push' : ' pull'}`}></div>
              <div className='touchPoint__innerCircle'>
                <p>{p.id}</p>
              </div>
              
            </div>
        )) 
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
TouchPoint.propTypes = {
    points: PropTypes.array.isRequired,
    frameNumber: PropTypes.number.isRequired,
    webSocketAddress: PropTypes.string.isRequired,
    isConnected: PropTypes.bool.isRequired
}

// connect mapping methods to modify state
export default connect(mapStateToProps, mapDispatchToProps)(TouchPoint)