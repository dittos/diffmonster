import React from 'react';
import g from 'glamorous';
import { Colors, Button, Intent } from '@blueprintjs/core';
import marked from 'marked';

const Comment = g.div({
  padding: '8px',
  margin: '8px',
  border: `1px solid ${Colors.GRAY5}`,
  borderRadius: '3px',
  fontFamily: 'sans-serif',
});

const CommentComposer = g.div({
  margin: '8px',
  fontFamily: 'sans-serif',
});

const CommentComposerActions = g.div({
  marginTop: '8px',

  '& button': {
    marginRight: '8px',
  }
});

const CommentMeta = g.div({
  paddingBottom: '8px',
});

const CommentUser = g.a({
  fontWeight: 'bold',
});

export default function CommentThread({ comments, showComposer, onCloseComposer }) {
  return (
    <div>
      {comments && comments.map((comment, i) =>
        <Comment first={i === 0} key={comment.id}>
          <CommentMeta>
            <CommentUser>{comment.user.login}</CommentUser>
          </CommentMeta>
          <div dangerouslySetInnerHTML={{__html: marked(comment.body, { gfm: true })}} />
        </Comment>
      )}
      {showComposer && <CommentComposer key="composer">
        <textarea
          placeholder="Write comment..."
          className="pt-input pt-fill"
        />
        <CommentComposerActions>
          <Button text="Write" intent={Intent.PRIMARY} />
          <Button text="Cancel" onClick={onCloseComposer} />
        </CommentComposerActions>
      </CommentComposer>}
    </div>
  );
}
