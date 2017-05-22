import React from 'react';
import { withRouter } from 'react-router';
import { Tree } from '@blueprintjs/core';
import { makeTree } from '../lib/FileTree';

const ICON_NAME_BY_STATUS = {
  added: 'add',
  removed: 'delete',
  renamed: 'circle-arrow-right',
};

class FileTree extends React.Component {
  render() {
    const { files } = this.props;

    // TODO: collapsible
    return (
      <Tree
        contents={this._renderTree(makeTree(files))}
        onNodeClick={this._onNodeClick.bind(this)}
      />
    );
  }

  _renderTree(tree, prefix = '') {
    const nodes = [];
    for (let dir of Object.keys(tree.dirs)) {
      const subtree = tree.dirs[dir];
      const subPrefix = prefix + '/' + subtree.name;
      nodes.push({
        id: subPrefix,
        label: subtree.name,
        childNodes: this._renderTree(subtree, subPrefix),
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
          secondaryLabel: file.reviewState && <span className="pt-icon-standard pt-icon-small-tick" />,
          _path: path,
        });
      }
    }
    return nodes;
  }

  _onNodeClick(node) {
    if (!node.isSelected && node._path) {
      this.props.history.push(this.props.getFilePath(node._path));
    }
  }
}

export default withRouter(FileTree);
