import React, { Component } from 'react';
import styled from 'styled-components';
import Loading from './Loading';
import PullRequestHeader from './PullRequestHeader';
import PullRequestFiles from './PullRequestFiles';

const Vertical = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
const ScrollPane = styled.div`
  flex: 1;
  overflow: auto;
`;

export default class PullRequest extends Component {
  state = {
    data: null,
  };

  getUrl(props) {
    const params = props.match.params;
    return `https://api.github.com/repos/${params.owner}/${params.repo}/pulls/${params.id}`;
  }

  _load = async (props) => {
    const data = await fetch(this.getUrl(props)).then(r => r.json());
    this.setState({ data });
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

    return <Vertical>
      <PullRequestHeader key={data.url} pullRequest={data} />
      <ScrollPane>
        <PullRequestFiles key={data.url} pullRequest={data} />
      </ScrollPane>
    </Vertical>;
  }
}
