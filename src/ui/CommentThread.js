import React from 'react';
import { connect } from 'react-redux';
import g from 'glamorous';
import { Colors, Button, Intent, Tag } from '@blueprintjs/core';
import marked from 'marked';
import { Subscription } from 'rxjs/Subscription';
import { addPullRequestComment, addPullRequestReviewComment } from '../lib/Github';

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
  marginRight: '8px',
});

class CommentThread extends React.Component {
  state = {
    commentBody: '',
    addingComment: false,
  };
  subscription = new Subscription();

  render() {
    const {
      comments,
      showComposer,
      latestReview,
    } = this.props;
    const hasPendingReview = latestReview && latestReview.state === 'PENDING';

    return (
      <div>
        {comments && comments.map((comment, i) =>
          <Comment first={i === 0} key={comment.id}>
            <CommentMeta>
              <CommentUser href={comment.author.url} target="_blank">{comment.author.login}</CommentUser>
              {comment.isPending && <Tag intent={Intent.WARNING}>Pending</Tag>}
            </CommentMeta>
            <div dangerouslySetInnerHTML={{__html: comment.bodyHTML}} />
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
              text="Cancel"
              onClick={this._closeComposer}
              disabled={this.state.addingComment}
            />
            {!hasPendingReview &&
              <Button
                text="Add single comment"
                onClick={this._addSingleComment}
                disabled={this.state.addingComment}
              />}
            <Button
              text={hasPendingReview ? 'Add review comment' : 'Start a review'}
              intent={Intent.PRIMARY}
              onClick={this._addReviewComment}
              loading={this.state.addingComment}
            />
          </CommentComposerActions>
        </CommentComposer>}
      </div>
    );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  _addSingleComment = () => {
    this.setState({ addingComment: true });

    const pullRequest = this.props.pullRequest;
    this.subscription.add(
      addPullRequestComment(pullRequest, {
        body: this.state.commentBody,
        position: this.props.position,
        path: this.props.file.filename,
        commit_id: pullRequest.headRef.target.oid,
      }).subscribe(comment => {
        this.props.dispatch({
          type: 'COMMENT_ADDED',
          payload: comment,
        });
        this.setState({ addingComment: false });
        this._closeComposer();
      })
    );
  };

  _addReviewComment = () => {
    this.setState({ addingComment: true });

    const { pullRequest, latestReview } = this.props;
    // TODO: create a review if no latestReview exists
    this.subscription.add(
      addPullRequestReviewComment(latestReview, {
        body: this.state.commentBody,
        position: this.props.position,
        path: this.props.file.filename,
        commit_id: pullRequest.headRef.target.oid,
      }).subscribe(comment => {
        comment.isPending = true;
        this.props.dispatch({
          type: 'COMMENT_ADDED',
          payload: comment,
        });
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

export default connect(state => ({
  pullRequest: state.pullRequest,
  latestReview: state.latestReview,
}))(CommentThread);
