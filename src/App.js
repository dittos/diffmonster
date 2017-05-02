import React, { Component } from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import './App.css';
import PullRequest from './PullRequest';
import Index from './Index';
import Loading from './Loading';

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <Route path="/:owner/:repo/pull/:id" component={PullRequest} />
          <Route exact path="/" component={Index} />
        </div>
      </Router>
    );
  }
}

export default App;
