import { of, zip, concat, merge, EMPTY } from 'rxjs';
import { switchMap, catchError, takeUntil, map } from 'rxjs/operators';
import { ActionsObservable } from 'redux-observable';
import { apollo, getPullRequestAsDiff } from '../lib/Github';
import { getUserInfo, isAuthenticated } from '../lib/GithubAuth';
import { observeReviewStates } from '../lib/Database';
import { parseDiff } from '../lib/DiffParser';
import getInitialState from './getInitialState';
import { AppState } from './types';
import { fetchReviewThreads } from './CommentStore';
import gql from 'graphql-tag';
import { pullRequestReviewFragment } from './GithubFragments';
import { PullRequestQuery, PullRequestQueryVariables } from './__generated__/PullRequestQuery';
import { ApolloError } from '@apollo/client';
import { PullRequestReviewState } from '../__generated__/globalTypes';

const FETCH = 'FETCH';
const FETCH_CANCEL = 'FETCH_CANCEL';
const FETCH_ERROR = 'FETCH_ERROR';
const FETCH_SUCCESS = 'FETCH_SUCCESS';

const REVIEW_STATES_CHANGED = 'REVIEW_STATES_CHANGED';

type FetchAction = {
  type: 'FETCH';
  payload: {
    owner: string;
    repo: string;
    number: number;
  };
};

export type PullRequestAction =
  FetchAction |
  { type: 'FETCH_CANCEL'; } |
  { type: 'FETCH_ERROR'; payload: { status: 404 }; } |
  { type: 'FETCH_SUCCESS'; payload: Pick<AppState, 'pullRequest' | 'files' | 'pendingCommentCount' | 'reviewOpinion' | 'hasPendingReview' | 'isLoadingReviewStates'>; } |
  { type: 'REVIEW_STATES_CHANGED'; payload: {[fileId: string]: boolean}; }
  ;

export function fetch({ owner, repo, number }: FetchAction['payload']): PullRequestAction {
  return { type: 'FETCH', payload: { owner, repo, number } };
}

export function fetchCancel(): PullRequestAction {
  return { type: 'FETCH_CANCEL' };
}

export const pullRequestQuery = gql`
  ${pullRequestReviewFragment}
  query PullRequestQuery($owner: String!, $repo: String!, $number: Int!, $author: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        databaseId
        id
        url
        baseRefOid
        headRefOid
        opinionatedReviews: reviews(last: 1, states: [APPROVED, CHANGES_REQUESTED, DISMISSED], author: $author) {
          nodes {
            ...PullRequestReviewFragment
          }
        }
        pendingReviews: reviews(last: 1, states: [PENDING]) {
          nodes {
            ...PullRequestReviewFragment
            comments {
              totalCount
            }
          }
        }
      }
    }
  }
`;

export const pullRequestEpic = (action$: ActionsObservable<PullRequestAction>) =>
  action$.ofType<FetchAction>(FETCH).pipe(switchMap(action =>
    zip(
      getPullRequestAsDiff(action.payload.owner, action.payload.repo, action.payload.number),
      apollo.query<PullRequestQuery, PullRequestQueryVariables>({
        query: pullRequestQuery,
        variables: {
          owner: action.payload.owner,
          repo: action.payload.repo,
          number: action.payload.number,
          author: getUserInfo()?.login ?? '',
        },
        fetchPolicy: 'no-cache',
      }).catch((error: ApolloError) => {
        if (error.graphQLErrors.some(e => (e as any).type === 'NOT_FOUND')) {
          // eslint-disable-next-line no-throw-literal
          throw { status: 404 }; // XXX
        }
        throw error;
      })
    ).pipe(
    switchMap(([ diff, result ]) => {
      const pullRequest = result.data?.repository?.pullRequest!;
      const authenticated = isAuthenticated();
      const opinionatedReview = pullRequest.opinionatedReviews?.nodes?.[0] ?? null;
      const pendingReview = pullRequest.pendingReviews?.nodes?.[0] ?? null;
      const success$ = of<PullRequestAction>({
        type: FETCH_SUCCESS,
        payload: {
          pullRequest,
          files: parseDiff(diff),
          reviewOpinion: opinionatedReview?.state === PullRequestReviewState.APPROVED ?
            'approved'
            : opinionatedReview?.state === PullRequestReviewState.CHANGES_REQUESTED ?
              'changesRequested'
              : 'none',
          hasPendingReview: Boolean(pendingReview),
          pendingCommentCount: pendingReview?.comments?.totalCount ?? 0,
          isLoadingReviewStates: authenticated,
        },
      });
      const comments$ = of(fetchReviewThreads());

      const reviewStates$ = authenticated ?
        observeReviewStates(pullRequest.databaseId?.toString() ?? pullRequest.id)
          .pipe(map(reviewStates =>
            ({ type: REVIEW_STATES_CHANGED, payload: reviewStates || {} }))) :
        EMPTY;
      
      return concat(success$, merge(comments$, reviewStates$));
    }),
    catchError(error => {
      console.error(error);
      return of({ type: FETCH_ERROR, payload: error });
    }),
    takeUntil(action$.ofType(FETCH_CANCEL))
  )));

export default function pullRequestReducer(state: AppState, action: PullRequestAction): AppState {
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
