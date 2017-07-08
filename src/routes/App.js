import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Colors } from '@blueprintjs/core';
import g from 'glamorous';
import PullRequestRoute from './PullRequestRoute';
import IndexRoute from './IndexRoute';
import * as GithubAuth from '../lib/GithubAuth';
import { configureStore } from '../lib/Store';
import Loading from '../ui/Loading';
import Nav from '../ui/Nav';

const Viewport = g.div({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  display: 'flex',
  flexDirection: 'column',

  fontSize: '13px',
});

class App extends Component {
  store = configureStore();
  state = {
    isLoading: true
  };

  componentDidMount() {
    GithubAuth.initialize().then(() => {
      this.setState({ isLoading: false });
    });
  }

  render() {
    if (this.state.isLoading) {
      return (
        <Viewport>
          <g.Div flex="1" backgroundColor={Colors.DARK_GRAY3}>
            <Loading />
          </g.Div>
        </Viewport>
      );
    } else {
      return (
        <Provider store={this.store}>
          <Viewport>
            <Nav />
            <Route path="/:owner/:repo/pull/:number" component={PullRequestRoute} />
            <Route exact path="/" component={IndexRoute} />
          </Viewport>
        </Provider>
      );
    }
  }
}

export default App;
