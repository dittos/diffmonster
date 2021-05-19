import React, { Component, FormEvent, MouseEvent } from 'react';
import { connect, DispatchProp } from 'react-redux';
import DocumentTitle from 'react-document-title';
import { Colors, Classes, Switch, NonIdealState } from '@blueprintjs/core';
import FileTree from './FileTree';
import Diff from './Diff';
import Header from './Header';
import Loading from './Loading';
import SplitPane from './SplitPane';
import { startAuth, isAuthenticated } from '../lib/GithubAuth';
import { setReviewState } from '../lib/Database';
import * as Settings from '../lib/Settings';
import { deleteComment } from '../stores/CommentStore';
import Styles from './PullRequest.module.css';
import { PullRequestCommentDTO, PullRequestDTO, PullRequestReviewThreadDTO } from '../lib/Github';
import { AppState } from '../stores/getInitialState';
import { AppAction } from '../stores';
import { DiffFile } from '../lib/DiffParser';

function collectCommentCountByPath(reviewThreads: PullRequestReviewThreadDTO[]) {
  const commentCountByPath: {[key: string]: number} = {};
  for (let thread of reviewThreads) {
    // FIXME: is this right UX-wise?
    if (thread.isResolved)
      continue;

    if (!thread.comments?.nodes)
      continue;
    for (let comment of thread.comments.nodes) {
      if (!comment?.position)
        continue;
      if (!commentCountByPath[comment.path])
        commentCountByPath[comment.path] = 0;
      commentCountByPath[comment.path]++;
    }
  }
  return commentCountByPath;
}

interface OwnProps {
  activePath: string | undefined;
  onSelectFile(path: string): void;
}

type Props = AppState & DispatchProp<AppAction> & OwnProps;

interface Snapshot {
  scrollTop: number;
}

class PullRequest extends Component<Props> {
  private _scrollEl: Element | null = null;
  private _scrollPositions = new Map<string, number>();

  state = {
    fileTreeWidth: Settings.getFileTreeWidth(),
  };

  getSnapshotBeforeUpdate(): Snapshot {
    return {
      scrollTop: this._scrollEl ? this._scrollEl.scrollTop : 0
    };
  }

  componentDidUpdate(prevProps: Props, prevState: any, snapshot: Snapshot) {
    if (prevProps.activePath !== this.props.activePath) {
      this._scrollPositions.set(prevProps.activePath || '', snapshot.scrollTop);

      if (this._scrollEl)
        this._scrollEl.scrollTop = this._scrollPositions.get(this.props.activePath || '') || 0;
    }
  }

  render() {
    if (this.props.status === 'loading')
      return <Loading />;
    
    if (this.props.status === 'notFound')
      return this._renderNotFound();

    const pullRequest = this.props.pullRequest!;

    return (
      <DocumentTitle title={`${pullRequest.title} - ${pullRequest.base.repo.full_name}#${pullRequest.number}`}>
        <div className={Styles.Container}>
          <div style={{ flex: 0 }} className={Classes.DARK}>
            <Header />
          </div>
          <SplitPane
            sideWidth={this.state.fileTreeWidth}
            side={this._renderFileTree()}
            main={this._renderContent()}
            onResizeEnd={this._onResizeEnd}
          />
        </div>
      </DocumentTitle>
    );
  }

  _renderFileTree() {
    const {
      files,
      isLoadingReviewStates,
      reviewStates,
      reviewThreads,
      activePath,
      onSelectFile,
    } = this.props;
    const commentCountByPath = collectCommentCountByPath(reviewThreads);

    const header = (
      <div className={Styles.PanelHeader} key="header">
        <div style={{ flex: 1 }}>
          Files
        </div>
        <div style={{ flex: 'initial' }}>
          {reviewStates ?
            <span style={{ color: Colors.GRAY1 }}>
              {this._getReviewedFileCount()} of {files!.length} reviewed
            </span> :
            isLoadingReviewStates &&
              <span style={{ color: Colors.GRAY4 }}>Loading...</span>}
        </div>
      </div>
    );

    const tree = (
      <FileTree
        key="tree"
        files={files!.map(file => ({
          ...file,
          commentCount: commentCountByPath[file.filename],
          isReviewed: reviewStates && reviewStates[file.sha || ''],
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
      pullRequestBodyRendered,
      files,
      reviewThreads,
      activePath,
      reviewStates,
    } = this.props;
    const activeFile = activePath && files!.filter(file => file.filename === activePath)[0];

    const header = activeFile && (
      <div className={Styles.PanelHeader} key="header">
        <div style={{ flex: 1 }}>
          {activeFile.filename}
          {activeFile.previous_filename &&
            <span style={{ color: Colors.GRAY1 }}> (was: {activeFile.previous_filename})</span>}
        </div>
        <div style={{ flex: 'initial' }}>
          {reviewStates && <Switch
            className="bp3-inline"
            checked={reviewStates[activeFile.sha || ''] || false}
            label="Done"
            onChange={this._onReviewStateChange}
          />}
          <a href={getBlobUrl(pullRequest!, activeFile)} target="_blank" rel="noopener noreferrer">View</a>
        </div>
      </div>
    );

    const content = (
      <div key="content" style={{ flex: 1, overflowY: "auto" }} ref={el => this._scrollEl = el}>
        {activeFile ?
          activeFile.blocks && activeFile.blocks.length > 0 ?
            <Diff
              file={activeFile}
              reviewThreads={reviewThreads.filter(it => it.comments?.nodes?.[0]?.path === activePath)}
              canCreateComment={isAuthenticated()}
              deleteComment={this._deleteComment}
            /> :
            <div className={Styles.NoPreview}>
              No change
            </div> :
          (pullRequestBodyRendered && <div
            className={`${Styles.Summary} bp3-running-text`}
            dangerouslySetInnerHTML={{__html: pullRequestBodyRendered}}
          />)
        }
      </div>
    );

    return [header, content];
  }

  _renderNotFound() {
    return (
      <NonIdealState
        title="Not Found"
        icon="warning-sign"
        description={
          isAuthenticated() ? undefined : <p>
            <a href="https://github.com/" onClick={this._login}>Login with GitHub</a> to view private repos.
          </p>
        }
      />
    )
  }

  _getReviewedFileCount() {
    let count = 0;
    if (this.props.reviewStates) {
      this.props.files!.forEach(file => {
        if (this.props.reviewStates![file.sha || ''])
          count++;
      });
    }
    return count;
  }

  _onReviewStateChange = (event: FormEvent<HTMLInputElement>) => {
    const {
      pullRequest,
      files,
      activePath,
    } = this.props;
    const activeFile = activePath && files!.filter(file => file.filename === activePath)[0];
    if (!activeFile || !activeFile.sha) {
      return;
    }
    setReviewState(pullRequest!.id, activeFile.sha, event.currentTarget.checked);
  };

  _login = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    startAuth();
  };

  _deleteComment = (comment: PullRequestCommentDTO) => {
    if (window.confirm('Are you sure?')) {
      this.props.dispatch(deleteComment(comment));
    }
  };

  _onResizeEnd = (fileTreeWidth: number) => {
    Settings.setFileTreeWidth(fileTreeWidth);
    this.setState({ fileTreeWidth });
  };
}

function getBlobUrl(pullRequest: PullRequestDTO, file: DiffFile) {
  return `${pullRequest.head.repo.html_url}/blob/${pullRequest.head.sha}/${file.filename}`;
}

export default connect<AppState, {}, OwnProps, AppState>(state => state)(PullRequest);