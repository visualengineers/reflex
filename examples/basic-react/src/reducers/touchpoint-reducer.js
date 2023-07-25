
// just forward point properties
export default (state = { updatedPoint : {
            id: 0,
            posX: 0,
            posY: 0,
            posZ: 0
        }
    },
    action) => {
        switch(action.type){
            case "UPDATE":
              state = { ...state, updatedPoint: action.payload.updatedPoint };
              console.log("Updated Points", state);
              break;           
            default:
              break;
        }    
        return state;
    };