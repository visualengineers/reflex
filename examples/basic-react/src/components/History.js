import { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

// component for rendering point
class History extends Component {
  
    history = [];
      constructor(props) {
        super(props);

        // initial state: empty history
        this.state = {
             frameNumber: 0,
             content: []
        };
      }

    render() {

        if (this.history.indexOf((elem) => elem.frameNumber === this.props.frameNumber) < 0) {
          this.history.push(this.props);
        }

        if (this.history.length > 100) {
          this.history.splice(0,1);
        }
        
        return (         
            this.history.map((f) => 
            <div key={f.frameNumber} className="message__box">
              <p className="message__id">{f.frameNumber}</p>
              <div>
                [
                  { f.content.map((c, i) => 
                    <p key={`${f.frameNumber}_${i}`} className="message__tp">
                        { JSON.stringify(c) }
                    </p>
                    )
                  }
                ]
              </div>
            </div>
            )
        );

    }
}

// map stet to props (according to react/redux, state should never be manipulated directly)
const mapStateToProps = (state) => {
  return state.historyReducer.updatedState;
 };

 // handle dispatch messages
 const mapDispatchToProps = (dispatch) => {
   return {
     update: (frame) => {
       dispatch(frame);
     }
   };
 };

 // just for type safety
History.propTypes = {
    frameNumber: PropTypes.number.isRequired,
    content: PropTypes.array.isRequired
}

// connect mapping methods to modify state
export default connect(mapStateToProps, mapDispatchToProps)(History)