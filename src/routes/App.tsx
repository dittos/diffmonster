import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Colors } from '@blueprintjs/core';
import PullRequestRoute from './PullRequestRoute';
import IndexRoute from './IndexRoute';
import * as GithubAuth from '../lib/GithubAuth';
import { configureStore } from '../stores';
import Loading from '../ui/Loading';
import Nav from '../ui/Nav';
import Styles from './App.module.css';
import { ApolloProvider } from '@apollo/client';
import { apollo } from '../lib/Github';

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
        <div className={Styles.Viewport}>
          <div style={{ flex: 1, backgroundColor: Colors.DARK_GRAY3 }}>
            <Loading />
          </div>
        </div>
      );
    } else {
      return (
        <Provider store={this.store}>
          <ApolloProvider client={apollo}>
            <div className={Styles.Viewport}>
              <Nav />
              <Route path="/:owner/:repo/pull/:number" component={PullRequestRoute} />
              <Route exact path="/" component={IndexRoute} />
            </div>
          </ApolloProvider>
        </Provider>
      );
    }
  }
}

export default App;
