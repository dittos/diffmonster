import React from 'react';
import { Link } from 'react-router-dom';
import { Tab, Tabs, NonIdealState } from '@blueprintjs/core';
import Loading from '../ui/Loading';
import { graphql } from '../lib/Github';
import { getUserInfo } from '../lib/GithubAuth';
import Styles from './Inbox.module.css';
import { Subscription } from 'rxjs';
import Nav from './Nav';

interface State {
  data: {
    reviewed: any;
    reviewRequested: any;
    created: any;
  } | null;
}

export default class Inbox extends React.Component {
  private subscription: Subscription | null = null;

  state: State = {
    data: null,
  };

  componentDidMount() {
    const user = getUserInfo()!;
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
      return <div className={Styles.Container}><Loading /></div>;

    return (
      <div className={Styles.Container}>
        <Tabs id="inboxTabs">
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
        </Tabs>
      </div>
    );
  }

  _renderTab({ id, title, result }: { id: string; title: string; result: any; }) {
    let panel;

    if (result.nodes.length === 0) {
      panel = <div className={Styles.Empty}><NonIdealState title="Hooray!" icon="tick" /></div>;
    } else {
      panel = (
        <div>
          {result.nodes.map((item: any) => {
            return (
              <div className={Styles.ResultItem} key={item.id}>
                <span className={Styles.Repo}>{item.repository.nameWithOwner}</span>
                <Link
                  to={item.resourcePath}
                  onClick={() => Nav.isInboxOpen.next(false)}
                >{item.title}</Link>
              </div>
            );
          })}
          {result.pageInfo.hasNextPage &&
            <div className={Styles.ResultFooter}>Truncated search result</div>}
        </div>
      );
    }

    return <Tab
      id={id}
      title={`${title} (${result.issueCount})`}
      panel={panel}
    />;
  }
}
