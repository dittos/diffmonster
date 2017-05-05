import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import 'rxjs/add/operator/first';
import g from 'glamorous';
import PullRequestRoute from './PullRequestRoute';
import Index from './Index';
import * as GithubAuth from '../lib/GithubAuth';
import Loading from '../ui/Loading';

const Viewport = g.div({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',

  fontSize: '13px',
});

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
        <Viewport>
          <Loading />
        </Viewport>
      );
    } else {
      return (
        <Viewport>
          <Route path="/:owner/:repo/pull/:id" component={PullRequestRoute} />
          <Route exact path="/" component={Index} />
        </Viewport>
      );
    }
  }
}

export default App;
