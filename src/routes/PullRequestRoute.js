import React, { Component } from 'react';
import { NonIdealState } from '@blueprintjs/core';
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
} from '../lib/Github';
import { isAuthenticated } from '../lib/GithubAuth';
import { observeReviewStates } from '../lib/Database';
import withQueryParams from '../lib/withQueryParams';

import { createStore } from 'redux';
import { Provider } from 'react-redux';

function getInitialState() {
  return {
    status: 'loading',
    pullRequest: null,
    files: null,
    comments: null,
    isLoadingReviewStates: false,
    reviewStates: null,
  };
}

function reducer(state = getInitialState(), action) {
  switch (action.type) {
    case 'FETCH':
      return getInitialState();

    case 'FETCH_ERROR':
      return {
        ...state,
        status: 'notFound',
      };

    case 'FETCH_SUCCESS':
      return {
        ...state,
        status: 'success',
        ...action.payload,
      };

    case 'COMMENTS_FETCHED':
      return {
        ...state,
        comments: action.payload,
      };

    case 'COMMENT_ADDED':
      return {
        ...state,
        comments: state.comments.concat(action.payload),
      };

    case 'REVIEW_STATES_CHANGED':
      return {
        ...state,
        reviewStates: action.payload,
        isLoadingReviewStates: false,
      };
  }

  return state;
}

class PullRequestRoute extends Component {
  subscription = new Subscription();
  store = createStore(reducer);

  componentDidMount() {
    this.store.subscribe(() => console.log(this.store.getState()))
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
    return (
      <Provider store={this.store}>
        <PullRequest
          activePath={this.props.queryParams.path}
          onSelectFile={this._onSelectFile}
        />
      </Provider>
    );
  }

  _load(params) {
    this._cancelLoad();
    this.store.dispatch({ type: 'FETCH' });

    const { owner, repo, id } = params;
    this.subscription.add(Observable.zip(
      getPullRequest(owner, repo, id),
      getPullRequestFiles(owner, repo, id)
    ).subscribe(([ pullRequest, files ]) => {
      try {
        const shouldLoadReviewStates = isAuthenticated();

        this.store.dispatch({
          type: 'FETCH_SUCCESS',
          payload: {
            pullRequest,
            files,
            isLoadingReviewStates: shouldLoadReviewStates,
          },
        });

        this.subscription.add(getPullRequestComments(pullRequest)
          .subscribe(
            comments => this.store.dispatch({ type: 'COMMENTS_FETCHED', payload: comments }),
            err => console.error(err)
          ));

        if (shouldLoadReviewStates) {
          this.subscription.add(observeReviewStates(pullRequest.id)
            .subscribe(
              reviewStates =>
                this.store.dispatch({ type: 'REVIEW_STATES_CHANGED', payload: reviewStates || {} }),
              err => console.error(err)
            ));
        }
      } catch (e) {
        console.error(e);
      }
    }, err => {
      if (err.status === 404) {
        this.store.dispatch({ type: 'FETCH_ERROR' });
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

  _onSelectFile = path => {
    this.props.history.push({
      ...this.props.location,
      search: path ? `?path=${encodeURIComponent(path)}` : '',
    });
  };
}

export default withQueryParams(PullRequestRoute);
