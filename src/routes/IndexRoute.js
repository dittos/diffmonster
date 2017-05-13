import React from 'react';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import oc from 'open-color';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/switchMap';
import Loading from '../ui/Loading';
import * as GithubAuth from '../lib/GithubAuth';
import { getAuthenticatedUser, searchIssues } from '../lib/Github';

const Container = g.div({
  maxWidth: '50em',
  margin: '0 auto',
  padding: '16px',
  color: oc.gray[7],
});

const PageTitle = g.div({
  fontSize: '32px',
  marginBottom: '32px',
});

const SectionTitle = g.div({
  fontSize: '16px',
  fontWeight: 'bold',
});

const ResultList = g.div({
  padding: '8px 0',
  marginBottom: '16px',
});

const ResultItem = g(Link, {
  forwardProps: ['to'],
  rootEl: 'a',
})({
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
  padding: '8px 0',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const Repo = g.span({
  borderRight: `1px solid ${oc.gray[3]}`,
  paddingRight: '8px',
  marginRight: '8px',
  color: oc.gray[6],
});

const Title = g.span({
  fontWeight: 'bold',
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

export default class IndexRoute extends React.Component {
  state = {
    isGuest: !GithubAuth.getAccessToken(),
  };

  componentDidMount() {
    if (!this.state.isGuest) {
      this.subscription = getAuthenticatedUser()
        .switchMap(user => Observable.zip(
          searchIssues(`type:pr is:open reviewed-by:${user.login}`),
          searchIssues(`type:pr is:open review-requested:${user.login}`),
          (reviewing, toReview) => ({ reviewing, toReview })
        ))
        .subscribe(data => this.setState({ data }), err => console.error(err));
    }
  }

  componentWillUnmount() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }

  render() {
    if (this.state.isGuest)
      return (
        <div>
          TODO: usage
        </div>
      );
    
    const { data } = this.state;

    if (!data)
      return <Loading />;

    return (
      <Container>
        <PageTitle>Review Requests</PageTitle>

        <SectionTitle>To Review</SectionTitle>
        {this._renderResult(data.toReview)}

        <SectionTitle>Reviewing</SectionTitle>
        {this._renderResult(data.reviewing)}
      </Container>
    );
  }

  _renderResult(result) {
    return (
      <ResultList>
        {result.items.map(item => {
          const { owner, repo, pullRequestId } = parsePullRequestHtmlUrl(item.html_url);
          return (
            <ResultItem key={item.id} to={`/${owner}/${repo}/pull/${pullRequestId}`}>
              <Repo>{owner}/{repo}</Repo>
              <Title>{item.title}</Title>
            </ResultItem>
          );
        })}
      </ResultList>
    );
  }
}
