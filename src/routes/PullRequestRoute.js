import React, { Component } from 'react';
import { NonIdealState } from '@blueprintjs/core';
import DocumentTitle from 'react-document-title';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/zip';
import querystring from 'querystring';
import Loading from '../ui/Loading';
import PullRequest from '../ui/PullRequest';
import {
  getPullRequest,
  getPullRequestFiles,
  getPullRequestComments,
} from '../lib/Github';
import { startAuth } from '../lib/GithubAuth';

export default class PullRequestRoute extends Component {
  state = {
    data: { isLoading: true }
  };
  subscription = new Subscription();

  componentDidMount() {
    this._load(this.props.match.params);
  }

  componentWillReceiveProps(nextProps) {
    const params = this.props.match.params;
    const nextParams = nextProps.match.params;
    if (
      params.owner !== nextParams.owner ||
      params.repo !== nextParams.repo ||
      params.id !== nextParams.id
    ) {
      this._load(nextProps.match.params);
    }
  }

  componentWillUnmount() {
    this._cancelLoad();
  }

  render() {
    const { data } = this.state;

    if (data.isLoading)
      return <Loading />;
    
    if (data.notFound)
      return this._renderNotFound();

    const { pullRequest, files, comments = [] } = data;

    return (
      <DocumentTitle title={`${pullRequest.title} - ${pullRequest.base.repo.full_name}#${pullRequest.number}`}>
        <PullRequest
          pullRequest={pullRequest}
          files={files}
          comments={comments}
          activeFile={this._getActiveFile()}
          getFilePath={path => ({...this.props.location, search: path ? `?path=${encodeURIComponent(path)}` : ''})}
        />
      </DocumentTitle>
    );
  }

  _renderNotFound() {
    return (
      <NonIdealState
        title="Not Found"
        visual="warning-sign"
        description={
          <p>
            <a href="#" onClick={this._login}>Login with GitHub</a> to view private repos.
          </p>
        }
      />
    )
  }

  _load(params) {
    this._cancelLoad();
    this.setState({ data: { isLoading: true } });

    const { owner, repo, id } = params;
    this.subscription.add(Observable.zip(
      getPullRequest(owner, repo, id),
      getPullRequestFiles(owner, repo, id),
      (pullRequest, files) => ({ pullRequest, files })
    ).subscribe(data => {
      this.setState({ data });

      this.subscription.add(getPullRequestComments(data.pullRequest)
        .subscribe(comments => {
          this.setState({ data: { ...this.state.data, comments } });
        }));
    }, err => {
      if (err.status === 404) {
        this.setState({ data: { notFound: true } });
      } else {
        console.log(err);
        // TODO: show error
      }
    }));
  }

  _reload() {
    this._load(this.props.match.params);
  }

  _cancelLoad() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = new Subscription();
    }
  }

  _getActiveFile() {
    const queryParams = querystring.parse(this.props.location.search.substring(1));
    const activePath = queryParams.path;
    if (this.state.data.files)
      return this.state.data.files.filter(file => file.filename === activePath)[0];
  }

  _login = event => {
    event.preventDefault();
    startAuth().then(() => this._reload());
  };
}
