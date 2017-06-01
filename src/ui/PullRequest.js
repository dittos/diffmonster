import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import DocumentTitle from 'react-document-title';
import g from 'glamorous';
import { Colors, Classes, Switch, NonIdealState } from '@blueprintjs/core';
import FileTree from './FileTree';
import Diff from './Diff';
import Summary, { Header as SummaryHeader } from './Summary';
import Loading from './Loading';
import { startAuth, isAuthenticated } from '../lib/GithubAuth';
import { setReviewState } from '../lib/Database';

const NoPreview = g.div({
  padding: '16px',
});

const Panel = g.div({
  background: Colors.WHITE,
  borderRadius: '3px',
  boxShadow: '0 0 1px rgba(0, 0, 0, 0.2)',
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

const FileTreePanel = g(Panel)({
  flex: '0 0 30%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  margin: '0 6px 6px 6px',
});

const ContentPanel = g(Panel)({
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  margin: '0 6px 6px 0',
});

class PullRequest extends Component {
  componentDidUpdate(prevProps) {
    if (prevProps.activePath !== this.props.activePath) {
      if (this._scrollEl)
        findDOMNode(this._scrollEl).scrollTop = 0;
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
            <SummaryHeader pullRequest={pullRequest} />
          </g.Div>
          <g.Div flex="1" display="flex" overflow="auto">
            {this._renderFileTree()}
            {this._renderContent()}
          </g.Div>
        </g.Div>
      </DocumentTitle>
    );
  }

  _renderFileTree() {
    const {
      files,
      comments,
      isLoadingReviewStates,
      reviewStates,
      activePath,
      onSelectFile,
    } = this.props;
    
    const commentCountByPath = {};
    if (comments) {
      for (let comment of comments) {
        if (!commentCountByPath[comment.path])
          commentCountByPath[comment.path] = 0;
        commentCountByPath[comment.path]++;
      }
    }

    return (
      <FileTreePanel>
        <PanelHeader>
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
        <g.Div flex="1" overflowY="auto">
          <FileTree
            files={files.map(file => ({
              ...file,
              commentCount: commentCountByPath[file.filename],
              isReviewed: reviewStates && reviewStates[file.sha],
            }))}
            activePath={activePath}
            onSelectFile={onSelectFile}
          />
        </g.Div>
      </FileTreePanel>
    );
  }

  _renderContent() {
    const {
      pullRequest,
      files,
      comments,
      activePath,
      reviewStates,
    } = this.props;
    const activeFile = activePath && files.filter(file => file.filename === activePath)[0];

    return (
      <ContentPanel>
        {activeFile &&
          <PanelHeader>
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
              <a href={getBlobUrl(pullRequest, activeFile)} target="_blank">View</a>
            </g.Div>
          </PanelHeader>}
        <g.Div flex="1" overflowY="auto" ref={el => this._scrollEl = el}>
          {activeFile ?
            activeFile.blocks && activeFile.blocks.length > 0 ?
              <Diff
                file={activeFile}
                comments={comments && comments.filter(c => c.path === activePath)}
                canCreateComment={isAuthenticated()}
                onAddComment={this.props.onAddComment}
              /> :
              <NoPreview>
                No change
              </NoPreview> :
            <Summary pullRequest={pullRequest} />
          }
        </g.Div>
      </ContentPanel>
    );
  }

  _renderNotFound() {
    return (
      <NonIdealState
        title="Not Found"
        visual="warning-sign"
        description={
          <p>
            <a href="#" onClick={this._login}>Login with GitHub</a> to view private repos.
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
}

function getBlobUrl(pullRequest, file) {
  return `${pullRequest.head.repo.html_url}/blob/${pullRequest.head.sha}/${file.filename}`;
}

export default connect(state => state)(PullRequest);