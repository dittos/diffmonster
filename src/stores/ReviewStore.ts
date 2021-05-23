import { combineEpics, ActionsObservable, StateObservable } from 'redux-observable';
import { from, of } from 'rxjs';
import { mergeMap, catchError, map } from 'rxjs/operators';
import { apollo } from '../lib/Github';
import { approveMutation, submitReviewMutation } from './GithubMutations';
import { Approve, ApproveVariables } from './__generated__/Approve';
import { SubmitReview, SubmitReviewVariables } from './__generated__/SubmitReview';
import { PullRequestReviewCommentState, PullRequestReviewEvent } from '../__generated__/globalTypes';
import { PullRequestReviewDTO, PullRequestLoadedState } from './types';

export const ADD_REVIEW_SUCCESS = 'REVIEW_ADDED';
const APPROVE = 'APPROVE';
const APPROVE_ERROR = 'APPROVE_ERROR';
const SUBMIT_REVIEW = 'SUBMIT_REVIEW';
const SUBMIT_REVIEW_ERROR = 'SUBMIT_REVIEW_ERROR';
const SUBMIT_REVIEW_SUCCESS = 'SUBMIT_REVIEW_SUCCESS';

type ApproveAction = { type: 'APPROVE'; };
type SubmitReviewAction = { type: 'SUBMIT_REVIEW'; payload: { event: PullRequestReviewEvent } };

export type ReviewAction =
  ApproveAction |
  { type: 'APPROVE_ERROR'; } |
  { type: 'REVIEW_ADDED'; payload: PullRequestReviewDTO } |
  SubmitReviewAction |
  { type: 'SUBMIT_REVIEW_ERROR'; } |
  { type: 'SUBMIT_REVIEW_SUCCESS'; payload: PullRequestReviewDTO }
  ;

export function submitReview({ event }: SubmitReviewAction['payload']): SubmitReviewAction {
  return { type: SUBMIT_REVIEW, payload: { event } };
}

export function approve(): ApproveAction {
  return { type: APPROVE };
}

const approveEpic = (action$: ActionsObservable<ReviewAction>, state$: StateObservable<PullRequestLoadedState>) =>
  action$.ofType<ApproveAction>(APPROVE).pipe(mergeMap(action => {
    const state = state$.value;
    return from(apollo.mutate<Approve, ApproveVariables>({
      mutation: approveMutation,
      variables: {
        pullRequestId: state.pullRequest.id,
        commitOID: state.pullRequest.headRefOid,
      },
      fetchPolicy: 'no-cache',
    })).pipe(
      map(review => ({
        type: ADD_REVIEW_SUCCESS,
        payload: review.data?.addPullRequestReview?.pullRequestReview!,
      })),
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
          event: action.payload.event,
        }
      },
      fetchPolicy: 'no-cache',
    })).pipe(
      map(result => ({
        type: SUBMIT_REVIEW_SUCCESS,
        payload: result.data?.submitPullRequestReview?.pullRequestReview,
      })),
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
    
    case APPROVE_ERROR:
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