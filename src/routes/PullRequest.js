import React, { Component } from 'react';
import styled from 'styled-components';
import Loading from '../ui/Loading';
import PullRequestHeader from '../ui/PullRequestHeader';
import PullRequestFiles from '../ui/PullRequestFiles';
import { getPullRequest } from '../lib/Github';
import { startAuth } from '../lib/GithubAuth';

const Vertical = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
const ScrollPane = styled.div`
  flex: 1;
  overflow: auto;
`;

const Error = styled.div`
  margin: auto;
  text-align: center;
`;

export default class PullRequest extends Component {
  state = {
    data: null,
  };

  getUrl(props) {
    const params = props.match.params;
    return `https://api.github.com/repos/${params.owner}/${params.repo}/pulls/${params.id}`;
  }

  _load = (props) => {
    const params = props.match.params;
    getPullRequest(params.owner, params.repo, params.id).subscribe(resp => {
      this.setState({ data: resp.response });
    }, err => {
      if (err.status === 404)
        this.setState({ data: { notFound: true } });
    });
  };

  componentDidMount() {
    this._load(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (this.getUrl(this.props) !== this.getUrl(nextProps))
      this._load(nextProps);
  }

  render() {
    const { data } = this.state;

    if (!data)
      return <Loading />;
    
    if (data.notFound)
      return this._renderNotFound();

    return <Vertical>
      <PullRequestHeader key={data.url} pullRequest={data} />
      <ScrollPane>
        <PullRequestFiles key={data.url} pullRequest={data} />
      </ScrollPane>
    </Vertical>;
  }

  _renderNotFound() {
    return (
      <Vertical>
        <Error>
          <h1>Not Found</h1>

          <p>
            <a href="#" onClick={this._login}>Login with GitHub</a> to view private repos.
          </p>
        </Error>
      </Vertical>
    )
  }

  _login = event => {
    event.preventDefault();
    this.setState({ data: null }); // Loading
    startAuth().then(() => this._load(this.props));
  };
}
