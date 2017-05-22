import React from 'react';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import { Colors, Tab2, Tabs2, NonIdealState } from '@blueprintjs/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/switchMap';
import Loading from '../ui/Loading';
import { searchIssues } from '../lib/Github';
import { getUserInfo } from '../lib/GithubAuth';

const Container = g.div({
  padding: '8px 16px',
});

const Empty = g.div({
  paddingTop: '32px',
});

const ResultList = g.div({
});

const ResultItem = g.div({
  color: 'inherit',
  paddingBottom: '16px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const Repo = g.span({
  marginRight: '8px',
  color: Colors.GRAY1,
});

const Title = g(Link, {
  forwardProps: ['to'],
  rootEl: 'a',
})({
});

function parsePullRequestHtmlUrl(htmlUrl) {
  // FIXME: this is so hacky
  const path = htmlUrl.replace('https://github.com/', '');
  const [ owner, repo, _, pullRequestId ] = path.split('/');
  return {
    owner,
    repo,
    pullRequestId,
  };
}

export default class Inbox extends React.Component {
  state = {
    data: null,
  };

  componentDidMount() {
    const user = getUserInfo();
    this.subscription = Observable.zip(
      searchIssues(`type:pr is:open reviewed-by:${user.login}`),
      searchIssues(`type:pr is:open review-requested:${user.login}`),
      searchIssues(`type:pr is:open author:${user.login}`),
      (reviewed, reviewRequested, created) =>
        ({ reviewed, reviewRequested, created })
    )
      .subscribe(data => this.setState({ data }), err => console.error(err));
  }

  componentWillUnmount() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }

  render() {
    const { data } = this.state;

    if (!data)
      return <Container><Loading /></Container>;

    return (
      <Container>
        <Tabs2 id="inboxTabs">
          {this._renderTab({
            id: 'reviewRequested',
            title: 'Review Requested',
            result: data.reviewRequested,
          })}
          {this._renderTab({
            id: 'reviewed',
            title: 'Reviewed',
            result: data.reviewed,
          })}
          {this._renderTab({
            id: 'created',
            title: 'Created',
            result: data.created,
          })}
        </Tabs2>
      </Container>
    );
  }

  _renderTab({ id, title, result }) {
    let panel;

    if (result.items.length === 0) {
      panel = <Empty><NonIdealState title="Hooray!" visual="tick" /></Empty>;
    } else {
      panel = (
        <ResultList>
          {result.items.map(item => {
            const { owner, repo, pullRequestId } = parsePullRequestHtmlUrl(item.html_url);
            return (
              <ResultItem key={item.id}>
                <Repo>{owner}/{repo}</Repo>
                <Title
                  to={`/${owner}/${repo}/pull/${pullRequestId}`}
                  className="pt-popover-dismiss"
                >{item.title}</Title>
              </ResultItem>
            );
          })}
        </ResultList>
      );
    }

    return <Tab2
      id={id}
      title={`${title} (${result.items.length}${result.incomplete_results ? '+' : ''})`}
      panel={panel}
    />;
  }
}
