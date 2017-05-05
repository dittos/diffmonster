import React, { Component } from 'react';
import g from 'glamorous';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/distinctUntilKeyChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/publish';
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
    data: null,
  };
  match$ = new Subject();

  componentDidMount() {
    const pullRequest$ = this.match$
      .distinctUntilKeyChanged('url')
      .map(match => match.params)
      .switchMap(params => getPullRequest(params.owner, params.repo, params.id))
      .publish();

    pullRequest$
      .subscribe(data => {
        this.setState({ data });
      }, err => {
        if (err.status === 404)
          this.setState({ data: { notFound: true } });
      });

    pullRequest$
      .switchMap(pullRequest => Observable.zip(
        // TODO: read multiple paged responses
        getPullRequestFiles(pullRequest),
        getPullRequestComments(pullRequest)
      ))
      .subscribe(([files, comments]) => {
        this.setState({ files, comments });
      });

    this.subscription = pullRequest$.connect();
    this.match$.next(this.props.match);
  }

  componentWillReceiveProps(nextProps) {
    this.match$.next(nextProps.match);
  }

  componentWillUnmount() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }

  render() {
    const { data, files, comments } = this.state;

    if (!data)
      return <Loading />;
    
    if (data.notFound)
      return this._renderNotFound();

    const queryParams = new URLSearchParams(this.props.location.search.substring(1));
    const activePath = queryParams.get('path');
    let activeFile;
    if (activePath && files) {
      activeFile = files.filter(file => file.filename === activePath)[0];
    }

    return <PullRequest
      data={data}
      files={files}
      comments={comments}
      activeFile={activeFile}
      getFilePath={path => ({...this.props.location, search: `?path=${encodeURIComponent(path)}`})}
    />;
  }

  _renderNotFound() {
    return (
      <g.Div margin="auto" textAlign="center">
        <h1>Not Found</h1>

        <p>
          <a href="#" onClick={this._login}>Login with GitHub</a> to view private repos.
        </p>
      </g.Div>
    )
  }

  _login = event => {
    event.preventDefault();
    this.setState({ data: null }); // Loading
    startAuth().then(() => this._load(this.props));
  };
}
