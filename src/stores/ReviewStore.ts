import { combineEpics, ActionsObservable } from 'redux-observable';
import { Store } from 'redux';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import {
  addPullRequestReview,
  submitPullRequestReview,
  PullRequestReviewEventInput,
  PullRequestReviewDTO,
} from '../lib/Github';
import { PullRequestLoadedState } from './getInitialState';

export const ADD_REVIEW_SUCCESS = 'REVIEW_ADDED';
const ADD_REVIEW = 'ADD_REVIEW';
const ADD_REVIEW_ERROR = 'ADD_REVIEW_ERROR';
const SUBMIT_REVIEW = 'SUBMIT_REVIEW';
const SUBMIT_REVIEW_ERROR = 'SUBMIT_REVIEW_ERROR';
const SUBMIT_REVIEW_SUCCESS = 'SUBMIT_REVIEW_SUCCESS';

type AddReviewAction = { type: 'ADD_REVIEW'; payload: { event: PullRequestReviewEventInput } };
type SubmitReviewAction = { type: 'SUBMIT_REVIEW'; payload: { event: PullRequestReviewEventInput } };

export type ReviewAction =
  AddReviewAction |
  { type: 'ADD_REVIEW_ERROR'; } |
  { type: 'REVIEW_ADDED'; payload: PullRequestReviewDTO } |
  SubmitReviewAction |
  { type: 'SUBMIT_REVIEW_ERROR'; } |
  { type: 'SUBMIT_REVIEW_SUCCESS'; payload: PullRequestReviewDTO }
  ;

export function submitReview({ event }: SubmitReviewAction['payload']): SubmitReviewAction {
  return { type: SUBMIT_REVIEW, payload: { event } };
}

export function addReview({ event }: AddReviewAction['payload']): AddReviewAction {
  return { type: ADD_REVIEW, payload: { event } };
}

const addReviewEpic = (action$: ActionsObservable<ReviewAction>, store: Store<PullRequestLoadedState>) =>
  action$.ofType<AddReviewAction>('ADD_REVIEW').mergeMap(action => {
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

const submitReviewEpic = (action$: ActionsObservable<ReviewAction>, store: Store<PullRequestLoadedState>) =>
  action$.ofType<SubmitReviewAction>('SUBMIT_REVIEW').mergeMap(action => {
    const state = store.getState();
    return submitPullRequestReview(state.latestReview!.id, action.payload.event)
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

export default function reviewReducer(state: PullRequestLoadedState, action: ReviewAction): PullRequestLoadedState {
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