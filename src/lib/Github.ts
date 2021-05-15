import { throwError as observableThrowError, Observable, of } from 'rxjs';
import LinkHeader from 'http-link-header';
import { getAccessToken } from './GithubAuth';
import { ajax as ajaxObservable, AjaxRequest, AjaxResponse } from 'rxjs/ajax';
import { exhaustMap, map } from 'rxjs/operators';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from "@apollo/client/link/context";

const BASE_URL = 'https://api.github.com';

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
  COMMENT: 'COMMENT' as PullRequestReviewEventInput,
  APPROVE: 'APPROVE' as PullRequestReviewEventInput,
  REQUEST_CHANGES: 'REQUEST_CHANGES' as PullRequestReviewEventInput,
  DISMISS: 'DISMISS',
};

export type PullRequestReviewEventInput = null | 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES';

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

export interface UserDTO {
  id: number;
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
  id: number;
  node_id: string;
  user: UserDTO;
  body: string;
  path: string;
  position: number;
  state?: PullRequestCommentState;
}

export interface PullRequestReviewCommentsConnection {
  nodes: PullRequestCommentDTO[];
  pageInfo: {
    hasPreviousPage: boolean;
    startCursor: string;
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
}

const authLink = setContext(() => {
  const token = getAccessToken();
  if (token)
    return {
      headers: {
        authorization: `bearer ${token}`
      }
    };
  return {};
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
    headers: <any>{
      'Content-Type': 'application/json',
    },
    responseType: 'json',
    body: JSON.stringify({ query, variables }),
  };
  
  const token = getAccessToken();
  if (token)
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

function paginated<T>(obs: Observable<AjaxResponse>): Observable<T[]> {
  return obs.pipe(exhaustMap(resp => {
    const link = LinkHeader.parse(resp.xhr.getResponseHeader('Link') || '');
    const next = link.rel('next');
    if (next && next.length === 1) {
      return paginated(ajax({url: next[0].uri, method: 'get'}))
        .pipe(map(result => resp.response.concat(result)));
    }
    return of(resp.response);
  }));
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

export function getPullRequestComments(pullRequest: PullRequestDTO): Observable<PullRequestCommentDTO[]> {
  return paginated(ajax({
    url: `${pullRequest.url}/comments`,
    method: 'get',
  }));
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

export interface AddPullRequestReviewInputComment {
  body: string;
  position: number;
  path: string;
}

export function addPullRequestReview(pullRequestId: string, commitId: string, event: PullRequestReviewEventInput, comments: AddPullRequestReviewInputComment[] = []): Observable<PullRequestReviewDTO> {
  return graphql(`
    mutation($input: AddPullRequestReviewInput!, $commentCount: Int) {
      addPullRequestReview(input: $input) {
        pullRequestReview {
          ${pullRequestReviewFragment}
          comments(first: $commentCount) {
            nodes {
              ${pullRequestReviewCommentRestLikeFragment}
            }
          }
        }
      }
    }
  `, {
    input: {
      pullRequestId,
      commitOID: commitId,
      event,
      comments,
    },
    commentCount: comments.length,
  }).pipe(map(resp => resp.addPullRequestReview.pullRequestReview));
}

export function submitPullRequestReview(pullRequestReviewId: string, event: PullRequestReviewEventInput): Observable<PullRequestReviewDTO> {
  return graphql(`
    mutation($input: SubmitPullRequestReviewInput!) {
      submitPullRequestReview(input: $input) {
        pullRequestReview {
          ${pullRequestReviewFragment}
        }
      }
    }
  `, {
    input: {
      pullRequestReviewId,
      event,
    }
  }).pipe(map(resp => resp.submitPullRequestReview.pullRequestReview));
}

export function addPullRequestReviewCommentOnReview(reviewId: string, commitId: string, body: string, path: string, position: number): Observable<PullRequestCommentDTO> {
  return graphql(`
    mutation($input: AddPullRequestReviewCommentInput!) {
      addPullRequestReviewComment(input: $input) {
        comment {
          ${pullRequestReviewCommentRestLikeFragment}
        }
      }
    }
  `, {
    input: {
      pullRequestReviewId: reviewId,
      commitOID: commitId,
      body,
      path,
      position,
    }
  }).pipe(map(resp => resp.addPullRequestReviewComment.comment));
}

export function deletePullRequestReviewComment(pullRequest: PullRequestDTO, commentId: number): Observable<any> {
  return ajax({
    url: `${pullRequest.base.repo.url}/pulls/comments/${commentId}`,
    method: 'DELETE',
  });
}

export function editPullRequestReviewComment(pullRequest: PullRequestDTO, commentId: number, { body }: { body: string }): Observable<PullRequestCommentDTO> {
  return ajax({
    url: `${pullRequest.base.repo.url}/pulls/comments/${commentId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  }).pipe(map(resp => resp.response));
}

export function editPullRequestReviewCommentViaGraphQL(commentNodeId: string, { body }: { body: string }): Observable<PullRequestCommentDTO> {
  return graphql(`
    mutation($input: UpdatePullRequestReviewCommentInput!) {
      updatePullRequestReviewComment(input: $input) {
        pullRequestReviewComment {
          ${pullRequestReviewCommentRestLikeFragment}
        }
      }
    }
  `, {
    input: {
      pullRequestReviewCommentId: commentNodeId,
      body,
    }
  }).pipe(map(resp => resp.updatePullRequestReviewComment.pullRequestReviewComment));
}
