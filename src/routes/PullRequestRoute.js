import React, { Component } from 'react';
import { NonIdealState } from '@blueprintjs/core';
import DocumentTitle from 'react-document-title';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/zip';
import querystring from 'querystring';
import Loading from '../ui/Loading';
import PullRequest from '../ui/PullRequest';
import {
  getPullRequest,
  getPullRequestFiles,
  getPullRequestComments,
} from '../lib/Github';
import { startAuth, isAuthenticated } from '../lib/GithubAuth';
import { observeReviewStates, setReviewState } from '../lib/Database';

export default class PullRequestRoute extends Component {
  state = {
    data: { isLoading: true }
  };
  subscription = new Subscription();

  componentDidMount() {
    this._load(this.props.match.params);
  }

  componentWillReceiveProps(nextProps) {
    const params = this.props.match.params;
    const nextParams = nextProps.match.params;
    if (
      params.owner !== nextParams.owner ||
      params.repo !== nextParams.repo ||
      params.id !== nextParams.id
    ) {
      this._load(nextProps.match.params);
    }
  }

  componentWillUnmount() {
    this._cancelLoad();
  }

  render() {
    const { data } = this.state;

    if (data.isLoading)
      return <Loading />;
    
    if (data.notFound)
      return this._renderNotFound();

    const {
      pullRequest,
      files,
      reviewStates,
      reviewedFileCount,
      comments = [],
    } = data;

    return (
      <DocumentTitle title={`${pullRequest.title} - ${pullRequest.base.repo.full_name}#${pullRequest.number}`}>
        <PullRequest
          pullRequest={pullRequest}
          files={files}
          comments={comments}
          reviewStates={reviewStates}
          reviewedFileCount={reviewedFileCount}
          activeFile={this._getActiveFile()}
          getFilePath={path => ({...this.props.location, search: path ? `?path=${encodeURIComponent(path)}` : ''})}
          onReviewStateChange={this._onReviewStateChange}
        />
      </DocumentTitle>
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

  _load(params) {
    this._cancelLoad();
    this.setState({ data: { isLoading: true } });

    const { owner, repo, id } = params;
    this.subscription.add(Observable.zip(
      getPullRequest(owner, repo, id),
      getPullRequestFiles(owner, repo, id),
      (pullRequest, files) => ({ pullRequest, files })
    ).subscribe(data => {
      this.setState({ data });

      this.subscription.add(getPullRequestComments(data.pullRequest)
        .subscribe(comments => {
          this.setState(({ data }) => ({ data: { ...data, comments } }));
        }));

      if (isAuthenticated()) {
        this.subscription.add(observeReviewStates(data.pullRequest.id)
          .subscribe(reviewStates => this._applyReviewStates(reviewStates)));
      } else {
        this.setState(({ data }) => ({ data: { ...data, hasReviewStates: false } }));
      }
    }, err => {
      if (err.status === 404) {
        this.setState({ data: { notFound: true } });
      } else {
        console.log(err);
        // TODO: show error
      }
    }));
  }

  _applyReviewStates(reviewStates) {
    // NOTE: could be called multiple times if reviewStates change

    if (!reviewStates)
      reviewStates = {};

    this.setState(({ data }) => {
      let reviewedFileCount = 0;
      for (let file of data.files)
        if (reviewStates[file.sha])
          reviewedFileCount++;

      return {
        data: {
          ...data,
          files: data.files.map(file => ({
            ...file,
            isReviewed: reviewStates[file.sha],
          })),
          hasReviewStates: true,
          reviewStates,
          reviewedFileCount,
        }
      }
    });
  }

  _reload() {
    this._load(this.props.match.params);
  }

  _cancelLoad() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
    }
  }

  _getActiveFile() {
    const queryParams = querystring.parse(this.props.location.search.substring(1));
    const activePath = queryParams.path;
    const files = this.state.data.files;
    if (activePath && files)
      return files.filter(file => file.filename === activePath)[0];
  }

  _login = event => {
    event.preventDefault();
    startAuth();
  };

  _onReviewStateChange = (file, reviewState) => {
    setReviewState(this.state.data.pullRequest.id, file.sha, reviewState);
  };
}
