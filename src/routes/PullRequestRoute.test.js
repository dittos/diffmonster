import React from 'react';
import Rx from 'rxjs';
import { shallow } from 'enzyme';
import PullRequestRoute from './PullRequestRoute';
import Loading from '../ui/Loading';
import PullRequest from '../ui/PullRequest';
import * as Github from '../lib/Github';
import * as GithubAuth from '../lib/GithubAuth';
import * as Database from '../lib/Database';
import pullRequestFixture from '../fixtures/pull-request.json';
import pullRequestFilesFixture from '../fixtures/pull-request-files.json';
import pullRequestCommentsFixture from '../fixtures/pull-request-comments.json';

jest.mock('../lib/Github');
jest.mock('../lib/GithubAuth');
jest.mock('../lib/Database');

describe('PullRequestRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    GithubAuth.isAuthenticated.mockReturnValue(false);
  });

  it('should render not found view', async () => {
    const wrapper = shallow(<PullRequestRoute
      location={{
        search: ''
      }}
      match={{
        url: '/octocat/Spoon-Knife/pull/1',
        params: {
          owner: 'octocat',
          repo: 'Spoon-Knife',
          id: 1,
        },
      }}
    />);
    Github.getPullRequest.mockReturnValue(Rx.Observable.throw({ status: 404 }));
    Github.getPullRequestFiles.mockReturnValue(Rx.Observable.never());
    wrapper.instance().componentDidMount();

    expect(wrapper.contains(<Loading />)).toEqual(false);
    expect(wrapper.type()).not.toEqual(PullRequest);
  });

  it('should render without selected file', () => {
    const wrapper = shallow(<PullRequestRoute
      location={{ search: '' }}
      match={{
        url: '/octocat/Spoon-Knife/pull/1',
        params: {
          owner: 'octocat',
          repo: 'Spoon-Knife',
          id: 1,
        },
      }}
    />);
    const pullRequest$ = new Rx.Subject();
    const pullRequestFiles$ = new Rx.Subject();
    const pullRequestComments$ = new Rx.Subject();
    Github.getPullRequest.mockReturnValue(pullRequest$);
    Github.getPullRequestFiles.mockReturnValue(pullRequestFiles$);
    Github.getPullRequestComments.mockReturnValue(pullRequestComments$);
    wrapper.instance().componentDidMount();

    expect(Github.getPullRequest.mock.calls).toEqual([['octocat', 'Spoon-Knife', 1]]);
    expect(Github.getPullRequestFiles.mock.calls).toEqual([['octocat', 'Spoon-Knife', 1]]);
    expect(Github.getPullRequestComments.mock.calls.length).toEqual(0);

    // Render loading if nothing is loaded
    expect(wrapper.contains(<Loading />)).toEqual(true);

    // Files are not loaded yet
    pullRequest$.next(pullRequestFixture);
    pullRequest$.complete();
    expect(wrapper.contains(<Loading />)).toEqual(true);

    // Render PullRequest but don't wait for comments to load
    pullRequestFiles$.next(pullRequestFilesFixture);
    pullRequestFiles$.complete();
    expect(Github.getPullRequestComments.mock.calls.length).toEqual(1);
    expect(wrapper.contains(<Loading />)).toEqual(false);
    const pr = wrapper.find(PullRequest);
    expect(pr.length).toEqual(1);
    const data = pr.prop('data');
    expect(data.pullRequest).toEqual(pullRequestFixture);
    expect(data.files).toEqual(pullRequestFilesFixture);
    expect(data.comments).toEqual(undefined);
    expect(pr.prop('activeFile')).toEqual(undefined);

    pullRequestComments$.next(pullRequestCommentsFixture);
    pullRequestComments$.complete();
    expect(wrapper.find(PullRequest).prop('data').comments)
      .toEqual(pullRequestCommentsFixture);
  });

  it('should render with selected file', () => {
    const path = 'core/src/main/java/com/linecorp/armeria/client/limit/ConcurrencyLimitingHttpClient.java';
    const wrapper = shallow(<PullRequestRoute
      location={{ search: `?path=${path}` }}
      match={{
        url: '/octocat/Spoon-Knife/pull/1',
        params: {
          owner: 'octocat',
          repo: 'Spoon-Knife',
          id: 1,
        },
      }}
    />);
    Github.getPullRequest.mockReturnValue(Rx.Observable.of(pullRequestFixture));
    Github.getPullRequestFiles.mockReturnValue(Rx.Observable.of(pullRequestFilesFixture));
    Github.getPullRequestComments.mockReturnValue(Rx.Observable.of(pullRequestCommentsFixture));
    wrapper.instance().componentDidMount();

    expect(wrapper.contains(<Loading />)).toEqual(false);
    const pr = wrapper.find(PullRequest);
    expect(pr.length).toEqual(1);
    const data = pr.prop('data');
    expect(data.pullRequest).toEqual(pullRequestFixture);
    expect(data.files).toEqual(pullRequestFilesFixture);
    expect(data.comments).toEqual(pullRequestCommentsFixture);
    expect(pr.prop('activeFile').filename).toEqual(path);
  });
});
