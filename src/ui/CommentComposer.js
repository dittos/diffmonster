import React from 'react';
import { connect } from 'react-redux';
import g from 'glamorous';
import { Button, Intent } from '@blueprintjs/core';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/mergeMap';
import {
  addPullRequestReviewComment,
  addPendingPullRequestReview,
  addPullRequestReviewCommentOnReview,
  PullRequestReviewState
} from '../lib/Github';

const Container = g.div({
  margin: '8px',
  fontFamily: 'sans-serif',
});

const Actions = g.div({
  marginTop: '8px',

  '& button': {
    marginRight: '8px',
  }
});

class CommentComposer extends React.Component {
  state = {
    commentBody: '',
    addingComment: false,
  };
  subscription = new Subscription();

  render() {
    const { latestReview } = this.props;
    const hasPendingReview = latestReview && latestReview.state === PullRequestReviewState.PENDING;
    return (
      <Container>
        <textarea
          placeholder="Leave a comment"
          className="pt-input pt-fill"
          value={this.state.commentBody}
          onChange={event => this.setState({ commentBody: event.target.value })}
          autoFocus
          disabled={this.state.addingComment}
        />
        <Actions>
          <Button
            text="Cancel"
            onClick={this._closeComposer}
            disabled={this.state.addingComment}
          />
          {!hasPendingReview && <Button
            text="Add single comment"
            onClick={this._addSingleComment}
            disabled={this.state.addingComment}
          />}
          <Button
            text={hasPendingReview ? 'Add review comment' : 'Start a review'}
            intent={Intent.PRIMARY}
            onClick={this._addComment}
            disabled={this.state.addingComment}
          />
        </Actions>
      </Container>
    );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  _addSingleComment = () => {
    this.setState({ addingComment: true });

    const pullRequest = this.props.pullRequest;
    this.subscription.add(
      addPullRequestReviewComment(pullRequest, {
        body: this.state.commentBody,
        position: this.props.position,
        path: this.props.file.filename,
        commit_id: pullRequest.head.sha,
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

  _addComment = () => {
    this.setState({ addingComment: true });

    const {
      pullRequest,
      pullRequestIdFromGraphQL,
      latestReview
    } = this.props;

    if (latestReview && latestReview.state === PullRequestReviewState.PENDING) {
      this.subscription.add(
        addPullRequestReviewCommentOnReview(
          latestReview.id,
          pullRequest.head.sha,
          this.state.commentBody,
          this.props.file.filename,
          this.props.position
        ).subscribe(comment => {
          this.props.dispatch({
            type: 'PENDING_COMMENTS_ADDED',
            payload: [comment],
          });
          this.setState({ addingComment: false });
          this._closeComposer();
        })
      );
    } else {
      this.subscription.add(
        addPendingPullRequestReview(pullRequestIdFromGraphQL, pullRequest.head.sha, [{
          path: this.props.file.filename,
          position: this.props.position,
          body: this.state.commentBody,
        }])
        .subscribe(review => {
          this.props.dispatch({
            type: 'REVIEW_ADDED',
            payload: review,
          });
          this.props.dispatch({
            type: 'PENDING_COMMENTS_ADDED',
            payload: review.comments.nodes,
          });
          this.setState({ addingComment: false });
          this._closeComposer();
        })
      );
    }
  };

  _closeComposer = () => {
    this.props.onCloseComposer();
    this.setState({ commentBody: '' });
  };
}

export default connect(state => ({
  pullRequest: state.pullRequest,
  pullRequestIdFromGraphQL: state.pullRequestIdFromGraphQL,
  latestReview: state.latestReview,
}))(CommentComposer);
