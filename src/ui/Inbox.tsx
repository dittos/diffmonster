import React from 'react';
import { Link } from 'react-router-dom';
import { Tab, Tabs, NonIdealState } from '@blueprintjs/core';
import Loading from '../ui/Loading';
import { getUserInfo } from '../lib/GithubAuth';
import Styles from './Inbox.module.css';
import Nav from './Nav';
import { gql, useQuery } from '@apollo/client';
import { InboxSearch } from './__generated__/InboxSearch';

export default function Inbox() {
  const user = getUserInfo()!;
  const result = useQuery<InboxSearch>(gql`
    fragment InboxSearchResultItem on SearchResultItemConnection {
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
    query InboxSearch($q1: String!, $q2: String!, $q3: String!) {
      reviewed: search(query: $q1, first: 100, type: ISSUE) { ...InboxSearchResultItem }
      reviewRequested: search(query: $q2, first: 100, type: ISSUE) { ...InboxSearchResultItem }
      created: search(query: $q3, first: 100, type: ISSUE) { ...InboxSearchResultItem }
    }
  `, {
    variables: {
      q1: `type:pr is:open reviewed-by:${user.login}`,
      q2: `type:pr is:open review-requested:${user.login}`,
      q3: `type:pr is:open author:${user.login}`,
    },
    fetchPolicy: 'cache-and-network',
  });
  
  const { data } = result;

  if (!data)
    return <div className={Styles.Container}><Loading /></div>;

  return (
    <div className={Styles.Container}>
      <Tabs id="inboxTabs">
        {_renderTab({
          id: 'reviewRequested',
          title: 'Review Requested',
          result: data.reviewRequested,
        })}
        {_renderTab({
          id: 'reviewed',
          title: 'Reviewed',
          result: data.reviewed,
        })}
        {_renderTab({
          id: 'created',
          title: 'Created',
          result: data.created,
        })}
      </Tabs>
    </div>
  );
  
  function _renderTab({ id, title, result }: { id: string; title: string; result: any; }) {
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
