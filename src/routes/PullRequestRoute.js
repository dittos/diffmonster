import React, { Component } from 'react';
import { NonIdealState } from '@blueprintjs/core';
import DocumentTitle from 'react-document-title';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/do';
import Loading from '../ui/Loading';
import PullRequest from '../ui/PullRequest';
import {
  getPullRequest,
  getPullRequestFiles,
  getPullRequestComments,
  addPullRequestReviewComment,
} from '../lib/Github';
import { startAuth, isAuthenticated } from '../lib/GithubAuth';
import { observeReviewStates } from '../lib/Database';
import withQueryParams from '../lib/withQueryParams';

class PullRequestRoute extends Component {
  state = {
    status: 'loading',
    pullRequest: null,
    files: null,
    comments: null,
    isLoadingReviewStates: false,
    reviewStates: null,
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
    if (this.state.status === 'loading')
      return <Loading />;
    
    if (this.state.status === 'notFound')
      return this._renderNotFound();

    return (
      <DocumentTitle title={`${this.state.pullRequest.title} - ${this.state.pullRequest.base.repo.full_name}#${this.state.pullRequest.number}`}>
        <PullRequest
          pullRequest={this.state.pullRequest}
          files={this.state.files}
          comments={this.state.comments}
          isLoadingReviewStates={this.state.isLoadingReviewStates}
          reviewStates={this.state.reviewStates}
          activePath={this.props.queryParams.path}
          onSelectFile={this._onSelectFile}
          onAddComment={this._addComment}
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
    const shouldLoadReviewStates = isAuthenticated();
    this.setState({
      status: 'loading',
      pullRequest: null,
      files: null,
      comments: null,
      reviewStates: null,
      isLoadingReviewStates: shouldLoadReviewStates,
    });

    const { owner, repo, id } = params;
    this.subscription.add(Observable.zip(
      getPullRequest(owner, repo, id),
      getPullRequestFiles(owner, repo, id)
    ).subscribe(([ pullRequest, files ]) => {
      try {
        this.setState({
          status: 'success',
          pullRequest,
          files,
        });

        this.subscription.add(getPullRequestComments(pullRequest)
          .subscribe(
            comments => this.setState({ comments }),
            err => console.error(err)
          ));

        if (shouldLoadReviewStates) {
          this.subscription.add(observeReviewStates(pullRequest.id)
            .subscribe(
              reviewStates =>
                this.setState({ reviewStates, isLoadingReviewStates: false }),
              err => console.error(err)
            ));
        }
      } catch (e) {
        console.error(e);
      }
    }, err => {
      if (err.status === 404) {
        this.setState({ status: 'notFound' });
      } else {
        console.log(err);
        // TODO: show error
      }
    }));
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

  _login = event => {
    event.preventDefault();
    startAuth();
  };

  _addComment = (comment) => {
    const pullRequest = this.state.pullRequest;
    return addPullRequestReviewComment(pullRequest, {
      ...comment,
      commit_id: pullRequest.head.sha,
    }).do(comment => {
      this.setState(({ comments }) => ({ comments: comments.concat(comment) }));
    });
  };

  _onSelectFile = path => {
    this.props.history.push({
      ...this.props.location,
      search: path ? `?path=${encodeURIComponent(path)}` : '',
    });
  };
}

export default withQueryParams(PullRequestRoute);
