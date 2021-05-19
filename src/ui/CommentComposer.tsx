import React from 'react';
import { connect, DispatchProp } from 'react-redux';
import { Button, Intent } from '@blueprintjs/core';
import { Subject, Subscription } from 'rxjs';
import { PullRequestReviewDTO, PullRequestDTO, PullRequestCommentDTO, PullRequestReviewThreadDTO } from '../lib/Github';
import {
  addSingleComment,
  addReviewComment,
  AddCommentActionPayload,
  AddCommentAction,
  CommentPosition,
} from '../stores/CommentStore';
import config from '../config';
import Styles from './CommentComposer.module.css';
import { PullRequestLoadedState } from '../stores/getInitialState';
import { AppAction } from '../stores';
import { DiffFile } from '../lib/DiffParser';
import { PullRequestReviewState } from '../__generated__/globalTypes';

interface StateProps {
  latestReview: PullRequestReviewDTO | null;
  pullRequest: PullRequestDTO;
}

interface OwnProps {
  file: DiffFile;
  position: CommentPosition;
  replyContext?: {
    thread: PullRequestReviewThreadDTO;
    comment: PullRequestCommentDTO;
  };
  onCloseComposer(): void;
}

interface Props extends DispatchProp<AppAction>, StateProps, OwnProps {
}

class CommentComposer extends React.Component<Props> {
  state = {
    commentBody: '',
    addingComment: false,
  };
  subscription = new Subscription();

  render() {
    const { latestReview } = this.props;
    const hasPendingReview = latestReview && latestReview.state === PullRequestReviewState.PENDING;
    return (
      <div className={Styles.Container}>
        <textarea
          placeholder="Leave a comment"
          className="bp3-input bp3-fill"
          value={this.state.commentBody}
          onChange={event => this.setState({ commentBody: event.target.value })}
          autoFocus
          disabled={this.state.addingComment}
        />
        <div className={Styles.Actions}>
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
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  _getBodyWithSig() {
    if (!config.enableCommentSignature)
      return this.state.commentBody;
    
    const url = this.props.pullRequest.url.replace(/https?:\/\/github.com\//, config.url + '#/') +
      '?path=' + encodeURIComponent(this.props.file.filename);
    return `${this.state.commentBody}\n\n<sub>_commented via [Diff Monster](${url})_</sub>`;
  }

  _addComment(actionCreator: (payload: AddCommentActionPayload, subject: Subject<void>) => AddCommentAction) {
    this.setState({ addingComment: true });
    const subject = new Subject<void>();
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
      replyContext: this.props.replyContext,
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

export default connect<StateProps, {}, OwnProps, PullRequestLoadedState>(state => ({
  pullRequest: state.pullRequest,
  latestReview: state.latestReview,
}))(CommentComposer);
