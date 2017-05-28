import React from 'react';
import g from 'glamorous';
import { Tree } from '@blueprintjs/core';
import { makeTree } from '../lib/FileTree';

const ICON_NAME_BY_STATUS = {
  added: 'add',
  removed: 'delete',
  renamed: 'circle-arrow-right',
};

const SecondaryLabel = g.span({
  whiteSpace: 'nowrap',
});

class FileTree extends React.Component {
  state = {
    tree: makeTree(this.props.files),
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.files !== nextProps.files)
      this.setState({ tree: makeTree(nextProps.files) });
  }

  render() {
    // TODO: collapsible
    return (
      <Tree
        contents={this._renderTree(this.state.tree)}
        onNodeClick={this._onNodeClick}
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
          secondaryLabel: <SecondaryLabel>
            {!file.isReviewed && file.commentCount > 0 &&
              <span className="pt-icon-standard pt-icon-comment" />}
            {file.isReviewed &&
              <span className="pt-icon-standard pt-icon-small-tick" />}
          </SecondaryLabel>,
          _path: path,
        });
      }
    }
    return nodes;
  }

  _onNodeClick = node => {
    if (!node.isSelected && node._path) {
      this.props.onSelectFile(node._path);
    }
  };
}

export default FileTree;
