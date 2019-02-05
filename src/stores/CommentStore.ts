import { combineEpics, ActionsObservable } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import {
  addPullRequestReviewCommentOnReview,
  addPullRequestReview,
  deletePullRequestReviewComment,
  PullRequestReviewState,
  PullRequestReviewEvent,
  editPullRequestReviewComment,
  editPullRequestReviewCommentViaGraphQL,
  PullRequestCommentDTO,
} from '../lib/Github';
import { ADD_REVIEW_SUCCESS } from './ReviewStore';
import { Subject } from 'rxjs/Subject';
import { Store } from 'redux';
import { PullRequestLoadedState } from './getInitialState';

export const COMMENTS_FETCHED = 'COMMENTS_FETCHED';
export const PENDING_COMMENTS_FETCHED = 'PENDING_COMMENTS_FETCHED';

const ADD_SINGLE_COMMENT = 'ADD_SINGLE_COMMENT';
const ADD_SINGLE_COMMENT_SUCCESS = 'ADD_SINGLE_COMMENT_SUCCESS';
const ADD_SINGLE_COMMENT_ERROR = 'ADD_SINGLE_COMMENT_ERROR';
const ADD_REVIEW_COMMENT = 'ADD_REVIEW_COMMENT';
const ADD_REVIEW_COMMENT_SUCCESS = 'ADD_REVIEW_COMMENT_SUCCESS';
const ADD_REVIEW_COMMENT_ERROR = 'ADD_REVIEW_COMMENT_ERROR';
const DELETE_COMMENT = 'DELETE_COMMENT';
const DELETE_COMMENT_SUCCESS = 'DELETE_COMMENT_SUCCESS';
const DELETE_COMMENT_ERROR = 'DELETE_COMMENT_ERROR';
const EDIT_COMMENT = 'EDIT_COMMENT';
const EDIT_COMMENT_SUCCESS = 'EDIT_COMMENT_SUCCESS';
const EDIT_COMMENT_ERROR = 'EDIT_COMMENT_ERROR';

export interface AddCommentActionPayload {
  body: string;
  position: number;
  path: string;
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
  { type: 'COMMENTS_FETCHED'; payload: PullRequestCommentDTO[]; } |
  { type: 'PENDING_COMMENTS_FETCHED'; payload: PullRequestCommentDTO[]; } |
  AddSingleCommentAction |
  { type: 'ADD_SINGLE_COMMENT_SUCCESS'; payload: PullRequestCommentDTO; } |
  { type: 'ADD_SINGLE_COMMENT_ERROR'; } |
  AddReviewCommentAction |
  { type: 'ADD_REVIEW_COMMENT_SUCCESS'; payload: PullRequestCommentDTO; } |
  { type: 'ADD_REVIEW_COMMENT_ERROR'; } |
  DeleteCommentAction |
  { type: 'DELETE_COMMENT_SUCCESS'; payload: number; } |
  { type: 'DELETE_COMMENT_ERROR'; } |
  EditCommentAction |
  { type: 'EDIT_COMMENT_SUCCESS'; payload: PullRequestCommentDTO; } |
  { type: 'EDIT_COMMENT_ERROR'; }
  ;

export function addSingleComment({ body, position, path }: AddSingleCommentAction['payload'], subject: Subject<void>): AddSingleCommentAction {
  return { type: ADD_SINGLE_COMMENT, payload: { body, position, path }, meta: { subject } };
}

export function addReviewComment({ body, position, path }: AddReviewCommentAction['payload'], subject: Subject<void>): AddReviewCommentAction {
  return { type: ADD_REVIEW_COMMENT, payload: { body, position, path }, meta: { subject } };
}

export function deleteComment(comment: DeleteCommentAction['payload']): DeleteCommentAction {
  return { type: DELETE_COMMENT, payload: comment };
}

export function editComment(comment: PullRequestCommentDTO, body: string, subject: Subject<any>): EditCommentAction {
  return { type: EDIT_COMMENT, payload: { comment, body }, meta: { subject } };
}

const addSingleCommentEpic = (action$: ActionsObservable<CommentAction>, store: Store<PullRequestLoadedState>) =>
  action$.ofType<AddSingleCommentAction>('ADD_SINGLE_COMMENT').mergeMap(action => {
    const { pullRequest } = store.getState();
    const { body, position, path } = action.payload;

    return addPullRequestReview(pullRequest.node_id, pullRequest.head.sha, PullRequestReviewEvent.COMMENT, [{
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
        payload: comments!.nodes[0],
      }))
      .catch(error => Observable.of({
        type: ADD_SINGLE_COMMENT_ERROR,
        payload: error,
      }));
  });

const addReviewCommentEpic = (action$: ActionsObservable<CommentAction>, store: Store<PullRequestLoadedState>) =>
  action$.ofType<AddReviewCommentAction>('ADD_REVIEW_COMMENT').mergeMap(action => {
    const { latestReview, pullRequest } = store.getState();
    const { body, position, path } = action.payload;

    if (latestReview && latestReview.state === PullRequestReviewState.PENDING) {
      return addPullRequestReviewCommentOnReview(
        latestReview.id,
        pullRequest!.head.sha,
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
      return addPullRequestReview(pullRequest.node_id, pullRequest.head.sha, PullRequestReviewEvent.PENDING, [{
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
          payload: comments!.nodes[0],
        }))
        .catch(error => Observable.of({
          type: ADD_REVIEW_COMMENT_ERROR,
          payload: error,
        }));
    }
  });

const deleteCommentEpic = (action$: ActionsObservable<CommentAction>, store: Store<PullRequestLoadedState>) =>
  action$.ofType<DeleteCommentAction>('DELETE_COMMENT').mergeMap(action => {
    const comment = action.payload;
    const { pullRequest } = store.getState();
    return deletePullRequestReviewComment(pullRequest, comment.id)
      .map(() => ({
        type: DELETE_COMMENT_SUCCESS,
        payload: comment.id,
      }))
      .catch(error => Observable.of({
        type: DELETE_COMMENT_ERROR,
        payload: error,
      }));
  });

const editCommentEpic = (action$: ActionsObservable<CommentAction>, store: Store<PullRequestLoadedState>) =>
  action$.ofType<EditCommentAction>('EDIT_COMMENT').mergeMap(action => {
    const { comment, body } = action.payload;
    const call$ = comment.node_id ?
      editPullRequestReviewCommentViaGraphQL(comment.node_id, { body }) :
      editPullRequestReviewComment(store.getState().pullRequest, comment.id, { body });
    return call$.do(action.meta.subject)
      .map(updatedComment => ({
        type: EDIT_COMMENT_SUCCESS,
        payload: updatedComment,
      }))
      .catch(error => Observable.of({
        type: EDIT_COMMENT_ERROR,
        payload: error,
      }));
  });

export const commentEpic = combineEpics(
  addSingleCommentEpic,
  addReviewCommentEpic,
  deleteCommentEpic,
  editCommentEpic,
);

export default function commentsReducer(state: PullRequestLoadedState, action: CommentAction): PullRequestLoadedState {
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
    
    case DELETE_COMMENT_SUCCESS: {
      const pendingComments = state.pendingComments.filter(c => c.id !== action.payload);
      return {
        ...state,
        comments: state.comments.filter(c => c.id !== action.payload),
        pendingComments,
        // FIXME: should go into ReviewStore?
        latestReview: pendingComments.length === 0 ? null : state.latestReview,
      };
    }
    
    case EDIT_COMMENT_SUCCESS:
      return {
        ...state,
        comments: state.comments.map(c => c.id === action.payload.id ? action.payload : c),
        pendingComments: state.pendingComments.map(c => c.id === action.payload.id ? action.payload : c),
      };

    default:
      return state;
  }
}