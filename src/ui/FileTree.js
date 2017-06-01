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
    collapsed: {},
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.files !== nextProps.files)
      this.setState({ tree: makeTree(nextProps.files) });
  }

  render() {
    return (
      <Tree
        contents={this._renderTree(this.state.tree)}
        onNodeClick={this._onNodeClick}
        onNodeExpand={this._onNodeClick}
        onNodeCollapse={this._onNodeClick}
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
        isExpanded: !this.state.collapsed[subPrefix],
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
        });
      }
    }
    return nodes;
  }

  _onNodeClick = node => {
    if (node.childNodes) {
      // dir node
      const isExpanded = node.isExpanded;
      this.setState(({ collapsed }) => {
        if (isExpanded)
          collapsed[node.id] = true;
        else
          delete collapsed[node.id];
        return { collapsed };
      });
    } else {
      // file node
      if (!node.isSelected) {
        this.props.onSelectFile(node.id);
      }
    }
  };
}

export default FileTree;
