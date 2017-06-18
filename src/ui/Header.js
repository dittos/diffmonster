import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import { AnchorButton, Classes, Colors } from '@blueprintjs/core';

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

function Header({ pullRequest }) {
  return <g.Div padding="8px">
    <Links>
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
      by <a href={pullRequest.user.html_url} target="_blank">{pullRequest.user.login}</a>
      {separator}
      <Branch>{pullRequest.head.label}</Branch>
      <MergeInto>&rarr;</MergeInto>
      <Branch>{pullRequest.base.label}</Branch>
    </Meta>
  </g.Div>;
}

export default connect(state => state)(Header);
