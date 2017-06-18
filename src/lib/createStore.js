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
  graphql,
  getPullRequestAsDiff,
  getPullRequestReviews,
  getPullRequestComments,
  getPullRequestReviewComments,
} from './Github';
import { isAuthenticated, getUserInfo } from './GithubAuth';
import { observeReviewStates } from './Database';
import { parseDiff } from './DiffParser';

function getLatestReviewAndPendingComments(owner, repo, id) {
  const currentUser = getUserInfo();
  if (!currentUser)
    return Observable.of({ latestReview: null });

  return getPullRequestReviews(owner, repo, id)
    .switchMap(reviews => {
      let latestReview = null;
      for (const review of reviews) {
        if (!review.viewerDidAuthor)
          continue;
        if (!latestReview || new Date(latestReview.createdAt) < new Date(review.createdAt))
          latestReview = review;
      }
      if (!latestReview || latestReview.state !== 'PENDING')
        return Observable.of({ latestReview });
      
      // Load comments only if state is PENDING
      return getPullRequestReviewComments(owner, repo, id, latestReview.databaseId)
        .map(comments => ({
          latestReview,
          pendingComments: comments,
        }));
    });
}

const fetchEpic = action$ =>
  action$.ofType('FETCH').switchMap(action =>
    Observable.zip(
      graphql(`
        query($owner: String!, $repo: String!, $id: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $id) {
              id
              number
              url
              title
              bodyHTML
              repository { nameWithOwner, owner { login } }
              state
              author { login, url }
              headRefName
              headRef { name, target { oid } }
              headRepository {
                url
                owner { login }
              }
              baseRefName
            }
          }
        }
      `, {
        owner: action.payload.owner,
        repo: action.payload.repo,
        id: Number(action.payload.id),
      }).map(data => data.repository.pullRequest),
      getPullRequestAsDiff(action.payload.owner, action.payload.repo, action.payload.id),
      getLatestReviewAndPendingComments(action.payload.owner, action.payload.repo, Number(action.payload.id)),
    )
    .switchMap(([ pullRequest, diff, { latestReview, pendingComments } ]) => {
      const authenticated = isAuthenticated();
      const success$ = Observable.of(({
        type: 'FETCH_SUCCESS',
        payload: {
          pullRequest,
          files: parseDiff(diff),
          latestReview,
          pendingComments,
          isLoadingReviewStates: authenticated,
        },
      }));

      const comments$ = getPullRequestComments(pullRequest.id)
        .map(comments => ({ type: 'COMMENTS_FETCHED', payload: comments }));

      const reviewStates$ = authenticated ?
        observeReviewStates(pullRequest.id)
          .map(reviewStates =>
            ({ type: 'REVIEW_STATES_CHANGED', payload: reviewStates || {} })) :
        Observable.empty();
      
      return Observable.concat(success$, comments$.merge(reviewStates$));
    })
  )
  .catch(error => {
    console.error(error);
    return Observable.of({ type: 'FETCH_ERROR', payload: error });
  });

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
    latestReview: null,
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

    case 'FETCH_SUCCESS': {
      const pendingComments = action.payload.pendingComments || [];
      delete action.payload.pendingComments;
      return {
        ...state,
        ...action.payload,
        status: 'success',
        comments: pendingComments.map(c => ({ ...c, isPending: true })),
      };
    }

    case 'COMMENTS_FETCHED':
      return {
        ...state,
        comments: state.comments.concat(action.payload),
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