import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import 'rxjs/add/operator/first';
import './App.css';
import PullRequest from './PullRequest';
import Index from './Index';
import * as GithubAuth from '../lib/GithubAuth';
import Loading from '../ui/Loading';

class App extends Component {
  state = {
    isLoading: true
  };

  componentDidMount() {
    GithubAuth.initialize().subscribe(() => {
      this.setState({ isLoading: false });
    });
  }

  render() {
    if (this.state.isLoading) {
      return (
        <div className="App">
          <Loading />
        </div>
      );
    } else {
      return (
        <div className="App">
          <Route path="/:owner/:repo/pull/:id" component={PullRequest} />
          <Route exact path="/" component={Index} />
        </div>
      );
    }
  }
}

export default App;
