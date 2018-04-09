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
`;

function ajax(request) {
  if (!request.responseType)
    request.responseType = 'json'; 
  if (!request.headers)
    request.headers = {};
  // https://developer.github.com/v3/#graphql-global-relay-ids
  if (!request.headers['Accept'])
    request.headers['Accept'] = 'application/vnd.github.jean-grey-preview+json';
  
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

function pullRequestUrl(owner, repo, number) {
  return `${BASE_URL}/repos/${owner}/${repo}/pulls/${number}`;
}

export function getPullRequest(owner, repo, number) {
  return ajax({
    url: pullRequestUrl(owner, repo, number),
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

export function getPullRequestAsDiff(owner, repo, number) {
  return ajax({
    // Append query string to prevent interfering caches
    url: `${pullRequestUrl(owner, repo, number)}?.diff`,
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

export function getPullRequestFromGraphQL(owner, repo, number, author, fragment) {
  return graphql(`
    query($owner: String!, $repo: String!, $number: Int!, $author: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          ${fragment}
        }
      }
    }
  `, { owner, repo, number, author })
    .map(resp => resp.repository.pullRequest);
}

export function getAuthenticatedUser() {
  return ajax({
    url: `${BASE_URL}/user`,
    method: 'get',
  }).map(resp => resp.response);
}

export function getPullRequestReviewComments(pullRequest, reviewId, startCursor) {
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
    .exhaustMap(resp => {
      const comments = resp.node.comments;
      if (comments.pageInfo.hasPreviousPage) {
        return getPullRequestReviewComments(pullRequest, reviewId, comments.pageInfo.startCursor)
          .map(result => result.concat(comments.nodes));
      }
      return Observable.of(comments.nodes);
    });
}

export function addPullRequestReview(pullRequestId, commitId, event, comments = []) {
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
  }).map(resp => resp.addPullRequestReview.pullRequestReview);
}

export function submitPullRequestReview(pullRequestReviewId, event) {
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
  }).map(resp => resp.submitPullRequestReview.pullRequestReview);
}

export function addPullRequestReviewCommentOnReview(reviewId, commitId, body, path, position) {
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
  }).map(resp => resp.addPullRequestReviewComment.comment);
}

export function deletePullRequestReviewComment(pullRequest, commentId) {
  return ajax({
    url: `${pullRequest.base.repo.url}/pulls/comments/${commentId}`,
    method: 'DELETE',
  });
}

export function editPullRequestReviewComment(pullRequest, commentId, { body }) {
  return ajax({
    url: `${pullRequest.base.repo.url}/pulls/comments/${commentId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  }).map(resp => resp.response);
}

export function editPullRequestReviewCommentViaGraphQL(commentNodeId, { body }) {
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
  }).map(resp => resp.updatePullRequestReviewComment.pullRequestReviewComment);
}
