import React from 'react';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import { AnchorButton, Button, Classes, Colors, Tag, Intent } from '@blueprintjs/core';
import { connect } from 'react-redux';

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

function Header({
  pullRequest,
  latestReview,
  comments,
}) {
  const latestReviewState = latestReview && latestReview.state;
  let pendingCommentCount = 0;
  for (const comment of comments)
    if (comment.isPending)
      pendingCommentCount++;

  return <g.Div padding="8px">
    <Links>
      {latestReviewState === 'PENDING' ?
        <Button intent={Intent.PRIMARY} iconName="upload">
          Publish comments <Tag className={Classes.ROUND}>{pendingCommentCount}</Tag>
        </Button> :
        latestReviewState === 'APPROVED' ?
          <Button intent={Intent.SUCCESS} active={true} iconName="tick">Approved</Button> :
          <Button intent={Intent.SUCCESS} iconName="tick">Approve</Button>
      }
      <AnchorButton
        href={pullRequest.url}
        target="_blank"
        rightIconName="share"
        className={Classes.MINIMAL}
      >
        View on GitHub
      </AnchorButton>
    </Links>
    <Title>
      <Link
        to={`/${pullRequest.repository.nameWithOwner}/pull/${pullRequest.number}`}
        className={`${Classes.BUTTON} ${Classes.MINIMAL} pt-icon-git-pull`}
      >
        {pullRequest.title}
      </Link>
    </Title>
    <Meta>
      {pullRequest.repository.nameWithOwner}
      #{pullRequest.number}
      {separator}
      {pullRequest.state === 'OPEN' ? 'Open' :
        pullRequest.state === 'MERGED' ? 'Merged' :
          'Closed'}
      {separator}
      by <a href={pullRequest.author.url} target="_blank">{pullRequest.author.login}</a>
      {separator}
      <Branch>{pullRequest.headRepository.owner.login}:{pullRequest.headRefName}</Branch>
      <MergeInto>&rarr;</MergeInto>
      <Branch>{pullRequest.repository.owner.login}:{pullRequest.baseRefName}</Branch>
    </Meta>
  </g.Div>;
}

export default connect(state => state)(Header);
