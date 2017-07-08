import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import {
  addPullRequestReviewCommentOnReview,
  addPullRequestReview,
  PullRequestReviewState,
  PullRequestReviewEvent,
} from '../lib/Github';
import { ADD_REVIEW_SUCCESS } from './ReviewStore';

export const COMMENTS_FETCHED = 'COMMENTS_FETCHED';
export const PENDING_COMMENTS_FETCHED = 'PENDING_COMMENTS_FETCHED';

const ADD_SINGLE_COMMENT = 'ADD_SINGLE_COMMENT';
const ADD_SINGLE_COMMENT_SUCCESS = 'ADD_SINGLE_COMMENT_SUCCESS';
const ADD_SINGLE_COMMENT_ERROR = 'ADD_SINGLE_COMMENT_ERROR';
const ADD_REVIEW_COMMENT = 'ADD_REVIEW_COMMENT';
const ADD_REVIEW_COMMENT_SUCCESS = 'ADD_REVIEW_COMMENT_SUCCESS';
const ADD_REVIEW_COMMENT_ERROR = 'ADD_REVIEW_COMMENT_ERROR';

export function addSingleComment({ body, position, path }, subject) {
  return { type: ADD_SINGLE_COMMENT, payload: { body, position, path }, meta: { subject } };
}

export function addReviewComment({ body, position, path }, subject) {
  return { type: ADD_REVIEW_COMMENT, payload: { body, position, path }, meta: { subject } };
}

const addSingleCommentEpic = (action$, store) =>
  action$.ofType(ADD_SINGLE_COMMENT).mergeMap(action => {
    const { pullRequest, pullRequestIdFromGraphQL } = store.getState();
    const { body, position, path } = action.payload;

    return addPullRequestReview(pullRequestIdFromGraphQL, pullRequest.head.sha, PullRequestReviewEvent.COMMENT, [{
      body,
      position,
      path,
    }])
      .do(action.meta.subject)
      .mergeMap(({ comments, ...review }) => Observable.of({
        type: ADD_REVIEW_SUCCESS,
        payload: review,
      }, {
        type: ADD_SINGLE_COMMENT_SUCCESS,
        payload: comments.nodes[0],
      }))
      .catch(error => Observable.of({
        type: ADD_SINGLE_COMMENT_ERROR,
        payload: error,
      }));
  });

const addReviewCommentEpic = (action$, store) =>
  action$.ofType(ADD_REVIEW_COMMENT).mergeMap(action => {
    const { latestReview, pullRequest, pullRequestIdFromGraphQL } = store.getState();
    const { body, position, path } = action.payload;

    if (latestReview && latestReview.state === PullRequestReviewState.PENDING) {
      return addPullRequestReviewCommentOnReview(
        latestReview.id,
        pullRequest.head.sha,
        body,
        path,
        position
      )
        .do(action.meta.subject)
        .map(comment => ({
          type: ADD_REVIEW_COMMENT_SUCCESS,
          payload: comment,
        }))
        .catch(error => Observable.of({
          type: ADD_REVIEW_COMMENT_ERROR,
          payload: error,
        }));
    } else {
      return addPullRequestReview(pullRequestIdFromGraphQL, pullRequest.head.sha, PullRequestReviewEvent.PENDING, [{
        path,
        position,
        body,
      }])
        .do(action.meta.subject)
        .mergeMap(({ comments, ...review }) => Observable.of({
          type: ADD_REVIEW_SUCCESS,
          payload: review,
        }, {
          type: ADD_REVIEW_COMMENT_SUCCESS,
          payload: comments.nodes[0],
        }))
        .catch(error => Observable.of({
          type: ADD_REVIEW_COMMENT_ERROR,
          payload: error,
        }));
    }
  });

export const commentEpic = combineEpics(
  addSingleCommentEpic,
  addReviewCommentEpic,
);

export default function commentsReducer(state, action) {
  switch (action.type) {
    case COMMENTS_FETCHED:
      return {
        ...state,
        comments: action.payload,
      };

    case PENDING_COMMENTS_FETCHED:
      return {
        ...state,
        pendingComments: action.payload,
      };
      
    case ADD_SINGLE_COMMENT_SUCCESS:
      return {
        ...state,
        comments: state.comments.concat(action.payload),
      };
    
    case ADD_REVIEW_COMMENT:
      return {
        ...state,
        isAddingReview: true,
      };
    
    case ADD_REVIEW_COMMENT_SUCCESS:
      return {
        ...state,
        pendingComments: state.pendingComments.concat(action.payload),
        isAddingReview: false,
      };
    
    case ADD_REVIEW_COMMENT_ERROR:
      return {
        ...state,
        isAddingReview: false,
      };

    default:
      return state;
  }
}