import { combineEpics } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import {
  addPullRequestReview,
  submitPullRequestReview,
} from '../lib/Github';

export const ADD_REVIEW_SUCCESS = 'REVIEW_ADDED';
const ADD_REVIEW = 'ADD_REVIEW';
const ADD_REVIEW_ERROR = 'ADD_REVIEW_ERROR';
const SUBMIT_REVIEW = 'SUBMIT_REVIEW';
const SUBMIT_REVIEW_ERROR = 'SUBMIT_REVIEW_ERROR';
const SUBMIT_REVIEW_SUCCESS = 'SUBMIT_REVIEW_SUCCESS';

export function submitReview({ event }) {
  return { type: SUBMIT_REVIEW, payload: { event } };
}

export function addReview({ event }) {
  return { type: ADD_REVIEW, payload: { event } };
}

const addReviewEpic = (action$, store) =>
  action$.ofType(ADD_REVIEW).mergeMap(action => {
    const state = store.getState();
    return addPullRequestReview(state.pullRequest.node_id, state.pullRequest.head.sha, action.payload.event)
      .map(review => ({
        type: ADD_REVIEW_SUCCESS,
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

export const reviewEpic = combineEpics(
  addReviewEpic,
  submitReviewEpic,
);

export default function reviewReducer(state, action) {
  switch (action.type) {
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
    
    case ADD_REVIEW_SUCCESS:
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
        comments: state.comments.concat(state.pendingComments),
        pendingComments: [],
      };
    
    default:
      return state;
  }
}