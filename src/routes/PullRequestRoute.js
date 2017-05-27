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
  loadId = 0;

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

    return (
      <DocumentTitle title={`${data.pullRequest.title} - ${data.pullRequest.base.repo.full_name}#${data.pullRequest.number}`}>
        <PullRequest
          key={this.loadId}
          data={data}
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
    this.loadId++;

    const { owner, repo, id } = params;
    this.subscription.add(Observable.zip(
      getPullRequest(owner, repo, id),
      getPullRequestFiles(owner, repo, id),
      (pullRequest, files) => ({ pullRequest, files })
    ).subscribe(data => {
      try {
        data.isLoadingReviewStates = isAuthenticated();
        this.setState({ data });

        this.subscription.add(getPullRequestComments(data.pullRequest)
          .subscribe(this._applyComments, err => console.error(err)));

        if (data.isLoadingReviewStates) {
          this.subscription.add(observeReviewStates(data.pullRequest.id)
            .subscribe(this._applyReviewStates, err => console.error(err)));
        }
      } catch (e) {
        console.error(e);
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

  _applyComments = comments => {
    if (!comments)
      return;

    // Exclude outdated comments
    comments = comments.filter(comment => Boolean(comment.position));

    this.setState(({ data }) => {
      return {
        data: {
          ...data,
          files: data.files.map(file => ({
            ...file,
            comments: comments.filter(comment => comment.path === file.filename),
          })),
        }
      };
    });
  };

  _applyReviewStates = reviewStates => {
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
          isLoadingReviewStates: false,
          reviewStates,
          reviewedFileCount,
        }
      }
    });
  };

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
