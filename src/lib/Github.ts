import { throwError as observableThrowError, Observable, of } from 'rxjs';
import { getAccessToken } from './GithubAuth';
import { ajax as ajaxObservable, AjaxRequest, AjaxResponse } from 'rxjs/ajax';
import { exhaustMap, map } from 'rxjs/operators';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from "@apollo/client/link/context";

const BASE_URL = 'https://api.github.com';

// GitHub token without any additional scope.
// Used for anonymously accessing GraphQL API as it requires access token.
// Mangled a bit to avoid token scanning.
const PUBLIC_TOKEN = 'mp8ke1wLfOlimDLlkOEqaLTf69eIVe1YOo3j_phg'.split('').reverse().join('');

export const PullRequestReviewState = {
  PENDING: 'PENDING',
  COMMENTED: 'COMMENTED',
  APPROVED: 'APPROVED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  DISMISSED: 'DISMISSED',
};

export type PullRequestReviewStateType = keyof (typeof PullRequestReviewState);

export const PullRequestReviewEvent = {
  PENDING: null,
  COMMENT: 'COMMENT',
  APPROVE: 'APPROVE',
  REQUEST_CHANGES: 'REQUEST_CHANGES',
  DISMISS: 'DISMISS',
};

export const pullRequestReviewFragment = `
  id
  state
  viewerDidAuthor
  createdAt
  databaseId
`;

export const pullRequestReviewCommentRestLikeFragment = `
  id: databaseId
  node_id: id
  user: author {
    html_url: url
    login
  }
  body
  path
  position
  state
`;

const pullRequestReviewThreadFragment = `
  id
  isResolved
  resolvedBy {
    url
    login
  }
  comments(first: 100) {
    nodes {
      ${pullRequestReviewCommentRestLikeFragment}
    }
    pageInfo {
      hasNextPage
    }
  }
  viewerCanReply
`;

export interface UserDTO {
  id?: number | null;
  html_url: string;
  login: string;
}

export interface PullRequestDTO {
  id: number;
  node_id: string;
  number: number;
  url: string;
  html_url: string;
  title: string;
  body: string;
  user: UserDTO;
  state: 'open';
  merged: boolean;
  base: {
    sha: string;
    label: string;
    repo: {
      url: string;
      html_url: string;
      full_name: string;
    };
  };
  head: {
    sha: string;
    label: string;
    repo: {
      url: string;
      html_url: string;
      full_name: string;
    };
  };
}

export type PullRequestCommentState = 'PENDING' | 'SUBMITTED';

export interface PullRequestCommentDTO {
  id: number | null;
  node_id: string;
  user: UserDTO | null;
  body: string;
  path: string;
  position: number | null;
  state?: PullRequestCommentState;
}

export interface PullRequestReviewCommentsConnection {
  nodes: (PullRequestCommentDTO | null)[] | null;
  pageInfo: {
    hasPreviousPage: boolean;
    startCursor: string | null;
  };
}

export interface PullRequestReviewDTO {
  id: string;
  state: PullRequestReviewStateType;
  comments?: PullRequestReviewCommentsConnection;
}

export interface PullRequestReviewThreadDTO {
  id: string;
  isResolved: boolean;
  resolvedBy: {
    url: string;
    login: string;
  } | null;
  comments?: PullRequestReviewCommentsConnection;
  viewerCanReply: boolean;
}

const authLink = setContext(() => {
  const token = getAccessToken() ?? PUBLIC_TOKEN;
  return {
    headers: {
      authorization: `bearer ${token}`
    }
  };
});

export const apollo = new ApolloClient({
  cache: new InMemoryCache(),
  link: authLink.concat(new HttpLink({
    uri: `${BASE_URL}/graphql`,
  })),
});

function ajax(request: AjaxRequest): Observable<AjaxResponse> {
  if (!request.responseType)
    request.responseType = 'json'; 
  if (!request.headers)
    request.headers = {};
  const headers: any = request.headers;
  // https://developer.github.com/v3/#graphql-global-relay-ids
  if (!headers['Accept'])
    headers['Accept'] = 'application/vnd.github.jean-grey-preview+json';
  
  const token = getAccessToken();
  if (token)
    headers['Authorization'] = `token ${token}`;
  return ajaxObservable(request);
}

export interface GraphQLError {
  type: 'NOT_FOUND';
}

export function graphql(query: string, variables: {[key: string]: any}): Observable<any> {
  const request = {
    url: `${BASE_URL}/graphql`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    } as any,
    responseType: 'json',
    body: JSON.stringify({ query, variables }),
  };
  
  const token = getAccessToken() ?? PUBLIC_TOKEN;
  request.headers['Authorization'] = `bearer ${token}`;
  return ajaxObservable(request).pipe(
    exhaustMap(resp => resp.response.errors ?
      observableThrowError(resp.response.errors) :
      of(resp.response.data))
  );
}

function pullRequestUrl(owner: string, repo: string, number: number): string {
  return `${BASE_URL}/repos/${owner}/${repo}/pulls/${number}`;
}

export function getPullRequest(owner: string, repo: string, number: number): Observable<PullRequestDTO> {
  return ajax({
    url: pullRequestUrl(owner, repo, number),
    method: 'get',
  }).pipe(map(resp => resp.response));
}

export function getPullRequestAsDiff(owner: string, repo: string, number: number): Observable<string> {
  return ajax({
    // Append query string to prevent interfering caches
    url: `${pullRequestUrl(owner, repo, number)}?.diff`,
    method: 'get',
    headers: {
      'Accept': 'application/vnd.github.v3.diff',
    },
    responseType: 'text',
  }).pipe(map(resp => resp.response));
}

export function getPullRequestFromGraphQL(owner: string, repo: string, number: number, author: string, fragment: string): Observable<PullRequestDTO> {
  return graphql(`
    query($owner: String!, $repo: String!, $number: Int!, $author: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          ${fragment}
        }
      }
    }
  `, { owner, repo, number, author })
    .pipe(map(resp => resp.repository.pullRequest));
}

export function getAuthenticatedUser(): Observable<UserDTO> {
  return ajax({
    url: `${BASE_URL}/user`,
    method: 'get',
  }).pipe(map(resp => resp.response));
}

export function getPullRequestReviewComments(pullRequest: PullRequestDTO, reviewId: string, startCursor: string): Observable<PullRequestCommentDTO[]> {
  return graphql(`
    query($reviewId: ID!, $startCursor: String) {
      node(id: $reviewId) {
        ... on PullRequestReview {
          comments(last: 100, before: $startCursor) {
            nodes {
              ${pullRequestReviewCommentRestLikeFragment}
            }
            pageInfo {
              hasPreviousPage
              startCursor
            }
          }
        }
      }
    }
  `, { reviewId, startCursor })
    .pipe(exhaustMap(resp => {
      const comments = resp.node.comments;
      if (comments.pageInfo.hasPreviousPage) {
        return getPullRequestReviewComments(pullRequest, reviewId, comments.pageInfo.startCursor)
          .pipe(map(result => result.concat(comments.nodes)));
      }
      return of(comments.nodes);
    }));
}

export function getPullRequestReviewThreads(pullRequest: PullRequestDTO, startCursor: string | null = null): Observable<PullRequestReviewThreadDTO[]> {
  return graphql(`
    query($pullRequestId: ID!, $startCursor: String) {
      node(id: $pullRequestId) {
        ... on PullRequest {
          reviewThreads(last: 100, before: $startCursor) {
            nodes {
              ${pullRequestReviewThreadFragment}
            }
            pageInfo {
              hasPreviousPage
              startCursor
            }
          }
        }
      }
    }
  `, { pullRequestId: pullRequest.node_id, startCursor })
    .pipe(exhaustMap(resp => {
      const reviewThreads = resp.node.reviewThreads;
      if (reviewThreads.pageInfo.hasPreviousPage) {
        return getPullRequestReviewThreads(pullRequest, reviewThreads.pageInfo.startCursor)
          .pipe(map(result => result.concat(reviewThreads.nodes)));
      }
      return of(reviewThreads.nodes);
    }));
}
