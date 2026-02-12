import ReactDOM from 'react-dom/client'
import { ReFlexApp } from './app';
import React from 'react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
        <ReFlexApp
          wsAddress='ws://localhost:40001/ReFlex'
          width={window.innerWidth}
          height={window.innerHeight}/>
  </React.StrictMode>
);
