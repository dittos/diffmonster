import React from 'react';
import g from 'glamorous';
import marked from 'marked';

const PullRequestBody = g.div({
  maxWidth: '50em',
  margin: '16px auto',
  padding: '0 2em',
});

export default function Summary({ pullRequest }) {
  return (
    <PullRequestBody
      className="pt-running-text"
      dangerouslySetInnerHTML={{__html: marked(pullRequest.body, { gfm: true })}}
    />
  );
}
