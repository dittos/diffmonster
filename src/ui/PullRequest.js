import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import g from 'glamorous';
import oc from 'open-color';
import marked from 'marked';
import PullRequestHeader from '../ui/PullRequestHeader';
import FileTree from '../ui/FileTree';
import PullRequestFile from './PullRequestFile';

const FileHeader = g.div({
  padding: '16px',

  background: oc.gray[9],
  color: oc.gray[5],
});

const PullRequestBody = g.div({
  maxWidth: '50em',
  margin: '0 auto',
  lineHeight: 1.8,
  fontSize: '14px',
});

export default class PullRequest extends Component {
  componentDidUpdate(prevProps) {
    if (prevProps.activeFile !== this.props.activeFile) {
      if (this._scrollEl)
        findDOMNode(this._scrollEl).scrollTop = 0;
    }
  }

  render() {
    const { data, files, comments, activeFile, getFilePath } = this.props;

    return <g.Div flex="1" display="flex" flexDirection="column">
      <g.Div flex="none" zIndex={1000 /* for shadow */}>
        <PullRequestHeader
          key={data.url}
          pullRequest={data}
        />
      </g.Div>
      <g.Div flex="1" overflow="auto" display="flex">
        <g.Div flex="0 0 320px" display="flex">
          {files && <FileTree
            files={files}
            activePath={activeFile && activeFile.filename}
            getFilePath={getFilePath}
          />}
        </g.Div>
        <g.Div flex="1" display="flex" flexDirection="column" overflow="hidden">
          {activeFile && <FileHeader>{activeFile.filename}</FileHeader>}
          <g.Div flex="1" overflowY="auto" ref={el => this._scrollEl = el}>
            {activeFile ?
              <PullRequestFile file={activeFile} comments={comments ? comments.filter(c => c.path === activeFile.filename) : []} /> :
              <PullRequestBody dangerouslySetInnerHTML={{__html: marked(data.body, { gfm: true })}} />
            }
          </g.Div>
        </g.Div>
      </g.Div>
    </g.Div>;
  }
}
