import React from 'react';
import { connect } from 'react-redux';
import g from 'glamorous';
import { Colors, Intent, Tag, Button, Classes } from '@blueprintjs/core';
import marked from 'marked';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { getUserInfo } from '../lib/GithubAuth';
import { editComment } from '../stores/CommentStore';

const actionsClassName = 'CommentThread-Actions';

const CommentItem = g.div({
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

const EditingActions = g.div({
  marginTop: '8px',

  '& button': {
    marginRight: '8px',
  }
});

function renderMarkdown(body) {
  const rendered = marked(body, { gfm: true, sanitize: true });
  return rendered.replace(/&lt;(\/?sub)&gt;/g, '<$1>'); // TODO: is it okay?
}

class CommentEditor extends React.Component {
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
      <CommentItem>
        <textarea
          className="pt-input pt-fill"
          value={this.state.editingBody}
          onChange={event => this.setState({ editingBody: event.target.value })}
          autoFocus
          disabled={this.state.saving}
        />
        <EditingActions>
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
        </EditingActions>
      </CommentItem>
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

class Comment extends React.Component {
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
        <CommentItem>
          <CommentMeta>
            <CommentUser href={comment.user.html_url} target="_blank" rel="noopener noreferrer">{comment.user.login}</CommentUser>
            {isPending && <Tag intent={Intent.WARNING}>Pending</Tag>}
            {viewer && viewer.login === comment.user.login && (
              <Actions className={actionsClassName}>
                <Button
                  iconName="edit"
                  className={Classes.MINIMAL}
                  onClick={this._startEditing}
                />
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
        </CommentItem>
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

function CommentThread({ comments, isPending, deleteComment }) {
  const viewer = getUserInfo();
  return (
    <div>
      {comments.map(comment => (
        <Comment
          key={comment.id}
          comment={comment}
          deleteComment={deleteComment}
          isPending={isPending}
          viewer={viewer}
        />
      ))}
    </div>
  );
}

export default CommentThread;
