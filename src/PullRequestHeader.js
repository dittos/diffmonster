import React from 'react';
import styled from 'styled-components';
import oc from 'open-color';

const Header = styled.div`
  padding: 16px;
  background: ${oc.gray[9]};
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const Meta = styled.div`
  padding-top: 16px;
  font-size: 12px;
  color: ${oc.gray[5]};
`;

const Separator = styled.span`
  margin-left: 16px;
`;

const Title = styled.div`
  font-size: 16px;
  color: ${oc.gray[0]};
`;

const Branch = styled.span`
  padding: 2px 4px;
  border-radius: 2px;
  background: ${oc.gray[8]};
`;

const MergeInto = styled.span`
  padding: 0 4px;
`;

const Links = styled.div`
  float: right;
  color: ${oc.gray[5]};
`;

const separator = <Separator />;

export default function PullRequestHeader({ pullRequest }) {
  return (
    <Header>
      <Links>
        <a href={pullRequest.html_url} target="_blank">View on GitHub</a>
      </Links>
      <Title>{pullRequest.title}</Title>
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
    </Header>
  );
}
