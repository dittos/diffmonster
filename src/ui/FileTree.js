import React from 'react';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import oc from 'open-color';

const FileList = g.div({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',

  color: oc.gray[7],
  backgroundColor: oc.gray[0],
  borderRight: `1px solid ${oc.gray[3]}`,
});

const TitleLink = g(Link, {
  forwardProps: ['to'],
  rootEl: 'a',
})(props => ({
  flex: '0 0 auto',
  display: 'block',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  margin: '0 16px',
  lineHeight: '48px',

  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  color: oc.gray[8],
}));

const FileDirItem = g.div(props => ({
  display: 'block',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingRight: '16px',
  paddingLeft: `${props.depth * 16}px`,

  fontWeight: 'bold',
}));

const FileItem = g(Link, {
  forwardProps: ['to'],
  rootEl: 'a',
})(props => ({
  display: 'block',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingRight: '8px',
  paddingLeft: `${props.depth * 16}px`,

  textDecoration: 'none',
  background: props.active ? oc.gray[2] : 'inherit',
  color: props.status === 'removed' ?
    oc.red[7] :
      props.status === 'added' ?
        oc.green[7] :
          oc.gray[7],

  ':hover': {
    background: oc.gray[2],
  },
}));

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

class FileTree extends React.Component {
  render() {
    const { pullRequest, files } = this.props;

    return (
      <FileList>
        <TitleLink active={!this.props.activePath} to={this.props.getFilePath()}>
          {pullRequest.title}
        </TitleLink>
        {this._renderTree(makeTree(files))}
      </FileList>
    );
  }

  _renderTree(tree, depth = 1) {
    const els = [];
    for (let dir of Object.keys(tree.dirs)) {
      const subtree = tree.dirs[dir];
      els.push(<FileDirItem depth={depth} key={subtree.name}>{subtree.name}/</FileDirItem>);
      els.push(this._renderTree(subtree, depth + 1));
    }
    if (tree.files) {
      for (let file of tree.files) {
        const path = file.filename;
        els.push(<FileItem
          key={path}
          depth={depth}
          status={file.status}
          active={this.props.activePath === path}
          to={this.props.getFilePath(path)}
        >
          {path.split('/').pop()}
        </FileItem>);
      }
    }
    return els;
  }
}

export default FileTree;
