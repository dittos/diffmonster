import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/dom/ajax';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/exhaustMap';
import LinkHeader from 'http-link-header';
import { getAccessToken } from './GithubAuth';

const BASE_URL = 'https://api.github.com';

export const PullRequestReviewState = {
  PENDING: 'PENDING',
  COMMENTED: 'COMMENTED',
  APPROVED: 'APPROVED',
  CHANGES_REQUESTED: 'CHANGES_REQUESTED',
  DISMISSED: 'DISMISSED',
};

function ajax(request) {
  if (!request.responseType)
    request.responseType = 'json'; 
  if (!request.headers)
    request.headers = {};
  
  const token = getAccessToken();
  if (token)
    request.headers['Authorization'] = `token ${token}`;
  return Observable.ajax(request);
}

export function graphql(query, variables) {
  const request = {
    url: `${BASE_URL}/graphql`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    responseType: 'json',
    body: JSON.stringify({ query, variables }),
  };
  
  const token = getAccessToken();
  if (token)
    request.headers['Authorization'] = `bearer ${token}`;
  return Observable.ajax(request)
    .exhaustMap(resp => resp.response.errors ?
      Observable.throw(resp.response.errors) :
      Observable.of(resp.response.data));
}

function pullRequestUrl(owner, repo, id) {
  return `${BASE_URL}/repos/${owner}/${repo}/pulls/${id}`;
}

export function getPullRequest(owner, repo, id) {
  return ajax({
    url: pullRequestUrl(owner, repo, id),
    method: 'get',
  }).map(resp => resp.response);
}

function paginated(obs) {
  return obs.exhaustMap(resp => {
    const link = LinkHeader.parse(resp.xhr.getResponseHeader('Link') || '');
    const next = link.rel('next');
    if (next && next.length === 1) {
      return paginated(ajax({url: next[0].uri, method: 'get'}))
        .map(result => resp.response.concat(result));
    }
    return Observable.of(resp.response);
  });
}

export function getPullRequestAsDiff(owner, repo, id) {
  return ajax({
    // Append query string to prevent interfering caches
    url: `${pullRequestUrl(owner, repo, id)}?.diff`,
    method: 'get',
    headers: {
      'Accept': 'application/vnd.github.v3.diff',
    },
    responseType: 'text',
  }).map(resp => resp.response);
}

export function getPullRequestComments(pullRequest) {
  return paginated(ajax({
    url: `${pullRequest.url}/comments`,
    method: 'get',
  }));
}

export function getPullRequestFromGraphQL(owner, repo, id, fragment) {
  return graphql(`
    query($owner: String!, $repo: String!, $id: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $id) {
          ${fragment}
        }
      }
    }
  `, { owner, repo, id })
    .map(resp => resp.repository.pullRequest);
}

export function getAuthenticatedUser() {
  return ajax({
    url: `${BASE_URL}/user`,
    method: 'get',
  }).map(resp => resp.response);
}

export function searchIssues(q) {
  return ajax({
    url: `${BASE_URL}/search/issues?q=${encodeURIComponent(q)}`,
    method: 'get',
  }).map(resp => resp.response);
}

export function getPullRequestReviewComments(owner, repo, id, reviewId) {
  return paginated(ajax({
    url: `${pullRequestUrl(owner, repo, id)}/reviews/${reviewId}/comments`,
    method: 'get',
  }));
}

export function addPullRequestReviewComment(pullRequest, data) {
  return ajax({
    url: `${pullRequest.url}/comments`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data,
  }).map(resp => resp.response);
}

export function addPullRequestReview(pullRequestId, commitId, comments) {
  return graphql(`
    mutation($input: AddPullRequestReviewInput!) {
      addPullRequestReview(input: $input) {
        pullRequestReview {
          id
          state
          viewerDidAuthor
          createdAt
          databaseId
        }
      }
    }
  `, {
    input: {
      pullRequestId,
      commitOID: commitId,
      comments,
    }
  }).map(resp => resp.addPullRequestReview.pullRequestReview);
}

export function addPullRequestReviewCommentOnReview(reviewId, commitId, body, path, position) {
  return graphql(`
    mutation($input: AddPullRequestReviewCommentInput!) {
      addPullRequestReviewComment(input: $input) {
        comment {
          id
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
  }).map(resp => resp.addPullRequestReviewComment.comment);
}
