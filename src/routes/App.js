import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import './App.css';
import PullRequest from './PullRequest';
import Index from './Index';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Route path="/:owner/:repo/pull/:id" component={PullRequest} />
        <Route exact path="/" component={Index} />
      </div>
    );
  }
}

export default App;
