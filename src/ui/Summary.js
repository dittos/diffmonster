import React from 'react';
import g from 'glamorous';
import styled from 'styled-components';
import oc from 'open-color';
import marked from 'marked';

const Meta = styled.div`
  padding: 0 16px;
  line-height: 48px;
  font-size: 12px;
  color: ${oc.gray[6]};
`;

const Separator = styled.span`
  margin-left: 16px;
`;

const Branch = styled.span`
  padding: 2px 4px;
  border-radius: 2px;
  border: 1px solid ${oc.gray[4]};
`;

const MergeInto = styled.span`
  padding: 0 4px;
`;

const Links = styled.div`
  float: right;
  padding: 0 16px;
  line-height: 48px;
  color: ${oc.gray[6]};
`;

const separator = <Separator />;

const PullRequestBody = g.div({
  maxWidth: '50em',
  margin: '0 auto',
  lineHeight: 1.8,
  fontSize: '14px',
  color: oc.gray[7],
});

export default function Summary({ pullRequest }) {
  return <div>
    <Links>
      <a href={pullRequest.html_url} target="_blank">View on GitHub</a>
    </Links>
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
    <PullRequestBody dangerouslySetInnerHTML={{__html: marked(pullRequest.body, { gfm: true })}} />
  </div>;
}
