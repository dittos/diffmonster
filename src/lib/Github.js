import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/dom/ajax';
import 'rxjs/add/operator/map';
import { getAccessToken } from './GithubAuth';

function ajax(request) {
  if (!request.responseType)
    request.responseType = 'json'; 
  if (!request.headers)
    request.headers = {};
  
  const token = getAccessToken();
  if (token)
    request.headers['Authorization'] = `token ${token}`;
  return Observable.ajax(request).map(resp => resp.response);
}

export function getPullRequest(owner, repo, id) {
  return ajax({
    url: `https://api.github.com/repos/${owner}/${repo}/pulls/${id}`,
    method: 'get',
  });
}

export function getPullRequestFiles(pullRequest) {
  return ajax({
    url: `${pullRequest.url}/files`,
    method: 'get',
  });
}

export function getPullRequestComments(pullRequest) {
  return ajax({
    url: `${pullRequest.url}/comments`,
    method: 'get',
    headers: {
      'Accept': 'application/vnd.github.black-cat-preview+json'
    }
  })
}
