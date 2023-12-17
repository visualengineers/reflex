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

var frameNumber = 0;
               
// Let us open a web socket
var ws = new WebSocket(address);

ws.onopen = function() {
  console.log("Successfully connected to " + address);

  store.dispatch({ 
    type: 'UPDATE', 
    payload: { 
        points: [],
        frameNumber: frameNumber,
        webSocketAddress: address,
        isConnected: true
    }
  });
};

ws.onmessage = function (evt) { 

  // parse data
  var points = JSON.parse(evt.data);
  
  if (!points || points.length < 0) {
    return;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;

  frameNumber++;

  const convertedPoints = points.map((p) => {
    return {
      id: p.TouchId,
      posX: p.Position.X * w,
      posY: p.Position.Y * h,
      posZ: p.Position.Z
    }
  });

  // dispatch to touchpoint reducer
  store.dispatch({ 
    type: 'UPDATE', 
    payload: { 
        points: convertedPoints,
        frameNumber: frameNumber,
        webSocketAddress: address,
        isConnected: true
    }
  });
};

ws.onclose = function() { 
  
  // websocket is closed.
  console.warn("Connection is closed..."); 

  store.dispatch({ 
    type: 'UPDATE', 
    payload: { 
        points: [],
        frameNumber: frameNumber,
        webSocketAddress: address,
        isConnected: false
    }
  });
};

render();
store.subscribe(render);
