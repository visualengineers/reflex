import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from "react-redux";
import { combineReducers, createStore } from 'redux';
import TouchPoint from './components/TouchPoint';
import touchpointReducer from './reducers/touchpoint-reducer';

// create store with reducer for dispatching messages
const store = createStore(combineReducers({
  touchReducer: touchpointReducer
}));
const rootEl = document.getElementById('root')


// important: need provider to inject store into component
const render = () => ReactDOM.render(
  <div className="touchpoints__panel">
    <Provider store={store}>
      <TouchPoint/>    
    </Provider>
  </div>,
  rootEl
)


// connecting to websocket
var address = "ws://localhost:40001/ReFlex";
               
// Let us open a web socket
var ws = new WebSocket(address);

ws.onopen = function() {
  console.log("Successfully connected to " + address)
};

ws.onmessage = function (evt) { 

  // parse data
  var points = JSON.parse(evt.data);
  
  if (points.length <= 0) {
    return;
  }

  console.log(points[0]);

  // dispatch to touchpoint reducer
  store.dispatch({ 
    type: 'UPDATE', 
    payload: { 
      updatedPoint : {
        touchId: points[0].TouchId,
        posX: points[0].Position.X * 1920,
        posY: points[0].Position.Y * 1080,
        posZ: points[0].Position.Z
      }
    }   
  })
};

ws.onclose = function() { 
  
  // websocket is closed.
  console.warn("Connection is closed..."); 
};

render();
store.subscribe(render);
