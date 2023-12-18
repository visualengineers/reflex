
// just forward point properties
export default (state = { updatedState: { 
    frameNumber: 0,
    content: [] 
    }
  }, action) => {
        switch(action.type){
            case "HISTORY":
              state = { ...state, updatedState: action.payload };
              break;           
            default:
              break;
        }    
        return state;
    };