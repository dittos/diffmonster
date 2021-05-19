import { combineEpics, ActionsObservable, StateObservable } from 'redux-observable';
import { Subject, of, from, Observable } from 'rxjs';
import { mergeMap, tap, catchError, map, filter, exhaustMap } from 'rxjs/operators';
import {
  PullRequestCommentDTO,
  PullRequestReviewThreadDTO,
  apollo,
  PullRequestReviewDTO,
  PullRequestDTO,
} from '../lib/Github';
import { ADD_REVIEW_SUCCESS } from './ReviewStore';
import { PullRequestLoadedState } from './getInitialState';
import { addCommentMutation, addReplyCommentMutation, deleteCommentMutation, editCommentMutation } from '../lib/GithubMutations';
import { AddComment, AddCommentVariables } from '../lib/__generated__/AddComment';
import { DiffSide, PullRequestReviewCommentState, PullRequestReviewEvent, PullRequestReviewState } from '../__generated__/globalTypes';
import { AddReplyComment, AddReplyCommentVariables } from '../lib/__generated__/AddReplyComment';
import { EditComment, EditCommentVariables } from '../lib/__generated__/EditComment';
import { DeleteComment, DeleteCommentVariables } from '../lib/__generated__/DeleteComment';
import { gql } from '@apollo/client';
import { pullRequestReviewThreadFragment } from '../lib/GithubFragments';
import { ReviewThreadQuery, ReviewThreadQueryVariables } from './__generated__/ReviewThreadQuery';

const FETCH_REVIEW_THREADS = 'FETCH_REVIEW_THREADS';
const REVIEW_THREADS_FETCHED = 'REVIEW_THREADS_FETCHED';
const ADD_SINGLE_COMMENT = 'ADD_SINGLE_COMMENT';
const ADD_SINGLE_COMMENT_SUCCESS = 'ADD_SINGLE_COMMENT_SUCCESS';
const ADD_SINGLE_COMMENT_REPLY_SUCCESS = 'ADD_SINGLE_COMMENT_REPLY_SUCCESS';
const ADD_SINGLE_COMMENT_ERROR = 'ADD_SINGLE_COMMENT_ERROR';
const ADD_REVIEW_COMMENT = 'ADD_REVIEW_COMMENT';
const ADD_REVIEW_COMMENT_SUCCESS = 'ADD_REVIEW_COMMENT_SUCCESS';
const ADD_REVIEW_COMMENT_REPLY_SUCCESS = 'ADD_REVIEW_COMMENT_REPLY_SUCCESS';
const ADD_REVIEW_COMMENT_ERROR = 'ADD_REVIEW_COMMENT_ERROR';
const DELETE_COMMENT = 'DELETE_COMMENT';
const DELETE_COMMENT_SUCCESS = 'DELETE_COMMENT_SUCCESS';
const DELETE_COMMENT_ERROR = 'DELETE_COMMENT_ERROR';
const EDIT_COMMENT = 'EDIT_COMMENT';
const EDIT_COMMENT_SUCCESS = 'EDIT_COMMENT_SUCCESS';
const EDIT_COMMENT_ERROR = 'EDIT_COMMENT_ERROR';

export type FetchReviewThreadsAction = {
  type: 'FETCH_REVIEW_THREADS';
};

export type ReviewThreadsFetchedAction = {
  type: 'REVIEW_THREADS_FETCHED';
  payload: PullRequestReviewThreadDTO[];
};

export type CommentPosition = {
  position: number;
  line: number;
  side: 'LEFT' | 'RIGHT';
};

export interface AddCommentActionPayload {
  body: string;
  position: CommentPosition;
  path: string;
  replyContext?: {
    thread: PullRequestReviewThreadDTO;
    comment: PullRequestCommentDTO;
  };
}

type AddSingleCommentAction = {
  type: 'ADD_SINGLE_COMMENT';
  payload: AddCommentActionPayload;
  meta: { subject: Subject<any>; };
};

type AddReviewCommentAction = {
  type: 'ADD_REVIEW_COMMENT';
  payload: AddCommentActionPayload;
  meta: { subject: Subject<any>; };
};

export type AddCommentAction = AddSingleCommentAction | AddReviewCommentAction;

type DeleteCommentAction = {
  type: 'DELETE_COMMENT';
  payload: PullRequestCommentDTO;
};

type EditCommentAction = {
  type: 'EDIT_COMMENT';
  payload: { comment: PullRequestCommentDTO; body: string; };
  meta: { subject: Subject<any>; };
};

export type CommentAction =
  FetchReviewThreadsAction |
  ReviewThreadsFetchedAction |
  AddSingleCommentAction |
  { type: 'ADD_SINGLE_COMMENT_SUCCESS'; payload: { thread: PullRequestReviewThreadDTO; }; } |
  { type: 'ADD_SINGLE_COMMENT_REPLY_SUCCESS'; payload: { threadId: string; comment: PullRequestCommentDTO; }; } |
  { type: 'ADD_SINGLE_COMMENT_ERROR'; } |
  AddReviewCommentAction |
  { type: 'ADD_REVIEW_COMMENT_SUCCESS'; payload: { thread: PullRequestReviewThreadDTO; }; } |
  { type: 'ADD_REVIEW_COMMENT_REPLY_SUCCESS'; payload: { threadId: string; comment: PullRequestCommentDTO; }; } |
  { type: 'ADD_REVIEW_COMMENT_ERROR'; } |
  DeleteCommentAction |
  { type: 'DELETE_COMMENT_SUCCESS'; payload: string; } |
  { type: 'DELETE_COMMENT_ERROR'; } |
  EditCommentAction |
  { type: 'EDIT_COMMENT_SUCCESS'; payload: PullRequestCommentDTO; } |
  { type: 'EDIT_COMMENT_ERROR'; }
  ;

export function fetchReviewThreads(): FetchReviewThreadsAction {
  return { type: FETCH_REVIEW_THREADS };
}

export function addSingleComment({ body, position, path, replyContext }: AddSingleCommentAction['payload'], subject: Subject<void>): AddSingleCommentAction {
  return { type: ADD_SINGLE_COMMENT, payload: { body, position, path, replyContext }, meta: { subject } };
}

export function addReviewComment({ body, position, path, replyContext }: AddReviewCommentAction['payload'], subject: Subject<void>): AddReviewCommentAction {
  return { type: ADD_REVIEW_COMMENT, payload: { body, position, path, replyContext }, meta: { subject } };
}

export function deleteComment(comment: DeleteCommentAction['payload']): DeleteCommentAction {
  return { type: DELETE_COMMENT, payload: comment };
}

export function editComment(comment: PullRequestCommentDTO, body: string, subject: Subject<any>): EditCommentAction {
  return { type: EDIT_COMMENT, payload: { comment, body }, meta: { subject } };
}

const fetchReviewThreadsEpic = (action$: ActionsObservable<CommentAction>, state$: StateObservable<PullRequestLoadedState>) =>
  action$.ofType<FetchReviewThreadsAction>('FETCH_REVIEW_THREADS').pipe(mergeMap(() => {
    const { pullRequest } = state$.value;
    return getPullRequestReviewThreads(pullRequest)
      .pipe(map(reviewThreads => (<ReviewThreadsFetchedAction>{ type: REVIEW_THREADS_FETCHED, payload: reviewThreads })));
  }));

const addSingleCommentEpic = (action$: ActionsObservable<CommentAction>, state$: StateObservable<PullRequestLoadedState>) =>
  action$.ofType<AddSingleCommentAction>('ADD_SINGLE_COMMENT').pipe(mergeMap(action => {
    const { pullRequest } = state$.value;
    const { body, position, path, replyContext } = action.payload;

    if (replyContext) {
      return replyComment(
        pullRequest.id,
        pullRequest.headRefOid,
        null,
        replyContext.comment.id,
        body,
        position,
        path,
        true
      ).pipe(
        tap(action.meta.subject),
        mergeMap(({ comment, review }) => of({
          type: ADD_REVIEW_SUCCESS,
          payload: review,
        }, <CommentAction>{
          type: ADD_SINGLE_COMMENT_REPLY_SUCCESS,
          payload: { threadId: replyContext.thread.id, comment },
        })),
        catchError(error => of({
          type: ADD_SINGLE_COMMENT_ERROR,
          payload: error,
        }))
      );
    }

    return createComment(
      pullRequest.id,
      null,
      body,
      position,
      path,
      true
    ).pipe(
      tap(action.meta.subject),
      mergeMap(({ thread, review }) => of({
        type: ADD_REVIEW_SUCCESS,
        payload: review,
      }, <CommentAction>{
        type: ADD_SINGLE_COMMENT_SUCCESS,
        payload: { thread },
      })),
      catchError(error => of({
        type: ADD_SINGLE_COMMENT_ERROR,
        payload: error,
      }))
    );
  }));

const addReviewCommentEpic = (action$: ActionsObservable<CommentAction>, state$: StateObservable<PullRequestLoadedState>) =>
  action$.ofType<AddReviewCommentAction>('ADD_REVIEW_COMMENT').pipe(mergeMap(action => {
    const { latestReview, pullRequest } = state$.value;
    const { body, position, path, replyContext } = action.payload;
    const latestReviewId = latestReview && latestReview.state === PullRequestReviewState.PENDING ? latestReview.id : null;

    if (replyContext) {
      return replyComment(
        pullRequest.id,
        pullRequest.headRefOid,
        latestReviewId,
        replyContext.comment.id,
        body,
        position,
        path,
        false
      ).pipe(
        tap(action.meta.subject),
        mergeMap(({ comment, review }) => of(!latestReviewId ? {
          type: ADD_REVIEW_SUCCESS,
          payload: review,
        } : null, <CommentAction>{
          type: ADD_REVIEW_COMMENT_REPLY_SUCCESS,
          payload: { threadId: replyContext.thread.id, comment },
        }).pipe(filter(it => it != null))),
        catchError(error => of({
          type: ADD_REVIEW_COMMENT_ERROR,
          payload: error,
        }))
      );
    }

    return createComment(
      pullRequest.id,
      latestReviewId,
      body,
      position,
      path,
      false
    ).pipe(
      tap(action.meta.subject),
      mergeMap(({ thread, review }) => of(!latestReviewId ? {
        type: ADD_REVIEW_SUCCESS,
        payload: review,
      } : null, <CommentAction>{
        type: ADD_REVIEW_COMMENT_SUCCESS,
        payload: { thread },
      }).pipe(filter(it => it != null))),
      catchError(error => of({
        type: ADD_REVIEW_COMMENT_ERROR,
        payload: error,
      }))
    );
  }));

// not reply, immediate : add review thread with first comment -> submit review
// reply, immediate : add comment -> submit review
// not reply, new pending review : add pending review -> add review thread with first comment
// reply, new pending review: add pending review -> add comment
// not reply, old pending review: add review thread with first comment
// reply, old pending review: add comment

function createComment(
  pullRequestId: string,
  pendingReviewId: string | null,

  body: string,
  position: CommentPosition,
  path: string,
  
  submitNow: boolean,
): Observable<{
  thread: PullRequestReviewThreadDTO;
  review: PullRequestReviewDTO;
}> {
  return from(apollo.mutate<AddComment, AddCommentVariables>({
    mutation: addCommentMutation,
    variables: {
      input: {
        body,
        line: position.line,
        side: position.side === 'LEFT' ? DiffSide.LEFT : DiffSide.RIGHT,
        path,
        pullRequestId,
        pullRequestReviewId: pendingReviewId,
      },
      submitNow,
      submitInput: {
        pullRequestId,
        event: PullRequestReviewEvent.COMMENT,
      },
    },
    fetchPolicy: 'no-cache',
  })).pipe(map(result => {
    const thread = result.data?.addPullRequestReviewThread?.thread!;
    const comment = thread?.comments?.nodes?.[0];
    if (comment && submitNow) comment.state = PullRequestReviewCommentState.SUBMITTED;
    const review = result.data?.submitPullRequestReview?.pullRequestReview ?? comment?.pullRequestReview!;
    return {thread, review};
  }));
}

function replyComment(
  pullRequestId: string,
  commitId: string,
  pendingReviewId: string | null,
  inReplyToCommentId: string,

  body: string,
  position: CommentPosition,
  path: string,
  
  submitNow: boolean,
): Observable<{
  comment: PullRequestCommentDTO;
  review: PullRequestReviewDTO;
}> {
  return from(apollo.mutate<AddReplyComment, AddReplyCommentVariables>({
    mutation: addReplyCommentMutation,
    variables: {
      input: {
        pullRequestId,
        commitOID: commitId,
        body,
        path,
        position: position.position,
        inReplyTo: inReplyToCommentId,
        pullRequestReviewId: pendingReviewId,
      },
      submitNow,
      submitInput: {
        pullRequestId,
        event: PullRequestReviewEvent.COMMENT,
      },
    },
    fetchPolicy: 'no-cache',
  })).pipe(map(result => {
    const comment = result.data?.addPullRequestReviewComment?.comment!
    if (submitNow) comment.state = PullRequestReviewCommentState.SUBMITTED;
    const review = result.data?.submitPullRequestReview?.pullRequestReview ?? comment.pullRequestReview!;
    return {comment, review};
  }));
}  

const deleteCommentEpic = (action$: ActionsObservable<CommentAction>, state$: StateObservable<PullRequestLoadedState>) =>
  action$.ofType<DeleteCommentAction>('DELETE_COMMENT').pipe(mergeMap(action => {
    const comment = action.payload;
    return from(apollo.mutate<DeleteComment, DeleteCommentVariables>({
      mutation: deleteCommentMutation,
      variables: {
        commentId: comment.id,
      },
      fetchPolicy: 'no-cache',
    })).pipe(
      map(() => ({
        type: DELETE_COMMENT_SUCCESS,
        payload: comment.id,
      })),
      catchError(error => of({
        type: DELETE_COMMENT_ERROR,
        payload: error,
      }))
    );
  }));

const editCommentEpic = (action$: ActionsObservable<CommentAction>, state$: StateObservable<PullRequestLoadedState>) =>
  action$.ofType<EditCommentAction>('EDIT_COMMENT').pipe(mergeMap(action => {
    const { comment, body } = action.payload;
    return from(apollo.mutate<EditComment, EditCommentVariables>({
      mutation: editCommentMutation,
      variables: {
        commentId: comment.id,
        body,
      },
      fetchPolicy: 'no-cache',
    })).pipe(
      tap(action.meta.subject),
      map(result => ({
        type: EDIT_COMMENT_SUCCESS,
        payload: result.data?.updatePullRequestReviewComment?.pullRequestReviewComment,
      })),
      catchError(error => of({
        type: EDIT_COMMENT_ERROR,
        payload: error,
      }))
    );
  }));

export const commentEpic = combineEpics(
  fetchReviewThreadsEpic,
  addSingleCommentEpic,
  addReviewCommentEpic,
  deleteCommentEpic,
  editCommentEpic,
);

function addCommentToReviewThread(
  threads: PullRequestReviewThreadDTO[],
  threadId: string | null,
  comment: PullRequestCommentDTO
): PullRequestReviewThreadDTO[] {
  return threads.map(thread => thread.id === threadId ? {
    ...thread,
    comments: thread.comments && {
      ...thread.comments,
      nodes: thread.comments!.nodes!.concat(comment),
    },
  } : thread);
}

export default function commentsReducer(state: PullRequestLoadedState, action: CommentAction): PullRequestLoadedState {
  switch (action.type) {
    case REVIEW_THREADS_FETCHED:
      return {
        ...state,
        reviewThreads: action.payload,
      };
      
    case ADD_SINGLE_COMMENT_SUCCESS:
      return {
        ...state,
        reviewThreads: state.reviewThreads.concat(action.payload.thread),
      };
      
    case ADD_SINGLE_COMMENT_REPLY_SUCCESS:
      return {
        ...state,
        reviewThreads: addCommentToReviewThread(state.reviewThreads, action.payload.threadId, action.payload.comment),
      };
    
    case ADD_REVIEW_COMMENT:
      return {
        ...state,
        isAddingReview: true,
      };
    
    case ADD_REVIEW_COMMENT_SUCCESS:
      return {
        ...state,
        reviewThreads: state.reviewThreads.concat(action.payload.thread),
        isAddingReview: false,
      };
    
    case ADD_REVIEW_COMMENT_REPLY_SUCCESS:
      return {
        ...state,
        reviewThreads: addCommentToReviewThread(state.reviewThreads, action.payload.threadId, action.payload.comment),
        isAddingReview: false,
      };
    
    case ADD_REVIEW_COMMENT_ERROR:
      return {
        ...state,
        isAddingReview: false,
      };
    
    case DELETE_COMMENT_SUCCESS: {
      const reviewThreads = state.reviewThreads.map(thread => ({
        ...thread,
        comments: thread.comments && {
          ...thread.comments,
          nodes: thread.comments.nodes!.filter(c => c!.id !== action.payload)
        }
      }));
      const hasPendingComments = reviewThreads.some(thread =>
        !!thread.comments && thread.comments.nodes.some(c => c!.state === 'PENDING'));
      return {
        ...state,
        reviewThreads,
        // FIXME: should go into ReviewStore?
        latestReview: hasPendingComments ? state.latestReview : null,
      };
    }
    
    case EDIT_COMMENT_SUCCESS:
      return {
        ...state,
        reviewThreads: state.reviewThreads.map(thread => ({
          ...thread,
          comments: thread.comments && {
            ...thread.comments,
            nodes: thread.comments.nodes!.map(c => c!.id === action.payload.id ? action.payload : c)
          }
        })),
      };

    default:
      return state;
  }
}

const reviewThreadQuery = gql`
  ${pullRequestReviewThreadFragment}
  query ReviewThreadQuery($pullRequestId: ID!, $startCursor: String) {
    node(id: $pullRequestId) {
      ... on PullRequest {
        reviewThreads(last: 100, before: $startCursor) {
          nodes {
            ...PullRequestReviewThreadFragment
          }
          pageInfo {
            hasPreviousPage
            startCursor
          }
        }
      }
    }
  }
`;

function getPullRequestReviewThreads(pullRequest: PullRequestDTO, startCursor: string | null = null): Observable<PullRequestReviewThreadDTO[]> {
  return from(apollo.query<ReviewThreadQuery, ReviewThreadQueryVariables>({
    query: reviewThreadQuery,
    variables: {
      pullRequestId: pullRequest.id,
      startCursor,
    },
    fetchPolicy: 'no-cache',
  }))
    .pipe(exhaustMap(resp => {
      if (resp.data.node?.__typename !== 'PullRequest') {
        return of([]);
      }
      const reviewThreads = resp.data.node.reviewThreads;
      if (reviewThreads.pageInfo.hasPreviousPage) {
        return getPullRequestReviewThreads(pullRequest, reviewThreads.pageInfo.startCursor)
          .pipe(map(result => result.concat(reviewThreads.nodes!.map(it => it!))));
      }
      return of(reviewThreads.nodes!.map(it => it!));
    }));
}
