import * as firebase from 'firebase';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';
import App from './routes/App';
import './index.css';
import config from './config';
import { FocusStyleManager } from '@blueprintjs/core';

firebase.initializeApp(config.firebase);

FocusStyleManager.onlyShowFocusOnTabs();

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root')
);
