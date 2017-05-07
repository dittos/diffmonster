import React, { Component } from 'react';
import g from 'glamorous';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/zip';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
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
    data: null,
  };
  match$ = new Subject();

  componentDidMount() {
    const pullRequest$ = this.match$
      .distinctUntilChanged((a, b) => a.url === b.url && !b.refresh)
      .map(match => match.params)
      .switchMap(params =>
        Observable.zip(
          getPullRequest(params.owner, params.repo, params.id),
          getPullRequestFiles(params.owner, params.repo, params.id),
          (pullRequest, files) => ({ ...pullRequest, files })
        )
        .catch(err => {
          if (err.status === 404) {
            return Observable.of({ notFound: true });
          } else {
            console.error(err)
            return Observable.of(null);
          }
        })
        .startWith(null)
      )
      .publish();

    pullRequest$
      .subscribe(data => {
        this.setState({ data, comments: [] });
      });

    pullRequest$
      .filter(data => data !== null && !data.notFound)
      .switchMap(data => getPullRequestComments(data))
      .subscribe(comments => {
        this.setState({ comments });
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
    const { data, comments } = this.state;

    if (!data)
      return <Loading />;
    
    if (data.notFound)
      return this._renderNotFound();

    const queryParams = querystring.parse(this.props.location.search.substring(1));
    const activePath = queryParams.path;
    let activeFile;
    if (activePath) {
      activeFile = data.files.filter(file => file.filename === activePath)[0];
    }

    return <PullRequest
      data={data}
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
    startAuth().then(() => this.match$.next({ ...this.props.match, refresh: true }));
  };
}
