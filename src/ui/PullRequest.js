import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import g from 'glamorous';
import { Colors, Classes, Switch } from '@blueprintjs/core';
import FileTree from '../ui/FileTree';
import Diff from './Diff';
import Summary, { Header as SummaryHeader } from './Summary';
import { isAuthenticated } from '../lib/GithubAuth';

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

export default class PullRequest extends Component {
  componentDidUpdate(prevProps) {
    if ((prevProps.activeFile && prevProps.activeFile.sha) !==
        (this.props.activeFile && this.props.activeFile.sha)) {
      if (this._scrollEl)
        findDOMNode(this._scrollEl).scrollTop = 0;
    }
  }

  render() {
    return (
      <g.Div flex="1" overflow="auto" display="flex" flexDirection="column" background={Colors.DARK_GRAY3}>
        <g.Div flex="0" className={Classes.DARK}>
          <SummaryHeader pullRequest={this.props.data.pullRequest} />
        </g.Div>
        <g.Div flex="1" display="flex" overflow="auto">
          {this._renderFileTree()}
          {this._renderContent(this.props.activeFile)}
        </g.Div>
      </g.Div>
    );
  }

  _renderFileTree() {
    const {
      activeFile,
      getFilePath,
    } = this.props;
    const {
      files,
      isLoadingReviewStates,
      reviewStates,
      reviewedFileCount,
    } = this.props.data;

    return (
      <FileTreePanel>
        <PanelHeader>
          <g.Div flex="1">
            Files
          </g.Div>
          <g.Div flex="initial">
            {reviewStates ?
              <g.Span color={Colors.GRAY1}>{reviewedFileCount} of {files.length} reviewed</g.Span> :
              isLoadingReviewStates &&
                <g.Span color={Colors.GRAY4}>Loading...</g.Span>}
          </g.Div>
        </PanelHeader>
        <g.Div flex="1" overflowY="auto">
          <FileTree
            files={files}
            activePath={activeFile && activeFile.filename}
            getFilePath={getFilePath}
          />
        </g.Div>
      </FileTreePanel>
    );
  }

  _renderContent(activeFile) {
    const {
      pullRequest,
      reviewStates,
    } = this.props.data;

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
                checked={activeFile.isReviewed}
                label="Done"
                onChange={this._onReviewStateChange}
              />}
              <a href={activeFile.blob_url} target="_blank">View</a>
            </g.Div>
          </PanelHeader>}
        <g.Div flex="1" overflowY="auto" ref={el => this._scrollEl = el}>
          {activeFile ?
            activeFile.patch ?
              <Diff
                file={activeFile}
                canCreateComment={isAuthenticated()}
                onAddComment={this.props.onAddComment}
              /> :
              <NoPreview>{/* Nothing changed or binary file */}</NoPreview> :
            <Summary pullRequest={pullRequest} />
          }
        </g.Div>
      </ContentPanel>
    );
  }

  _onReviewStateChange = event => {
    this.props.onReviewStateChange(this.props.activeFile, event.target.checked);
  };
}
