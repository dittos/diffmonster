import React from 'react';
import { connect } from 'react-redux';
import PullRequest from '../ui/PullRequest';
import withQueryParams from '../lib/withQueryParams';
import { fetch, fetchCancel } from '../lib/store/PullRequestStore';

class PullRequestRoute extends React.Component {
  componentDidMount() {
    this._load(this.props.match.params);
  }

  componentWillReceiveProps(nextProps) {
    const params = this.props.match.params;
    const nextParams = nextProps.match.params;
    if (
      params.owner !== nextParams.owner ||
      params.repo !== nextParams.repo ||
      params.number !== nextParams.number
    ) {
      this._load(nextProps.match.params);
    }
  }

  render() {
    return (
      <PullRequest
        activePath={this.props.queryParams.path}
        onSelectFile={this._onSelectFile}
      />
    );
  }

  _load({ owner, repo, number }) {
    this.props.dispatch(fetchCancel());
    this.props.dispatch(fetch({
      owner,
      repo,
      number: Number(number),
    }));
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

export default withQueryParams(connect()(PullRequestRoute));
