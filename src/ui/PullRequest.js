import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import g from 'glamorous';
import oc from 'open-color';
import FileTree from '../ui/FileTree';
import { parsePatch } from '../lib/PatchParser';
import PullRequestFile from './PullRequestFile';
import Summary from './Summary';

const FileHeader = g.div({
  padding: '0 16px',
  lineHeight: '48px',

  color: oc.gray[7],
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  zIndex: 1000,
});

const NoPreview = g.div({
  padding: '16px',
});

export default class PullRequest extends Component {
  componentDidUpdate(prevProps) {
    if (prevProps.activeFile !== this.props.activeFile) {
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
      <g.Div flex="1" overflow="auto" display="flex">
        <g.Div flex="0 0 320px" overflow="hidden" display="flex" flexDirection="column">
          <FileTree
            pullRequest={pullRequest}
            files={files}
            activePath={activeFile && activeFile.filename}
            getFilePath={getFilePath}
          />
        </g.Div>
        <g.Div flex="1" display="flex" flexDirection="column" overflow="hidden">
          {activeFile &&
            <FileHeader>
              <g.Div float="right">
                <a href={getBlobUrlWithLine(activeFile, parsedPatch)} target="_blank">View</a>
              </g.Div>
              {activeFile.filename}
            </FileHeader>}
          <g.Div flex="1" overflowY="auto" ref={el => this._scrollEl = el}>
            {activeFile ?
              parsedPatch ?
                <PullRequestFile
                  file={activeFile}
                  parsedPatch={parsedPatch}
                  comments={comments ? comments.filter(c => c.path === activeFile.filename) : []}
                /> :
                <NoPreview>Binary file</NoPreview> :
              <Summary pullRequest={pullRequest} />
            }
          </g.Div>
        </g.Div>
      </g.Div>
    );
  }
}

function getBlobUrlWithLine(file, parsedPatch) {
  let url = file.blob_url;

  if (parsedPatch) {
    url += '#L' + parsedPatch[0].range.to.start;
  }

  return url;
}
