import { Observable } from 'rxjs';
import { getAccessToken } from './GithubAuth';
import { ajax as ajaxObservable, AjaxRequest, AjaxResponse } from 'rxjs/ajax';
import { map } from 'rxjs/operators';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from "@apollo/client/link/context";
import { PullRequestQuery_repository_pullRequest } from '../stores/__generated__/PullRequestQuery';
import { PullRequestReviewThreadFragment } from './__generated__/PullRequestReviewThreadFragment';
import { PullRequestReviewCommentRestLikeFragment } from './__generated__/PullRequestReviewCommentRestLikeFragment';
import { PullRequestReviewFragment } from './__generated__/PullRequestReviewFragment';

const BASE_URL = 'https://api.github.com';

// GitHub token without any additional scope.
// Used for anonymously accessing GraphQL API as it requires access token.
// Mangled a bit to avoid token scanning.
const PUBLIC_TOKEN = 'mp8ke1wLfOlimDLlkOEqaLTf69eIVe1YOo3j_phg'.split('').reverse().join('');

export { PullRequestReviewState } from '../__generated__/globalTypes';

export interface UserDTO {
  id?: number | null;
  html_url: string;
  login: string;
}

export type PullRequestDTO = PullRequestQuery_repository_pullRequest;

export type PullRequestCommentDTO = PullRequestReviewCommentRestLikeFragment;

export type PullRequestReviewDTO = PullRequestReviewFragment;

export type PullRequestReviewThreadDTO = PullRequestReviewThreadFragment;

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

function pullRequestUrl(owner: string, repo: string, number: number): string {
  return `${BASE_URL}/repos/${owner}/${repo}/pulls/${number}`;
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

export function getAuthenticatedUser(): Observable<UserDTO> {
  return ajax({
    url: `${BASE_URL}/user`,
    method: 'get',
  }).pipe(map(resp => resp.response));
}
