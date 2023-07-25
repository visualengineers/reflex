import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { setPoint } from '../actions/touchpoint-action'

// component for rendering point
class TouchPoint extends Component {
    constructor(props) {
        super(props);

        // initial state: touch point with default values
        this.state = {
            updatedPoint : {
                id: props.id,
                posX: props.posX,
                posY: props.posY,
                posZ: props.posZ
            }
        };
        
        console.log(this.state);
    }

    render() {
        return (
            <div className="touchpoints__item" style = {
                {
                  transform: `translate(${this.props.posX}px, ${this.props.posY}px)`
                }
              } > 
            </div>
        )
    }
}

// map stet to props (according to react/redux, state should never be manipulated directly)
const mapStateToProps = (state) => {
    console.log(state);
    return {
      id: state.touchReducer.updatedPoint.id,
      posX: state.touchReducer.updatedPoint.posX,
      posY: state.touchReducer.updatedPoint.posY,
      posZ: state.touchReducer.updatedPoint.posZ
    };
 };

 // handle dispatch messages
 const mapDispatchToProps = (dispatch) => {
   return {
     update: (id, x, y, z) => {
       dispatch(setPoint(id, x, y, z));
     }
   };
 };

 // just for type safety
TouchPoint.propTypes = {
    id: PropTypes.number.isRequired,
    posX: PropTypes.number.isRequired,
    posY: PropTypes.number.isRequired,
    posZ: PropTypes.number.isRequired
}

// connect mapping methods to modify state
export default connect(mapStateToProps, mapDispatchToProps)(TouchPoint)