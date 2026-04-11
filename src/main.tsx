import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app';
import { initializeSpeech } from './utils/speech-service';

initializeSpeech();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
