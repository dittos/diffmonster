import React from 'react';
import { connect } from 'react-redux';
import g from 'glamorous';
import { Button, Intent } from '@blueprintjs/core';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { PullRequestReviewState } from '../lib/Github';
import {
  addSingleComment,
  addReviewComment,
} from '../stores/CommentStore';
import config from '../config';

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
            onClick={this._addReviewComment}
            disabled={this.state.addingComment}
          />
        </Actions>
      </Container>
    );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  _getBodyWithSig() {
    if (!config.enableCommentSignature)
      return this.state.commentBody;
    
    const url = this.props.pullRequest.html_url.replace(/https?:\/\/github.com\//, config.url + '#/') +
      '?path=' + encodeURIComponent(this.props.file.filename);
    return `${this.state.commentBody}\n\n<sub>_commented via [Diff Monster](${url})_</sub>`;
  }

  _addComment(actionCreator) {
    this.setState({ addingComment: true });
    const subject = new Subject();
    // TODO: error handling
    this.subscription.add(
      subject.subscribe(() => {
        this.setState({ addingComment: false });
        this._closeComposer();
      })
    );

    this.props.dispatch(actionCreator({
      body: this._getBodyWithSig(),
      position: this.props.position,
      path: this.props.file.filename,
    }, subject));
  }

  _addSingleComment = () => {
    this._addComment(addSingleComment);
  };

  _addReviewComment = () => {
    this._addComment(addReviewComment);
  };

  _closeComposer = () => {
    this.setState({ commentBody: '' });
    this.props.onCloseComposer();
  };
}

export default connect(state => ({
  pullRequest: state.pullRequest,
  latestReview: state.latestReview,
}))(CommentComposer);
