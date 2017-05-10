import React, { Component } from 'react';
import g from 'glamorous';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/zip';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/exhaustMap';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/publish';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/catch';
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
  props$ = new Subject();
  refresh$ = new BehaviorSubject(false);

  componentDidMount() {
    const match$ = this.props$.map(props => props.match);

    this.subscription = Observable.combineLatest(
        match$.distinctUntilChanged((a, b) => a.url === b.url),
        this.refresh$
      )
      .map(([match, ]) => match.params)
      .switchMap(params =>
        Observable.zip(
          getPullRequest(params.owner, params.repo, params.id),
          getPullRequestFiles(params.owner, params.repo, params.id),
          (pullRequest, files) => ({ pullRequest, files })
        )
        .exhaustMap(data =>
          getPullRequestComments(data.pullRequest)
            .map(comments => ({ ...data, comments }))
            .startWith(data)
        )
        .catch(err => {
          if (err.status === 404) {
            return Observable.of({ notFound: true });
          } else {
            console.error(err)
            return Observable.of({ isLoading: true });
          }
        })
        .startWith({ isLoading: true })
      )
      .subscribe(data => this.setState({ data }), err => console.error(err));

    this.props$.next(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.props$.next(nextProps);
  }

  componentWillUnmount() {
    if (this.subscription)
      this.subscription.unsubscribe();
  }

  render() {
    if (this.state.data.isLoading)
      return <Loading />;
    
    if (this.state.data.notFound)
      return this._renderNotFound();

    const { pullRequest, files, comments = [] } = this.state.data;

    const queryParams = querystring.parse(this.props.location.search.substring(1));
    const activePath = queryParams.path;
    let activeFile;
    if (activePath) {
      activeFile = files.filter(file => file.filename === activePath)[0];
    }

    return <PullRequest
      pullRequest={pullRequest}
      files={files}
      comments={comments}
      activeFile={activeFile}
      getFilePath={path => ({...this.props.location, search: path ? `?path=${encodeURIComponent(path)}` : ''})}
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
    this.setState({ data: { isLoading: true } }); // Loading
    startAuth().then(() => this.refresh$.next(true));
  };
}
