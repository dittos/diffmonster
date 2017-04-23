import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.css';
import PullRequest from './PullRequest';

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <Route path="/:owner/:repo/pull/:id" component={PullRequest} />
        </div>
      </Router>
    );
  }
}

export default App;
