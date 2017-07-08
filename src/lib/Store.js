import { createStore, applyMiddleware } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/zip';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/takeUntil';
import {
  getPullRequest,
  getPullRequestAsDiff,
  getPullRequestComments,
  getPullRequestFromGraphQL,
  getPullRequestReviewComments,
  addPullRequestReview,
  submitPullRequestReview,
  PullRequestReviewState,
} from './Github';
import { isAuthenticated, getUserInfo } from './GithubAuth';
import { observeReviewStates } from './Database';
import { parseDiff } from './DiffParser';

function getLatestReview(reviews) {
  let latestReview = null;
  for (const review of reviews) {
    if (!review.viewerDidAuthor)
      continue;
    if (!latestReview || new Date(latestReview.createdAt) < new Date(review.createdAt))
      latestReview = review;
  }
  return latestReview;
}

const FETCH = 'FETCH';
const FETCH_CANCEL = 'FETCH_CANCEL';
const FETCH_ERROR = 'FETCH_ERROR';
const FETCH_SUCCESS = 'FETCH_SUCCESS';

const COMMENTS_FETCHED = 'COMMENTS_FETCHED';
const PENDING_COMMENTS_FETCHED = 'PENDING_COMMENTS_FETCHED';
const COMMENT_ADDED = 'COMMENT_ADDED';
const PENDING_COMMENTS_ADDED = 'PENDING_COMMENTS_ADDED';
const ADD_REVIEW = 'ADD_REVIEW';
const ADD_REVIEW_ERROR = 'ADD_REVIEW_ERROR';
const REVIEW_ADDED = 'REVIEW_ADDED';
const SUBMIT_REVIEW = 'SUBMIT_REVIEW';
const SUBMIT_REVIEW_ERROR = 'SUBMIT_REVIEW_ERROR';
const SUBMIT_REVIEW_SUCCESS = 'SUBMIT_REVIEW_SUCCESS';
const REVIEW_STATES_CHANGED = 'REVIEW_STATES_CHANGED';

export function fetch({ owner, repo, number }) {
  return { type: FETCH, payload: { owner, repo, number } };
}

export function fetchCancel() {
  return { type: FETCH_CANCEL };
}

export function commentAdded(comment) {
  return { type: COMMENT_ADDED, payload: comment };
}

export function pendingCommentsAdded(pendingComments) {
  return { type: PENDING_COMMENTS_ADDED, payload: pendingComments };
}

export function reviewAdded(review) {
  return { type: REVIEW_ADDED, payload: review };
}

export function submitReview({ event }) {
  return { type: SUBMIT_REVIEW, payload: { event } };
}

export function addReview({ event }) {
  return { type: ADD_REVIEW, payload: { event } };
}

const fetchEpic = action$ =>
  action$.ofType(FETCH).switchMap(action =>
    Observable.zip(
      getPullRequest(action.payload.owner, action.payload.repo, action.payload.number),
      getPullRequestAsDiff(action.payload.owner, action.payload.repo, action.payload.number),
      getUserInfo() ?
        getPullRequestFromGraphQL(action.payload.owner, action.payload.repo, action.payload.number, `
          id
          reviews(last: 100) { # TODO: handle pagination
            nodes {
              id
              state
              viewerDidAuthor
              createdAt
              databaseId
            }
          }
        `).catch(error => {
          if (error.some(e => e.type === 'NOT_FOUND')) {
            error = { status: 404 }; // XXX
          }
          throw error;
        }) :
        Observable.of(null)
    )
    .switchMap(([ pullRequest, diff, pullRequestFromGraphQL ]) => {
      const authenticated = isAuthenticated();
      let latestReview = null;
      if (pullRequestFromGraphQL) {
        latestReview = getLatestReview(pullRequestFromGraphQL.reviews.nodes);
      }
      const success$ = Observable.of(({
        type: FETCH_SUCCESS,
        payload: {
          pullRequest,
          pullRequestIdFromGraphQL: pullRequestFromGraphQL && pullRequestFromGraphQL.id,
          files: parseDiff(diff),
          latestReview,
          isLoadingReviewStates: authenticated,
        },
      }));

      let comments$ = getPullRequestComments(pullRequest)
        .map(comments => ({ type: COMMENTS_FETCHED, payload: comments }));
      if (latestReview && latestReview.state === PullRequestReviewState.PENDING) {
        comments$ = Observable.concat(
          comments$,
          getPullRequestReviewComments(pullRequest, latestReview.databaseId)
            .map(pendingComments => ({ type: PENDING_COMMENTS_FETCHED, payload: pendingComments }))
        );
      }

      const reviewStates$ = authenticated ?
        observeReviewStates(pullRequest.id)
          .map(reviewStates =>
            ({ type: REVIEW_STATES_CHANGED, payload: reviewStates || {} })) :
        Observable.empty();
      
      return Observable.concat(success$, comments$.merge(reviewStates$));
    })
    .catch(error => {
      console.error(error);
      return Observable.of({ type: FETCH_ERROR, payload: error });
    })
    .takeUntil(action$.ofType(FETCH_CANCEL)
  ));

const addReviewEpic = (action$, store) =>
  action$.ofType(ADD_REVIEW).mergeMap(action => {
    const state = store.getState();
    return addPullRequestReview(state.pullRequestIdFromGraphQL, state.pullRequest.head.sha, action.payload.event)
      .map(review => ({
        type: REVIEW_ADDED,
        payload: review,
      }))
      .catch(error => Observable.of({
        type: ADD_REVIEW_ERROR,
        payload: error,
      }));
  });

const submitReviewEpic = (action$, store) =>
  action$.ofType(SUBMIT_REVIEW).mergeMap(action => {
    const state = store.getState();
    return submitPullRequestReview(state.latestReview.id, action.payload.event)
      .map(review => ({
        type: SUBMIT_REVIEW_SUCCESS,
        payload: review,
      }))
      .catch(error => Observable.of({
        type: SUBMIT_REVIEW_ERROR,
        payload: error,
      }));
  });

const rootEpic = combineEpics(
  fetchEpic,
  addReviewEpic,
  submitReviewEpic,
);

function getInitialState() {
  return {
    currentUser: getUserInfo(),
    status: 'loading',
    pullRequest: null,
    pullRequestIdFromGraphQL: null,
    files: null,
    comments: null,
    isLoadingReviewStates: false,
    reviewStates: null,
    latestReview: null,
    isAddingReview: false,
  };
}

function reducer(state = getInitialState(), action) {
  switch (action.type) {
    case FETCH:
      return getInitialState();

    case FETCH_ERROR:
      return {
        ...state,
        status: action.payload && action.payload.status === 404 ? 'notFound' : 'loading',
      };

    case FETCH_SUCCESS:
      return {
        ...state,
        status: 'success',
        ...action.payload,
      };

    case COMMENTS_FETCHED:
      return {
        ...state,
        comments: action.payload,
      };

    case PENDING_COMMENTS_FETCHED:
      return {
        ...state,
        comments: state.comments.filter(c => !c.isPending)
          .concat(action.payload.map(c => ({ ...c, isPending: true })))
      };

    case COMMENT_ADDED:
      return {
        ...state,
        comments: state.comments.concat(action.payload),
      };
    
    case PENDING_COMMENTS_ADDED:
      return {
        ...state,
        comments: state.comments.concat(action.payload.map(c => ({ ...c, isPending: true })))
      };

    case ADD_REVIEW:
      return {
        ...state,
        isAddingReview: true,
      };
    
    case ADD_REVIEW_ERROR:
      return {
        ...state,
        isAddingReview: false,
      };
    
    case REVIEW_ADDED:
      return {
        ...state,
        latestReview: action.payload,
        isAddingReview: false,
      };
    
    case SUBMIT_REVIEW:
      return {
        ...state,
        isAddingReview: true,
      };
    
    case SUBMIT_REVIEW_ERROR:
      return {
        ...state,
        isAddingReview: false,
      };

    case SUBMIT_REVIEW_SUCCESS:
      return {
        ...state,
        latestReview: action.payload,
        isAddingReview: false,
        comments: state.comments.map(c => {
          if (c.isPending) {
            return { ...c, isPending: false };
          } else {
            return c;
          }
        })
      };

    case REVIEW_STATES_CHANGED:
      return {
        ...state,
        reviewStates: action.payload,
        isLoadingReviewStates: false,
      };
    
    default:
      return state;
  }
}

export function configureStore() {
  const epicMiddleware = createEpicMiddleware(rootEpic);
  const store = createStore(reducer, applyMiddleware(epicMiddleware));
  return store;
}