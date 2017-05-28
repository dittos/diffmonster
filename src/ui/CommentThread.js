import React from 'react';
import g from 'glamorous';
import { Colors, Button, Intent } from '@blueprintjs/core';
import marked from 'marked';
import { Subscription } from 'rxjs/Subscription';

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

export default class CommentThread extends React.Component {
  state = {
    commentBody: '',
    addingComment: false,
  };
  subscription = new Subscription();

  render() {
    const {
      comments,
      showComposer,
      onCloseComposer,
    } = this.props;
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
        {showComposer && <CommentComposer>
          <textarea
            placeholder="Leave a comment"
            className="pt-input pt-fill"
            value={this.state.commentBody}
            onChange={event => this.setState({ commentBody: event.target.value })}
            autoFocus
            disabled={this.state.addingComment}
          />
          <CommentComposerActions>
            <Button
              text="Add comment"
              intent={Intent.PRIMARY}
              onClick={this._addComment}
              loading={this.state.addingComment}
            />
            <Button
              text="Cancel"
              onClick={this._closeComposer}
              disabled={this.state.addingComment}
            />
          </CommentComposerActions>
        </CommentComposer>}
      </div>
    );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  _addComment = () => {
    this.setState({ addingComment: true });
    this.subscription.add(
      this.props.onAddComment({
        body: this.state.commentBody,
        position: this.props.position,
        path: this.props.file.filename,
      }).subscribe(() => {
        this.setState({ addingComment: false });
        this._closeComposer();
      })
    );
  };

  _closeComposer = () => {
    this.props.onCloseComposer();
    this.setState({ commentBody: '' });
  };
}
