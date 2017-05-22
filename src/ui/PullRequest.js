import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import g from 'glamorous';
import { Colors, Classes, Switch } from '@blueprintjs/core';
import FileTree from '../ui/FileTree';
import { parsePatch } from '../lib/PatchParser';
import PullRequestFile from './PullRequestFile';
import Summary, { Header as SummaryHeader } from './Summary';
import { reviewStateRef } from '../lib/FirebaseRefs';

const NoPreview = g.div({
  padding: '16px',
});

const Panel = g.div({
  background: Colors.WHITE,
  borderRadius: '3px',
  boxShadow: '0 0 1px rgba(0, 0, 0, 0.2)',
});

const PanelHeader = g.div({
  flex: '0 0',
  padding: '0 16px',
  lineHeight: '32px',
  height: '32px',

  color: Colors.GRAY1,
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
    if (prevProps.activeFile.sha !== this.props.activeFile.sha) {
      if (this._scrollEl)
        findDOMNode(this._scrollEl).scrollTop = 0;
    }
  }

  render() {
    const { pullRequest, files, comments, activeFile, getFilePath } = this.props;

    let parsedPatch;
    if (activeFile && activeFile.patch)
      parsedPatch = parsePatch(activeFile.patch);

    return (
      <g.Div flex="1" overflow="auto" display="flex" flexDirection="column" background={Colors.DARK_GRAY3}>
        <g.Div flex="0" className={Classes.DARK}>
          <SummaryHeader pullRequest={pullRequest} />
        </g.Div>
        <g.Div flex="1" display="flex" overflow="auto">
          <FileTreePanel>
            <PanelHeader>
              Files
            </PanelHeader>
            <g.Div flex="1" overflowY="auto">
              <FileTree
                files={files}
                activePath={activeFile && activeFile.filename}
                getFilePath={getFilePath}
              />
            </g.Div>
          </FileTreePanel>
          <ContentPanel>
            {activeFile &&
              <PanelHeader css={{display: 'flex'}}>
                <g.Div flex="1">
                  {activeFile.filename}
                  {activeFile.previous_filename &&
                    ` (was: ${activeFile.previous_filename})`}
                </g.Div>
                <g.Div flex="initial">
                  {activeFile.reviewState != null && <Switch
                    className="pt-inline"
                    checked={activeFile.reviewState}
                    label="Done"
                    onChange={this._onReviewStateChange}
                  />}
                  <a href={getBlobUrlWithLine(activeFile, parsedPatch)} target="_blank">View</a>
                </g.Div>
              </PanelHeader>}
            <g.Div flex="1" overflowY="auto" ref={el => this._scrollEl = el}>
              {activeFile ?
                parsedPatch ?
                  <PullRequestFile
                    file={activeFile}
                    parsedPatch={parsedPatch}
                    comments={comments ? comments.filter(c => c.path === activeFile.filename) : []}
                  /> :
                  <NoPreview>{/* Nothing changed or binary file */}</NoPreview> :
                <Summary pullRequest={pullRequest} />
              }
            </g.Div>
          </ContentPanel>
        </g.Div>
      </g.Div>
    );
  }

  _onReviewStateChange = event => {
    this.props.onReviewStateChange(this.props.activeFile, event.target.checked);
  };
}

function getBlobUrlWithLine(file, parsedPatch) {
  let url = file.blob_url;

  if (parsedPatch) {
    url += '#L' + parsedPatch[0].range.to.start;
  }

  return url;
}
