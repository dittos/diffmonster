import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import { AnchorButton, Button, Classes, Colors, Tag, Intent } from '@blueprintjs/core';
import { PullRequestReviewState } from '../lib/Github';
import { submitReview, addReview } from '../stores/ReviewStore';

const Meta = g.div({
  padding: '8px',
});

const Separator = g.span({
  marginLeft: '16px',
});

const Branch = g.span({
  padding: '2px 5px',
  borderRadius: '3px',
  border: `1px solid ${Colors.GRAY5}`,
});

const MergeInto = g.span({
  padding: '0 4px',
});

const Links = g.div({
  float: 'right',
});

const separator = <Separator />;

const Title = g.div({
  display: 'flex',
  fontWeight: 'bold',
});

class Header extends React.Component {
  render() {
    const { pullRequest, latestReview, pendingComments, currentUser } = this.props;
    const latestReviewState = latestReview && latestReview.state;
    const canApprove = currentUser &&
      pullRequest.user.id !== currentUser.id &&
      latestReviewState !== PullRequestReviewState.PENDING &&
      latestReviewState !== PullRequestReviewState.APPROVED;
    const pendingCommentCount = pendingComments.length;

    return <g.Div padding="8px">
      <Links>
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
      </Links>
      <Title>
        <Link
          to={`/${pullRequest.base.repo.full_name}/pull/${pullRequest.number}`}
          className={`${Classes.BUTTON} ${Classes.MINIMAL} pt-icon-git-pull`}
        >
          {pullRequest.title}
        </Link>
      </Title>
      <Meta>
        {pullRequest.base.repo.full_name}
        #{pullRequest.number}
        {separator}
        {pullRequest.state === 'open' ? 'Open' :
          pullRequest.merged ? 'Merged' :
            'Closed'}
        {separator}
        by <a href={pullRequest.user.html_url} target="_blank" rel="noopener noreferrer">{pullRequest.user.login}</a>
        {separator}
        <Branch>{pullRequest.head.label}</Branch>
        <MergeInto>&rarr;</MergeInto>
        <Branch>{pullRequest.base.label}</Branch>
      </Meta>
    </g.Div>;
  }

  _publishPendingComments = () => {
    this.props.dispatch(submitReview({ event: 'COMMENT' }));
  };

  _approve = () => {
    this.props.dispatch(addReview({ event: 'APPROVE' }));
  };
}

export default connect(state => state)(Header);
