import { combineEpics, ActionsObservable, StateObservable } from 'redux-observable';
import { from, of } from 'rxjs';
import { mergeMap, catchError, map } from 'rxjs/operators';
import { apollo } from '../lib/Github';
import { approveMutation, submitReviewMutation } from './GithubMutations';
import { Approve, ApproveVariables } from './__generated__/Approve';
import { SubmitReview, SubmitReviewVariables } from './__generated__/SubmitReview';
import { PullRequestReviewCommentState, PullRequestReviewEvent } from '../__generated__/globalTypes';
import { PullRequestLoadedState } from './types';

export const ADD_PENDING_REVIEW_SUCCESS = 'ADD_PENDING_REVIEW_SUCCESS';
const APPROVE = 'APPROVE';
const APPROVE_SUCCESS = 'APPROVE_SUCCESS';
const APPROVE_ERROR = 'APPROVE_ERROR';
const SUBMIT_REVIEW = 'SUBMIT_REVIEW';
const SUBMIT_REVIEW_ERROR = 'SUBMIT_REVIEW_ERROR';
const SUBMIT_REVIEW_SUCCESS = 'SUBMIT_REVIEW_SUCCESS';

type ApproveAction = { type: 'APPROVE'; };
type SubmitReviewAction = { type: 'SUBMIT_REVIEW' };

export type ReviewAction =
  ApproveAction |
  { type: 'APPROVE_SUCCESS'; } |
  { type: 'APPROVE_ERROR'; } |
  { type: 'ADD_PENDING_REVIEW_SUCCESS'; } |
  SubmitReviewAction |
  { type: 'SUBMIT_REVIEW_ERROR'; } |
  { type: 'SUBMIT_REVIEW_SUCCESS'; }
  ;

export function submitReview(): SubmitReviewAction {
  return { type: SUBMIT_REVIEW };
}

export function approve(): ApproveAction {
  return { type: APPROVE };
}

const approveEpic = (action$: ActionsObservable<ReviewAction>, state$: StateObservable<PullRequestLoadedState>) =>
  action$.ofType<ApproveAction>(APPROVE).pipe(mergeMap(() => {
    const state = state$.value;
    return from(apollo.mutate<Approve, ApproveVariables>({
      mutation: approveMutation,
      variables: {
        pullRequestId: state.pullRequest.id,
        commitOID: state.pullRequest.headRefOid,
      },
      fetchPolicy: 'no-cache',
    })).pipe(
      map(() => ({ type: APPROVE_SUCCESS })),
      catchError(error => of({
        type: APPROVE_ERROR,
        payload: error,
      })));
  }));

const submitReviewEpic = (action$: ActionsObservable<ReviewAction>, state$: StateObservable<PullRequestLoadedState>) =>
  action$.ofType<SubmitReviewAction>('SUBMIT_REVIEW').pipe(mergeMap(action => {
    const state = state$.value;
    return from(apollo.mutate<SubmitReview, SubmitReviewVariables>({
      mutation: submitReviewMutation,
      variables: {
        input: {
          pullRequestId: state.pullRequest.id,
          event: PullRequestReviewEvent.COMMENT,
        }
      },
      fetchPolicy: 'no-cache',
    })).pipe(
      map(() => ({ type: SUBMIT_REVIEW_SUCCESS })),
      catchError(error => of({
        type: SUBMIT_REVIEW_ERROR,
        payload: error,
      })));
  }));

export const reviewEpic = combineEpics(
  approveEpic,
  submitReviewEpic,
);

export default function reviewReducer(state: PullRequestLoadedState, action: ReviewAction): PullRequestLoadedState {
  switch (action.type) {
    case APPROVE:
      return {
        ...state,
        isAddingReview: true,
      };
    
    case APPROVE_SUCCESS:
      return {
        ...state,
        reviewOpinion: 'approved',
        isAddingReview: false,
      };
    
    case APPROVE_ERROR:
      return {
        ...state,
        isAddingReview: false,
      };
    
    case ADD_PENDING_REVIEW_SUCCESS:
      return {
        ...state,
        hasPendingReview: true,
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
        hasPendingReview: false,
        isAddingReview: false,
        reviewThreads: state.reviewThreads.map(thread => ({
          ...thread,
          comments: thread.comments && {
            ...thread.comments,
            nodes: thread.comments.nodes!.map(c => c!.state === PullRequestReviewCommentState.PENDING ?
              { ...c!, state: PullRequestReviewCommentState.SUBMITTED } :
              c)
          }
        })),
      };
    
    default:
      return state;
  }
}