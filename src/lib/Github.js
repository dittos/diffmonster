import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/dom/ajax';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/exhaustMap';
import LinkHeader from 'http-link-header';
import { getAccessToken } from './GithubAuth';

const BASE_URL = 'https://api.github.com';

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
    url: 'https://api.github.com/graphql',
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
  return `https://api.github.com/repos/${owner}/${repo}/pulls/${id}`;
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

const commentFragment = `
  fragment CommentFragment on PullRequestReviewComment {
    id
    bodyHTML
    path
    position
    author {
      login
      url
    }
  }
`;

export function getPullRequestComments(pullRequestId) {
  return graphql(`
    ${commentFragment}
    query($id: ID!) {
      node(id: $id) {
        ... on PullRequest {
          comments(first: 100) {
            nodes {
              ...CommentFragment
            }
          }
        }
      }
    }
  `, { id: pullRequestId });
}

export function getPullRequestReviews(owner, repo, id) {
  return graphql(`
    query($owner: String!, $repo: String!, $id: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $id) {
          reviews(last: 100) { # TODO: handle pagination
            nodes {
              id
              state
              viewerDidAuthor
              createdAt
              databaseId
            }
          }
        }
      }
    }
  `, { owner, repo, id })
    .map(resp => resp.repository.pullRequest.reviews.nodes);
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

export function addPullRequestComment(pullRequest, data) {
  return ajax({
    url: `${pullRequest.url}/comments`,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data,
  }).map(resp => resp.response);
}

export function addPullRequestReviewComment(review, data) {
  return graphql(`
    mutation($reviewId: ID!, $body: String!, path: String, position: Int) {
      addPullRequestReviewComment(pullRequestReviewId: $reviewId, body: $body) {
        comment {

        }
      }
    }
  `, {
    reviewId: review.id
  }).map(resp => resp.response);
}
