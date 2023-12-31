
// just forward point properties
export default (state = { updatedState: { 
          points: [],
          frameNumber: 0,
          webSocketAddress: "ws://",
          isConnected: false
        }
    },
    action) => {
        switch(action.type){
            case "UPDATE":
              state = { ...state, updatedState: action.payload };
              break;           
            default:
              break;
        }    
        return state;
    };