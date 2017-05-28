import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PullRequest from '../ui/PullRequest';
import withQueryParams from '../lib/withQueryParams';
import createStore from '../lib/createStore';

class PullRequestRoute extends Component {
  store = createStore();

  componentDidMount() {
    this._load(this.props.match.params);
  }

  componentWillReceiveProps(nextProps) {
    const params = this.props.match.params;
    const nextParams = nextProps.match.params;
    if (
      params.owner !== nextParams.owner ||
      params.repo !== nextParams.repo ||
      params.id !== nextParams.id
    ) {
      this._load(nextProps.match.params);
    }
  }

  render() {
    return (
      <Provider store={this.store}>
        <PullRequest
          activePath={this.props.queryParams.path}
          onSelectFile={this._onSelectFile}
        />
      </Provider>
    );
  }

  _load(params) {
    this.store.dispatch({ type: 'FETCH', payload: params });
  }

  _reload() {
    this._load(this.props.match.params);
  }

  _onSelectFile = path => {
    this.props.history.push({
      ...this.props.location,
      search: path ? `?path=${encodeURIComponent(path)}` : '',
    });
  };
}

export default withQueryParams(PullRequestRoute);
