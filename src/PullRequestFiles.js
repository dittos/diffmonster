import React from 'react';
import { findDOMNode } from 'react-dom';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import oc from 'open-color';
import marked from 'marked';
import Loading from './Loading';
import PullRequestFile from './PullRequestFile';

const Horizontal = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
`;

const Scrollable = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const FileList = styled.div`
  width: 320px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-top: 8px;

  background: ${oc.gray[8]};
  color: ${oc.gray[5]};
`;

const Header = styled.div`
  padding: 16px;

  background: ${oc.gray[9]};
  color: ${oc.gray[5]};
`;

const FileDirItem = styled.div`
  display: block;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-right: 8px;
  padding-left: ${props => props.depth * 16}px;

  font-weight: bold;
`;

const FileItem = styled(Link)`
  display: block;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-right: 8px;
  padding-left: ${props => props.depth * 16}px;

  text-decoration: none;
  background: ${props => props.active ? oc.gray[7] : 'inherit'};
  color: ${props => props.status === 'removed' ? oc.red[7] : oc.gray[5]};

  &:hover {
    background: ${oc.gray[7]};
  }
`;

const Diff = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PullRequestBody = styled.div`
  max-width: 50em;
  margin: 0 auto;
  line-height: 1.8;
  font-size: 14px;
`;

function makeTree(files) {
  const tree = {name: '', dirs: {}};
  for (let file of files) {
    const parts = file.filename.split('/');
    parts.pop();
    var curNode = tree;
    for (let dir of parts) {
      if (!curNode.dirs[dir])
        curNode.dirs[dir] = {name: dir, dirs: {}};
      curNode = curNode.dirs[dir];
    }
    if (!curNode.files)
      curNode.files = [];
    curNode.files.push(file);
  }
  return mergeTreePaths(tree);
}

function mergeTreePaths(tree) {
  const dirs = Object.keys(tree.dirs);
  const merged = tree;
  if (dirs.length === 1 && !tree.files) {
    const dir = tree.dirs[dirs[0]];
    tree = mergeTreePaths({
      name: tree.name + '/' + dir.name,
      dirs: dir.dirs,
      files: dir.files
    });
  } else {
    for (let dir of dirs) {
      merged.dirs[dir] = mergeTreePaths(tree.dirs[dir]);
    }
  }
  return tree;
}

class PullRequestFiles extends React.Component {
  state = {
    data: null,
    comments: null,
  };

  componentDidMount() {
    fetch(`${this.props.pullRequest.url}/files`).then(r => r.json()).then(data => this.setState({ data }));

    // TODO: read multiple paged comments
    fetch(`${this.props.pullRequest.url}/comments`, {
      headers: {
        'Accept': 'application/vnd.github.black-cat-preview+json'
      }
    }).then(r => r.json()).then(comments => this.setState({ comments }));
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.search !== this.props.location.search) {
      if (this._scrollEl)
        findDOMNode(this._scrollEl).scrollTop = 0;
    }
  }

  render() {
    const { pullRequest } = this.props;
    const { data, comments } = this.state;

    if (!data)
      return <Loading />;

    const queryParams = new URLSearchParams(this.props.location.search.substring(1));
    const activePath = queryParams.get('path');
    let activeFile;
    if (activePath) {
      activeFile = data.filter(file => file.filename === activePath)[0];
    }

    return (
      <Horizontal>
        <FileList>
          {this._renderTree(makeTree(data), activePath)}
        </FileList>
        <Diff>
          {activeFile && <Header>{activeFile.filename}</Header>}
          <Scrollable ref={scrollEl => this._scrollEl = scrollEl}>
            {activeFile ?
              <PullRequestFile file={activeFile} comments={comments ? comments.filter(c => c.path === activePath) : []} /> :
              <PullRequestBody dangerouslySetInnerHTML={{__html: marked(pullRequest.body, { gfm: true })}} />
            }
          </Scrollable>
        </Diff>
      </Horizontal>
    );
  }

  _renderTree(tree, activePath, depth = 1) {
    const els = [];
    for (let dir of Object.keys(tree.dirs)) {
      const subtree = tree.dirs[dir];
      els.push(<FileDirItem depth={depth} key={subtree.name}>{subtree.name}/</FileDirItem>);
      els.push(this._renderTree(subtree, activePath, depth + 1));
    }
    if (tree.files) {
      for (let file of tree.files) {
        const path = file.filename;
        els.push(<FileItem
          key={path}
          depth={depth}
          status={file.status}
          active={activePath === path}
          to={{...this.props.location, search: `?path=${encodeURIComponent(path)}`}}
        >
          {path.split('/').pop()}
        </FileItem>);
      }
    }
    return els;
  }
}

export default withRouter(PullRequestFiles);
