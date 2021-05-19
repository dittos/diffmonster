import { of, zip, concat, merge, EMPTY } from 'rxjs';
import { switchMap, catchError, takeUntil, map } from 'rxjs/operators';
import { ActionsObservable } from 'redux-observable';
import {
  getPullRequestAsDiff,
  PullRequestReviewDTO,
  apollo,
  PullRequestDTO,
} from '../lib/Github';
import { isAuthenticated, getUserInfo } from '../lib/GithubAuth';
import { observeReviewStates } from '../lib/Database';
import { parseDiff, DiffFile } from '../lib/DiffParser';
import getInitialState, { AppState } from './getInitialState';
import { fetchReviewThreads } from './CommentStore';
import gql from 'graphql-tag';
import { pullRequestReviewFragment } from '../lib/GithubFragments';
import { PullRequestQuery, PullRequestQueryVariables } from './__generated__/PullRequestQuery';
import { ApolloError } from '@apollo/client';
import { headerPullRequestFragment } from '../ui/Header';

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
  { type: 'FETCH_SUCCESS'; payload: {
    pullRequest: PullRequestDTO;
    files: DiffFile[];
    latestReview: PullRequestReviewDTO | null;
    isLoadingReviewStates: boolean;
  }; } |
  { type: 'REVIEW_STATES_CHANGED'; payload: {[fileId: string]: boolean}; }
  ;

export function fetch({ owner, repo, number }: FetchAction['payload']): PullRequestAction {
  return { type: 'FETCH', payload: { owner, repo, number } };
}

export function fetchCancel(): PullRequestAction {
  return { type: 'FETCH_CANCEL' };
}

const pullRequestQuery = gql`
  ${pullRequestReviewFragment}
  ${headerPullRequestFragment}
  query PullRequestQuery($owner: String!, $repo: String!, $number: Int!, $author: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        databaseId
        id
        number
        url
        title
        bodyHTML
        state
        merged
        baseRefName
        baseRefOid
        baseRepository {
          nameWithOwner
          owner { login }
        }
        headRefName
        headRefOid
        headRepository {
          url
          owner { login }
        }
        ...HeaderPullRequestFragment
        reviews(last: 1, author: $author) {
          nodes {
            ...PullRequestReviewFragment
          }
        }
        pendingReviews: reviews(last: 1, author: $author, states: [PENDING]) {
          nodes {
            ...PullRequestReviewFragment
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
      // FIXME: Pending review is always on the first of reviews connection
      const latestReview = pullRequest.pendingReviews?.nodes?.[0] ?? pullRequest.reviews?.nodes?.[0] ?? null;
      const success$ = of<PullRequestAction>({
        type: FETCH_SUCCESS,
        payload: {
          pullRequest,
          files: parseDiff(diff),
          latestReview,
          isLoadingReviewStates: authenticated,
        },
      });
      const comments$ = of(fetchReviewThreads());

      const reviewStates$ = authenticated ?
        observeReviewStates(pullRequest.databaseId!) // FIXME
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
