import React, { Component } from 'react';
import styled from 'styled-components';
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

  async componentDidMount() {
    const params = this.props.match.params;
    const data = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/pulls/${params.id}`).then(r => r.json());
    this.setState({ data });
  }

  render() {
    const { data } = this.state;

    if (!data)
      return <div>Loading</div>;

    return <Vertical>
      <PullRequestHeader pullRequest={data} />
      <ScrollPane>
        <PullRequestFiles pullRequest={data} />
      </ScrollPane>
    </Vertical>;
  }
}
