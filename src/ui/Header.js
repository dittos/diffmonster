import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { AnchorButton, Button, Classes, Tag, Intent } from '@blueprintjs/core';
import { PullRequestReviewState } from '../lib/Github';
import { submitReview, addReview } from '../stores/ReviewStore';
import Styles from './Header.module.css';

const separator = <span className={Styles.Separator} />;

class Header extends React.Component {
  render() {
    const { pullRequest, latestReview, pendingComments, currentUser } = this.props;
    const latestReviewState = latestReview && latestReview.state;
    const canApprove = currentUser &&
      pullRequest.user.id !== currentUser.id &&
      latestReviewState !== PullRequestReviewState.PENDING &&
      latestReviewState !== PullRequestReviewState.APPROVED;
    const pendingCommentCount = pendingComments.length;

    return <div className={Styles.Container}>
      <div className={Styles.Links}>
        {latestReviewState === PullRequestReviewState.PENDING && (
          <Button
            intent={Intent.PRIMARY}
            iconName="upload"
            loading={this.props.isAddingReview}
            onClick={this._publishPendingComments}
          >
            Publish comments {pendingCommentCount > 0 && <Tag className={Classes.ROUND}>{pendingCommentCount}</Tag>}
          </Button>
        )}
        {latestReviewState === PullRequestReviewState.APPROVED &&
          <Button intent={Intent.SUCCESS} active={true} iconName="tick">Approved</Button>}
        {canApprove && (
          <Button
            intent={Intent.SUCCESS}
            iconName="tick"
            loading={this.props.isAddingReview}
            onClick={this._approve}
          >
            Approve
          </Button>
        )}
        {' '}
        <AnchorButton
          href={pullRequest.html_url}
          target="_blank"
          rightIconName="share"
          className={Classes.MINIMAL}
        >
          View on GitHub
        </AnchorButton>
      </div>
      <div className={Styles.Title}>
        <Link
          to={`/${pullRequest.base.repo.full_name}/pull/${pullRequest.number}`}
          className={`${Classes.BUTTON} ${Classes.MINIMAL} pt-icon-git-pull`}
        >
          {pullRequest.title}
        </Link>
      </div>
      <div className={Styles.Meta}>
        {pullRequest.base.repo.full_name}
        #{pullRequest.number}
        {separator}
        {pullRequest.state === 'open' ? 'Open' :
          pullRequest.merged ? 'Merged' :
            'Closed'}
        {separator}
        by <a href={pullRequest.user.html_url} target="_blank" rel="noopener noreferrer">{pullRequest.user.login}</a>
        {separator}
        <span className={Styles.Branch}>{pullRequest.head.label}</span>
        <span className={Styles.MergeInto}>&rarr;</span>
        <span className={Styles.Branch}>{pullRequest.base.label}</span>
      </div>
    </div>;
  }

  _publishPendingComments = () => {
    this.props.dispatch(submitReview({ event: 'COMMENT' }));
  };

  _approve = () => {
    this.props.dispatch(addReview({ event: 'APPROVE' }));
  };
}

export default connect(state => state)(Header);
