import React from 'react';
import g from 'glamorous';
import { Colors, Intent, Tag } from '@blueprintjs/core';
import marked from 'marked';

const Comment = g.div({
  padding: '8px',
  margin: '8px',
  border: `1px solid ${Colors.GRAY5}`,
  borderRadius: '3px',
  fontFamily: 'sans-serif',
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

function CommentThread({ comments }) {
  return (
    <div>
      {comments && comments.map((comment, i) =>
        <Comment first={i === 0} key={comment.id}>
          <CommentMeta>
            <CommentUser href={comment.user.html_url} target="_blank" rel="noopener noreferrer">{comment.user.login}</CommentUser>
            {comment.isPending && <Tag intent={Intent.WARNING}>Pending</Tag>}
          </CommentMeta>
          <CommentBody dangerouslySetInnerHTML={{__html: marked(comment.body, { gfm: true })}} />
        </Comment>
      )}
    </div>
  );
}

export default CommentThread;
