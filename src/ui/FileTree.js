import React from 'react';
import { withRouter } from 'react-router';
import { Tree } from '@blueprintjs/core';

function makeTree(files) {
  const tree = {name: '', dirs: {}};
  for (let file of files) {
    const parts = file.filename.split('/');
    parts.pop();
    var curNode = tree;
    var id = '';
    for (let dir of parts) {
      id += '/' + id;
      if (!curNode.dirs[dir])
        curNode.dirs[dir] = {id, name: dir, dirs: {}};
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

const ICON_NAME_BY_STATUS = {
  added: 'add',
  removed: 'delete',
};

class FileTree extends React.Component {
  render() {
    const { files } = this.props;

    return (
      <Tree
        contents={this._renderTree(makeTree(files))}
        onNodeClick={this._onNodeClick.bind(this)}
      />
    );
  }

  _renderTree(tree) {
    const nodes = [];
    for (let dir of Object.keys(tree.dirs)) {
      const subtree = tree.dirs[dir];
      nodes.push({
        key: subtree.id,
        label: subtree.name,
        childNodes: this._renderTree(subtree),
        isExpanded: true,
      });
    }
    if (tree.files) {
      for (let file of tree.files) {
        const path = file.filename;
        nodes.push({
          id: path,
          iconName: ICON_NAME_BY_STATUS[file.status],
          label: path.split('/').pop(),
          isSelected: this.props.activePath === path,
        });
      }
    }
    return nodes;
  }

  _onNodeClick(node) {
    if (!node.isSelected && node.id) {
      this.props.history.push(this.props.getFilePath(node.id));
    }
  }
}

export default withRouter(FileTree);
