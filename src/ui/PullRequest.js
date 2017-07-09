import React, { Component } from 'react';
import { connect } from 'react-redux';
import DocumentTitle from 'react-document-title';
import g from 'glamorous';
import { Colors, Classes, Switch, NonIdealState } from '@blueprintjs/core';
import FileTree from './FileTree';
import Diff from './Diff';
import Header from './Header';
import Summary from './Summary';
import Loading from './Loading';
import SplitPane from './SplitPane';
import { startAuth, isAuthenticated } from '../lib/GithubAuth';
import { setReviewState } from '../lib/Database';
import * as Settings from '../lib/Settings';
import { deleteComment } from '../stores/CommentStore';

const NoPreview = g.div({
  padding: '16px',
});

const PanelHeader = g.div({
  display: 'flex',
  flex: '0 0 auto',
  padding: '0 16px',
  lineHeight: '32px',
  height: '32px',

  color: Colors.DARK_GRAY1,
  background: Colors.LIGHT_GRAY5,
  borderBottom: `1px solid ${Colors.GRAY5}`,
});

function collectCommentCountByPath(comments, commentCountByPath) {
  for (let comment of comments) {
    if (!comment.position)
      continue;
    if (!commentCountByPath[comment.path])
      commentCountByPath[comment.path] = 0;
    commentCountByPath[comment.path]++;
  }
}

class PullRequest extends Component {
  state = {
    fileTreeWidth: Settings.getFileTreeWidth(),
  };

  componentDidUpdate(prevProps) {
    if (prevProps.activePath !== this.props.activePath) {
      if (this._scrollEl)
        this._scrollEl.scrollTop = 0;
    }
  }

  render() {
    if (this.props.status === 'loading')
      return <Loading />;
    
    if (this.props.status === 'notFound')
      return this._renderNotFound();

    const pullRequest = this.props.pullRequest;

    return (
      <DocumentTitle title={`${pullRequest.title} - ${pullRequest.base.repo.full_name}#${pullRequest.number}`}>
        <g.Div flex="1" overflow="auto" display="flex" flexDirection="column" background={Colors.DARK_GRAY3}>
          <g.Div flex="0" className={Classes.DARK}>
            <Header />
          </g.Div>
          <SplitPane
            sideWidth={this.state.fileTreeWidth}
            side={this._renderFileTree()}
            main={this._renderContent()}
            onResizeEnd={this._onResizeEnd}
          />
        </g.Div>
      </DocumentTitle>
    );
  }

  _renderFileTree() {
    const {
      files,
      comments,
      pendingComments,
      isLoadingReviewStates,
      reviewStates,
      activePath,
      onSelectFile,
    } = this.props;
    
    const commentCountByPath = {};
    collectCommentCountByPath(comments, commentCountByPath);
    collectCommentCountByPath(pendingComments, commentCountByPath);

    const header = (
      <PanelHeader key="header">
        <g.Div flex="1">
          Files
        </g.Div>
        <g.Div flex="initial">
          {reviewStates ?
            <g.Span color={Colors.GRAY1}>{this._getReviewedFileCount()} of {files.length} reviewed</g.Span> :
            isLoadingReviewStates &&
              <g.Span color={Colors.GRAY4}>Loading...</g.Span>}
        </g.Div>
      </PanelHeader>
    );

    const tree = (
      <FileTree
        key="tree"
        files={files.map(file => ({
          ...file,
          commentCount: commentCountByPath[file.filename],
          isReviewed: reviewStates && reviewStates[file.sha],
        }))}
        activePath={activePath}
        onSelectFile={onSelectFile}
      />
    );

    return [header, tree];
  }

  _renderContent() {
    const {
      pullRequest,
      files,
      comments,
      pendingComments,
      activePath,
      reviewStates,
    } = this.props;
    const activeFile = activePath && files.filter(file => file.filename === activePath)[0];

    const header = activeFile && (
      <PanelHeader key="header">
        <g.Div flex="1">
          {activeFile.filename}
          {activeFile.previous_filename &&
            <g.Span color={Colors.GRAY1}> (was: {activeFile.previous_filename})</g.Span>}
        </g.Div>
        <g.Div flex="initial">
          {reviewStates && <Switch
            className="pt-inline"
            checked={reviewStates[activeFile.sha] || false}
            label="Done"
            onChange={this._onReviewStateChange}
          />}
          <a href={getBlobUrl(pullRequest, activeFile)} target="_blank" rel="noopener noreferrer">View</a>
        </g.Div>
      </PanelHeader>
    );

    const content = (
      <g.Div key="content" flex="1" overflowY="auto" innerRef={el => this._scrollEl = el}>
        {activeFile ?
          activeFile.blocks && activeFile.blocks.length > 0 ?
            <Diff
              file={activeFile}
              comments={comments.filter(c => c.path === activePath)}
              pendingComments={pendingComments.filter(c => c.path === activePath)}
              canCreateComment={isAuthenticated()}
              deleteComment={this._deleteComment}
            /> :
            <NoPreview>
              No change
            </NoPreview> :
          <Summary pullRequest={pullRequest} />
        }
      </g.Div>
    );

    return [header, content];
  }

  _renderNotFound() {
    return (
      <NonIdealState
        title="Not Found"
        visual="warning-sign"
        description={
          <p>
            <a href="" onClick={this._login}>Login with GitHub</a> to view private repos.
          </p>
        }
      />
    )
  }

  _getReviewedFileCount() {
    let count = 0;
    if (this.props.reviewStates) {
      this.props.files.forEach(file => {
        if (this.props.reviewStates[file.sha])
          count++;
      });
    }
    return count;
  }

  _onReviewStateChange = event => {
    const {
      pullRequest,
      files,
      activePath,
    } = this.props;
    const activeFile = activePath && files.filter(file => file.filename === activePath)[0];
    setReviewState(pullRequest.id, activeFile.sha, event.target.checked);
  };

  _login = event => {
    event.preventDefault();
    startAuth();
  };

  _deleteComment = commentId => {
    if (window.confirm('Are you sure?')) {
      this.props.dispatch(deleteComment(commentId));
    }
  };

  _onResizeEnd = fileTreeWidth => {
    Settings.setFileTreeWidth(fileTreeWidth);
    this.setState({ fileTreeWidth });
  };
}

function getBlobUrl(pullRequest, file) {
  return `${pullRequest.head.repo.html_url}/blob/${pullRequest.head.sha}/${file.filename}`;
}

export default connect(state => state)(PullRequest);