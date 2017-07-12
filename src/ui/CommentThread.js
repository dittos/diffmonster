import React from 'react';
import g from 'glamorous';
import { Colors, Intent, Tag, Button, Classes } from '@blueprintjs/core';
import marked from 'marked';
import { getUserInfo } from '../lib/GithubAuth';

const actionsClassName = 'CommentThread-Actions';

const Comment = g.div({
  padding: '8px',
  margin: '8px',
  border: `1px solid ${Colors.GRAY5}`,
  borderRadius: '3px',
  fontFamily: 'sans-serif',

  [`& .${actionsClassName}`]: {
    visibility: 'hidden'
  },
  [`&:hover .${actionsClassName}`]: {
    visibility: 'visible'
  },
});

const CommentMeta = g.div({
  paddingBottom: '8px',
});

const CommentUser = g.a({
  fontWeight: 'bold',
  marginRight: '8px',
});

const CommentBody = g.div({
  fontSize: '13px',

  '& p:last-child': {
    marginBottom: 0
  }
});

const Actions = g.div({
  float: 'right',
  marginRight: '-4px',
  marginTop: '-4px',
});

function renderMarkdown(body) {
  const rendered = marked(body, { gfm: true, sanitize: true });
  return rendered.replace(/&lt;(\/?sub)&gt;/g, '<$1>'); // TODO: is it okay?
}

function CommentThread({ comments, isPending, deleteComment }) {
  const viewer = getUserInfo();
  return (
    <div>
      {comments.map((comment, i) =>
        <Comment key={comment.id}>
          <CommentMeta>
            <CommentUser href={comment.user.html_url} target="_blank" rel="noopener noreferrer">{comment.user.login}</CommentUser>
            {isPending && <Tag intent={Intent.WARNING}>Pending</Tag>}
            {viewer && viewer.login === comment.user.login && (
              <Actions className={actionsClassName}>
                {!isPending && (
                  // GitHub doesn't have an API for deleting pending comments
                  <Button
                    iconName="delete"
                    className={Classes.MINIMAL}
                    intent={Intent.DANGER}
                    onClick={() => deleteComment(comment.id)}
                  />
                )}
              </Actions>
            )}
          </CommentMeta>
          <CommentBody dangerouslySetInnerHTML={{__html: renderMarkdown(comment.body)}} />
        </Comment>
      )}
    </div>
  );
}

export default CommentThread;
