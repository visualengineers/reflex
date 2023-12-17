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
        
        console.log('state', this.state);
    }

    render() {
        return (

            this.props.points.map((p) => 
            <div key={p.id} className="touchpoints__item" style = {
                {
                  transform: `translate(${p.posX}px, ${p.posY}px) scale(${Math.abs(p.posZ)}, ${Math.abs(p.posZ)})`
                }
              } > 
              <p>{p.id}</p>
            </div>
        )) 
    }
}

// map stet to props (according to react/redux, state should never be manipulated directly)
const mapStateToProps = (state) => {
    console.log(state);
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
     update: (id, x, y, z) => {
       dispatch(id, x, y, z);
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