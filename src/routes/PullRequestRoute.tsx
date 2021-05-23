import React from 'react';
import { connect, DispatchProp } from 'react-redux';
import PullRequest, { pullRequestFragment } from '../ui/PullRequest';
import withQueryParams from '../lib/withQueryParams';
import { fetch, fetchCancel } from '../stores/PullRequestStore';
import { RouteComponentProps } from 'react-router';
import { AppAction } from '../stores';
import { gql, useQuery } from '@apollo/client';
import { PullRequestRouteQuery, PullRequestRouteQueryVariables } from './__generated__/PullRequestRouteQuery';

interface Params {
  owner: string;
  repo: string;
  number: string;
}

interface QueryParams {
  path?: string;
}

type Props = RouteComponentProps<Params> & { queryParams: QueryParams } & DispatchProp<AppAction>;

export const query = gql`
  ${pullRequestFragment}
  query PullRequestRouteQuery($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        ...PullRequestFragment
      }
    }
  }
`;

function PullRequestLoader(props: Props & { onSelectFile(path: string): void; }) {
  const { owner, repo, number } = props.match.params;
  const result = useQuery<PullRequestRouteQuery, PullRequestRouteQueryVariables>(query, {
    variables: {
      owner,
      repo,
      number: Number(number),
    }
  })
  return (
    <PullRequest
      pullRequestFragment={result.data?.repository?.pullRequest ?? null}
      activePath={props.queryParams.path}
      onSelectFile={props.onSelectFile}
    />
  )
}

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
      <PullRequestLoader
        {...this.props}
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
