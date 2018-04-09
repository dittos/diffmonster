import React from 'react';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import { Colors, Tab2, Tabs2, NonIdealState } from '@blueprintjs/core';
import Loading from '../ui/Loading';
import { graphql } from '../lib/Github';
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

const ResultFooter = g.div({
  color: Colors.GRAY3,
  paddingBottom: '16px',
  textAlign: 'center',
  fontStyle: 'italic',
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

export default class Inbox extends React.Component {
  state = {
    data: null,
  };

  componentDidMount() {
    const user = getUserInfo();
    this.subscription = graphql(`
      fragment frag on SearchResultItemConnection {
        nodes {
          ... on PullRequest {
            repository {
              nameWithOwner
            }
            number
            title
            resourcePath
          }
        }
        issueCount
        pageInfo {
          hasNextPage
        }
      }
      query($q1: String!, $q2: String!, $q3: String!) {
        reviewed: search(query: $q1, first: 100, type: ISSUE) { ...frag }
        reviewRequested: search(query: $q2, first: 100, type: ISSUE) { ...frag }
        created: search(query: $q3, first: 100, type: ISSUE) { ...frag }
      }
    `, {
      q1: `type:pr is:open reviewed-by:${user.login}`,
      q2: `type:pr is:open review-requested:${user.login}`,
      q3: `type:pr is:open author:${user.login}`,
    })
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

    if (result.nodes.length === 0) {
      panel = <Empty><NonIdealState title="Hooray!" visual="tick" /></Empty>;
    } else {
      panel = (
        <ResultList>
          {result.nodes.map(item => {
            return (
              <ResultItem key={item.id}>
                <Repo>{item.repository.nameWithOwner}</Repo>
                <Title
                  to={item.resourcePath}
                  className="pt-popover-dismiss"
                >{item.title}</Title>
              </ResultItem>
            );
          })}
          {result.pageInfo.hasNextPage &&
            <ResultFooter>Truncated search result</ResultFooter>}
        </ResultList>
      );
    }

    return <Tab2
      id={id}
      title={`${title} (${result.issueCount})`}
      panel={panel}
    />;
  }
}
