import { createStore, applyMiddleware } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/catch';
import {
  getPullRequest,
  getPullRequestAsDiff,
  getPullRequestComments,
} from './Github';
import { isAuthenticated } from './GithubAuth';
import { observeReviewStates } from './Database';
import { parseDiff } from './DiffParser';

const fetchEpic = action$ =>
  action$.ofType('FETCH').switchMap(action =>
    Observable.zip(
      getPullRequest(action.payload.owner, action.payload.repo, action.payload.id),
      getPullRequestAsDiff(action.payload.owner, action.payload.repo, action.payload.id)
    )
    .switchMap(([ pullRequest, diff ]) => {
      const shouldLoadReviewStates = isAuthenticated();
      const success$ = Observable.of(({
        type: 'FETCH_SUCCESS',
        payload: {
          pullRequest,
          files: parseDiff(diff),
          isLoadingReviewStates: shouldLoadReviewStates,
        },
      }));

      const comments$ = getPullRequestComments(pullRequest)
        .map(comments => ({ type: 'COMMENTS_FETCHED', payload: comments }));

      const reviewStates$ = shouldLoadReviewStates ?
        observeReviewStates(pullRequest.id)
          .map(reviewStates =>
            ({ type: 'REVIEW_STATES_CHANGED', payload: reviewStates || {} })) :
        Observable.empty();
      
      return Observable.concat(success$, comments$.merge(reviewStates$));
    })
    .catch(error => Observable.of({ type: 'FETCH_ERROR', payload: error }))
  );

const rootEpic = combineEpics(
  fetchEpic,
);

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
        status: action.payload && action.payload.status === 404 ? 'notFound' : 'loading',
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
    
    default:
      return state;
  }
}

export default function() {
  return createStore(reducer, applyMiddleware(createEpicMiddleware(rootEpic)));
}