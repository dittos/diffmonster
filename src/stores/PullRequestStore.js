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
import marked from 'marked';
import {
  getPullRequest,
  getPullRequestAsDiff,
  getPullRequestComments,
  getPullRequestFromGraphQL,
  getPullRequestReviewComments,
  PullRequestReviewState,
  pullRequestReviewFragment,
} from '../lib/Github';
import { isAuthenticated, getUserInfo } from '../lib/GithubAuth';
import { observeReviewStates } from '../lib/Database';
import { parseDiff } from '../lib/DiffParser';
import getInitialState from './getInitialState';
import { COMMENTS_FETCHED, PENDING_COMMENTS_FETCHED } from './CommentStore';

const FETCH = 'FETCH';
const FETCH_CANCEL = 'FETCH_CANCEL';
const FETCH_ERROR = 'FETCH_ERROR';
const FETCH_SUCCESS = 'FETCH_SUCCESS';

const REVIEW_STATES_CHANGED = 'REVIEW_STATES_CHANGED';

export function fetch({ owner, repo, number }) {
  return { type: FETCH, payload: { owner, repo, number } };
}

export function fetchCancel() {
  return { type: FETCH_CANCEL };
}

export const pullRequestEpic = action$ =>
  action$.ofType(FETCH).switchMap(action =>
    Observable.zip(
      getPullRequest(action.payload.owner, action.payload.repo, action.payload.number),
      getPullRequestAsDiff(action.payload.owner, action.payload.repo, action.payload.number),
      getUserInfo() ?
        getPullRequestFromGraphQL(action.payload.owner, action.payload.repo, action.payload.number,
          getUserInfo().login, `
          id
          bodyHTML
          reviews(last: 1, author: $author) {
            nodes {
              ${pullRequestReviewFragment}
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
      let pullRequestBodyRendered;
      if (pullRequestFromGraphQL) {
        latestReview = pullRequestFromGraphQL.reviews.nodes[0];
        pullRequestBodyRendered = pullRequestFromGraphQL.bodyHTML;
      } else {
        pullRequestBodyRendered = marked(pullRequest.body, { gfm: true, sanitize: true });
      }
      const success$ = Observable.of(({
        type: FETCH_SUCCESS,
        payload: {
          pullRequest,
          pullRequestIdFromGraphQL: pullRequestFromGraphQL && pullRequestFromGraphQL.id,
          pullRequestBodyRendered,
          files: parseDiff(diff),
          latestReview,
          isLoadingReviewStates: authenticated,
        },
      }));

      let comments$ = getPullRequestComments(pullRequest)
        .map(comments => ({ type: COMMENTS_FETCHED, payload: comments }));
      if (latestReview && latestReview.state === PullRequestReviewState.PENDING) {
        comments$ = comments$.merge(
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

export default function pullRequestReducer(state, action) {
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
