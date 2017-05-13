import React from 'react';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import { Colors } from '@blueprintjs/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/switchMap';
import Loading from '../ui/Loading';
import { getAuthenticatedUser, searchIssues } from '../lib/Github';

const Container = g.div({
  padding: '16px',
});

const SectionTitle = g.div({
  fontWeight: 'bold',
});

const ResultList = g.div({
  padding: '8px 0',
  marginBottom: '16px',

  '&:last-child': {
    margin: 0,
    paddingBottom: 0,
  }
});

const ResultItem = g.div({
  color: 'inherit',
  padding: '8px 0',
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
    this.subscription = getAuthenticatedUser()
      .switchMap(user => Observable.zip(
        searchIssues(`type:pr is:open reviewed-by:${user.login}`),
        searchIssues(`type:pr is:open review-requested:${user.login}`),
        (reviewing, toReview) => ({ reviewing, toReview })
      ))
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
            <ResultItem key={item.id}>
              <Repo>{owner}/{repo}</Repo>
              <Title
                to={`/${owner}/${repo}/pull/${pullRequestId}`}
                onClick={this.props.onLinkClick}
              >{item.title}</Title>
            </ResultItem>
          );
        })}
      </ResultList>
    );
  }
}
