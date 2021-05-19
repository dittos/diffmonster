import React from 'react';
import { connect, DispatchProp } from 'react-redux';
import { Link } from 'react-router-dom';
import { AnchorButton, Button, Classes, Tag, Intent, Icon } from '@blueprintjs/core';
import { submitReview, approve } from '../stores/ReviewStore';
import Styles from './Header.module.css';
import { AppAction, PullRequestLoadedState, PullRequestReviewThreadDTO } from '../stores';
import { PullRequestReviewCommentState, PullRequestReviewEvent, PullRequestReviewState, PullRequestState } from '../__generated__/globalTypes';
import gql from 'graphql-tag';
import { HeaderPullRequestFragment } from './__generated__/HeaderPullRequestFragment';

const separator = <span className={Styles.Separator} />;

export const headerPullRequestFragment = gql`
  fragment HeaderPullRequestFragment on PullRequest {
    id
    number
    url
    title
    author {
      ... on User {
        databaseId
      }
      url
      login
    }
    state
    merged
    baseRefName
    baseRefOid
    baseRepository {
      nameWithOwner
      owner { login }
    }
    headRefName
    headRefOid
    headRepository {
      url
      owner { login }
    }
  }
`;

function countPendingComments(reviewThreads: PullRequestReviewThreadDTO[]) {
  let count = 0;
  for (let thread of reviewThreads) {
    if (!thread.comments?.nodes)
      continue;
    for (let comment of thread.comments.nodes) {
      if (comment?.state === PullRequestReviewCommentState.PENDING)
        count++;
    }
  }
  return count;
}

type OwnProps = {
  pullRequestFragment: HeaderPullRequestFragment;
};

class Header extends React.Component<PullRequestLoadedState & OwnProps & DispatchProp<AppAction>> {
  render() {
    const { pullRequestFragment: pullRequest, latestReview, reviewThreads, currentUser } = this.props;
    const latestReviewState = latestReview && latestReview.state;
    const canApprove = currentUser &&
      pullRequest.author?.__typename === 'User' && pullRequest.author.databaseId !== currentUser.id &&
      latestReviewState !== PullRequestReviewState.PENDING &&
      latestReviewState !== PullRequestReviewState.APPROVED;
    const pendingCommentCount = countPendingComments(reviewThreads);

    const baseRepo = pullRequest.baseRepository?.owner.login;
    const baseRef = pullRequest.baseRefName;
    const headRepo = pullRequest.headRepository?.owner.login;
    const headRef = pullRequest.headRefName;

    return <div className={Styles.Container}>
      <div className={Styles.Links}>
        {latestReviewState === PullRequestReviewState.PENDING && (
          <Button
            intent={Intent.PRIMARY}
            icon="upload"
            loading={this.props.isAddingReview}
            onClick={this._publishPendingComments}
          >
            Publish comments {pendingCommentCount > 0 && <Tag className={Classes.ROUND}>{pendingCommentCount}</Tag>}
          </Button>
        )}
        {latestReviewState === PullRequestReviewState.APPROVED &&
          <Button intent={Intent.SUCCESS} active={true} icon="tick">Approved</Button>}
        {canApprove && (
          <Button
            intent={Intent.SUCCESS}
            icon="tick"
            loading={this.props.isAddingReview}
            onClick={this._approve}
          >
            Approve
          </Button>
        )}
        {' '}
        <AnchorButton
          href={pullRequest.url}
          target="_blank"
          rightIcon="share"
          className={Classes.MINIMAL}
        >
          View on GitHub
        </AnchorButton>
      </div>
      <div className={Styles.Title}>
        <Link
          to={`/${pullRequest.baseRepository?.nameWithOwner}/pull/${pullRequest.number}`}
          className={`${Classes.BUTTON} ${Classes.MINIMAL}`}
        >
          <Icon icon="git-pull" />
          <span className="bp3-button-text">{pullRequest.title}</span>
        </Link>
      </div>
      <div className={Styles.Meta}>
        {pullRequest.baseRepository?.nameWithOwner}
        #{pullRequest.number}
        {separator}
        {pullRequest.state === PullRequestState.OPEN ? 'Open' :
          pullRequest.merged ? 'Merged' :
            'Closed'}
        {separator}
        by <a href={pullRequest.author?.url} target="_blank" rel="noopener noreferrer">{pullRequest.author?.login}</a>
        {separator}
        <span className={Styles.Branch}>{baseRepo === headRepo ? headRef : `${headRepo}:${headRef}`}</span>
        <span className={Styles.MergeInto}>&rarr;</span>
        <span className={Styles.Branch}>{baseRepo === headRepo ? baseRef : `${baseRepo}:${baseRef}`}</span>
      </div>
    </div>;
  }

  _publishPendingComments = () => {
    this.props.dispatch(submitReview({ event: PullRequestReviewEvent.COMMENT }));
  };

  _approve = () => {
    this.props.dispatch(approve());
  };
}

export default connect<PullRequestLoadedState, {}, {}, PullRequestLoadedState>(state => state)(Header);
