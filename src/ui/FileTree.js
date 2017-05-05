import React from 'react';
import { Link } from 'react-router-dom';
import g from 'glamorous';
import oc from 'open-color';

const FileList = g.div({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  paddingTop: '8px',

  background: oc.gray[8],
  color: oc.gray[5],
});

const FileDirItem = g.div(props => ({
  display: 'block',
  paddingTop: '8px',
  paddingBottom: '8px',
  paddingRight: '8px',
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
  background: props.active ? oc.gray[7] : 'inherit',
  color: props.status === 'removed' ? oc.red[7] : oc.gray[5],

  ':hover': {
    background: oc.gray[7],
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
    return (
      <FileList>
        {this._renderTree(makeTree(this.props.files))}
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
