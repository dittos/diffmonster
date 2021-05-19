import React from 'react';
import { connect, DispatchProp } from 'react-redux';
import { Intent, Tag, Button, Classes, Icon } from '@blueprintjs/core';
import { Subject, Subscription } from 'rxjs';
import { getUserInfo } from '../lib/GithubAuth';
import { CommentPosition, editComment } from '../stores/CommentStore';
import Styles from './CommentThread.module.css';
import { PullRequestCommentDTO, UserDTO, PullRequestReviewThreadDTO } from '../lib/Github';
import { AppAction } from '../stores';
import CommentComposer from './CommentComposer';
import { DiffFile } from '../lib/DiffParser';

interface EditorProps extends DispatchProp<AppAction> {
  comment: PullRequestCommentDTO;
  onStopEditing(): void;
}

class CommentEditor extends React.Component<EditorProps> {
  state = {
    editingBody: this.props.comment.body,
    saving: false,
  };
  subscription = new Subscription();

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    const { onStopEditing } = this.props;
    return (
      <div className={Styles.CommentItem}>
        <textarea
          className="bp3-input bp3-fill"
          value={this.state.editingBody}
          onChange={event => this.setState({ editingBody: event.target.value })}
          autoFocus
          disabled={this.state.saving}
        />
        <div className={Styles.EditingActions}>
          <Button
            text="Cancel"
            onClick={onStopEditing}
            disabled={this.state.saving}
          />
          <Button
            text="Save"
            intent={Intent.PRIMARY}
            onClick={this._save}
            disabled={this.state.saving}
          />
        </div>
      </div>
    );
  }

  _beginEditing = () => {
    this.setState({ editingBody: this.props.comment.body });
  };

  _save = () => {
    this.setState({ saving: true });
    const subject = new Subject();
    // TODO: error handling
    this.subscription.add(
      subject.subscribe(() => {
        this.props.onStopEditing();
      })
    );

    this.props.dispatch(editComment(this.props.comment, this.state.editingBody, subject));
  };
}

const CommentEditorContainer = connect()(CommentEditor);

interface CommentProps {
  viewer: UserDTO | undefined;
  comment: PullRequestCommentDTO;
  isPending: boolean;
  deleteComment(comment: PullRequestCommentDTO): void;
}

class Comment extends React.Component<CommentProps> {
  state = {
    isEditing: false,
  };

  render() {
    const { viewer, comment, isPending, deleteComment } = this.props;
    if (this.state.isEditing) {
      return <CommentEditorContainer
        comment={comment}
        onStopEditing={this._stopEditing}
      />;
    } else {
      return (
        <div className={Styles.CommentItem}>
          <div className={Styles.CommentMeta}>
            <a className={Styles.CommentUser} href={comment.author?.html_url ?? '#'} target="_blank" rel="noopener noreferrer">{comment.author?.login}</a>
            {isPending && <Tag intent={Intent.WARNING}>Pending</Tag>}
            {viewer && viewer.login === comment.author?.login && (
              <div className={Styles.Actions}>
                <Button
                  icon="edit"
                  className={Classes.MINIMAL}
                  onClick={this._startEditing}
                />
                <Button
                  icon="delete"
                  className={Classes.MINIMAL}
                  intent={Intent.DANGER}
                  onClick={() => deleteComment(comment)}
                />
              </div>
            )}
          </div>
          <div className={Styles.CommentBody} dangerouslySetInnerHTML={{__html: comment.bodyHTML}} />
        </div>
      );
    }
  }

  _startEditing = () => {
    this.setState({ isEditing: true });
  };

  _stopEditing = () => {
    this.setState({ isEditing: false });
  };
}

interface CommentThreadProps {
  file: DiffFile;
  position: CommentPosition;
  thread: PullRequestReviewThreadDTO;
  deleteComment(comment: PullRequestCommentDTO): void;
}

class CommentThread extends React.Component<CommentThreadProps> {
  state = {
    hidden: this.props.thread.isResolved,
    composerOpened: false,
  };

  componentWillReceiveProps(nextProps: CommentThreadProps) {
    if (this.props.thread.id !== nextProps.thread.id) {
      this.setState({
        hidden: nextProps.thread.isResolved,
      });
    }
  }

  render() {
    const { thread, deleteComment } = this.props;
    const viewer = getUserInfo();
    const comments = thread.comments && thread.comments.nodes;
    return (
      <div className={Styles.CommentThread}>
        {thread.isResolved &&
          <div className={Styles.CommentThreadHeader} onClick={this._toggle}>
            <Icon icon={this.state.hidden ? 'expand-all' : 'collapse-all'} />
            <div className={Styles.CommentThreadHeaderText}>
              This conversation was marked as resolved by{' '}
              <a className={Styles.CommentUser} href={thread.resolvedBy!.url} target="_blank" rel="noopener noreferrer">{thread.resolvedBy!.login}</a>
            </div>
          </div>}
        {!this.state.hidden && comments && comments.map(comment => (
          <Comment
            key={comment!.id}
            comment={comment!}
            deleteComment={deleteComment}
            isPending={comment!.state === 'PENDING'}
            viewer={viewer}
          />
        ))}
        {!this.state.hidden && comments && viewer && thread.viewerCanReply && (
          this.state.composerOpened ? (
            <div className={Styles.CommentThreadFooter}>
              <CommentComposer
                file={this.props.file}
                position={this.props.position}
                replyContext={{
                  thread,
                  comment: comments[comments.length - 1]!
                }}
                onCloseComposer={this._closeComposer}
              />
            </div>
          ) : (
            <div className={Styles.CommentThreadFooterClosed} onClick={this._openComposer}>
              <Icon icon="comment" className={Styles.ReplyIcon} />
              <div className={Styles.ReplyText}>
                Reply...
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  private _toggle = () => {
    this.setState({ hidden: !this.state.hidden });
  };

  private _openComposer = () => {
    this.setState({ composerOpened: true });
  };

  private _closeComposer = () => {
    this.setState({ composerOpened: false });
  };
}

export default CommentThread;
