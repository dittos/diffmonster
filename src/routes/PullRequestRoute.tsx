import React from 'react';
import { connect, DispatchProp } from 'react-redux';
import PullRequest from '../ui/PullRequest';
import withQueryParams from '../lib/withQueryParams';
import { fetch, fetchCancel } from '../stores/PullRequestStore';
import { RouteComponentProps } from 'react-router';
import { AppAction } from '../stores';

interface Params {
  owner: string;
  repo: string;
  number: string;
}

interface QueryParams {
  path?: string;
}

type Props = RouteComponentProps<Params> & { queryParams: QueryParams } & DispatchProp<AppAction>;

class PullRequestRoute extends React.Component<Props> {
  componentDidMount() {
    this._load(this.props.match.params);
  }

  componentWillReceiveProps(nextProps: Props) {
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

  _load({ owner, repo, number }: { owner: string; repo: string; number: string; }) {
    this.props.dispatch(fetchCancel());
    this.props.dispatch(fetch({
      owner,
      repo,
      number: Number(number),
    }));
  }

  _onSelectFile = (path: string) => {
    this.props.history.push({
      ...this.props.location,
      search: path ? `?path=${encodeURIComponent(path)}` : '',
    });
  };
}

export default withQueryParams(connect()(PullRequestRoute));
