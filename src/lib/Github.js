import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
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

function pullRequestUrl(owner, repo, id) {
  return `https://api.github.com/repos/${owner}/${repo}/pulls/${id}`;
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

export function getPullRequestFiles(owner, repo, id) {
  return paginated(ajax({
    url: `${pullRequestUrl(owner, repo, id)}/files`,
    method: 'get',
  }));
}

export function getPullRequestComments(pullRequest) {
  return paginated(ajax({
    url: `${pullRequest.url}/comments`,
    method: 'get',
  }));
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
