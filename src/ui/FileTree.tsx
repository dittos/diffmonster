import React, { ReactNode, FormEvent } from 'react';
import { InputGroup, Classes, ITreeNode, Icon } from '@blueprintjs/core';
import FuzzySearch from 'fuzzaldrin-plus';
import { makeTree, FileTreeNode } from '../lib/FileTree';
import { Tree } from './Tree';
import Styles from './FileTree.module.css';
import { DiffFile } from '../lib/DiffParser';

const ICON_NAME_BY_STATUS: {[key: string]: string} = {
  added: 'add',
  removed: 'delete',
  renamed: 'circle-arrow-right',
};

export interface File extends DiffFile {
  commentCount: number;
  isReviewed: boolean | null;
}

type Node = FileTreeNode<File>;

export interface Props {
  files: File[];
  activePath: string | undefined;
  onSelectFile(path: string): void;
}

interface State {
  query: string;
  tree: Node | File[];
  collapsed: {[key: string]: boolean};
}

const TreeComponent: any = Tree; // TODO

class FileTree extends React.Component<Props, State> {
  private _scrollEl: Element | null = null;

  state: State = {
    query: '',
    tree: makeTree<File>(this.props.files),
    collapsed: {},
  };

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.files !== nextProps.files)
      this.setState({ tree: this._getTree(nextProps.files, this.state.query) });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.query !== this.state.query) {
      this._scrollEl!.scrollTop = 0;
    }
  }

  render() {
    return (
      <div className={Styles.Container}>
        <div className={Styles.SearchWrapper}>
          <InputGroup
            autoComplete="off"
            leftIcon="search"
            placeholder="Search..."
            type="search"
            value={this.state.query}
            onChange={this._search}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }} ref={el => this._scrollEl = el}>
          <TreeComponent
            contents={this.state.query ?
              this._renderFilteredTree(this.state.tree as File[]) :
              this._renderTree(this.state.tree as Node)}
            onNodeClick={this._onNodeClick}
            onNodeExpand={this._onNodeClick}
            onNodeCollapse={this._onNodeClick}
          />
        </div>
      </div>
    );
  }

  _renderFilteredTree(tree: File[]) {
    const nodes = [];
    for (let file of tree) {
      const path = file.filename;
      const basename = path.split('/').pop() || '';
      const basenameOffset = path.length - basename.length;
      const dir = path.substring(0, basenameOffset);
      const matches = FuzzySearch.match(path, this.state.query);
      nodes.push({
        id: path,
        icon: ICON_NAME_BY_STATUS[file.status],
        className: Styles.FilteredTreeNode,
        label: [
          this._highlightMatch(basename, matches, basenameOffset),
          <div key="dir" className={`${Classes.TEXT_OVERFLOW_ELLIPSIS} ${Styles.Dir}`}>
            {this._highlightMatch(dir, matches, 0)}
          </div>
        ],
        isSelected: this.props.activePath === path,
        secondaryLabel: this._renderSecondaryLabel(file),
      });
    }
    return nodes;
  }

  _renderTree(tree: Node, prefix = ''): ReactNode {
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
        const basename = path.split('/').pop();
        nodes.push({
          id: path,
          icon: ICON_NAME_BY_STATUS[file.status],
          label: basename,
          isSelected: this.props.activePath === path,
          secondaryLabel: this._renderSecondaryLabel(file),
        });
      }
    }
    return nodes;
  }

  _renderSecondaryLabel(file: File) {
    if (!file.isReviewed && file.commentCount > 0) {
      return <Icon icon="comment" />;
    } else if (file.isReviewed) {
      return <Icon icon="small-tick" />;
    } else {
      return null;
    }
  }

  _getTree(files: File[], query: string) {
    return query ? FuzzySearch.filter(files, query, { key: 'filename' }) : makeTree(files);
  }

  _highlightMatch(path: string, matches: number[], offsetIndex: number) {
    // Similar to https://github.com/atom/fuzzy-finder/blob/cf40851/lib/fuzzy-finder-view.js
    let lastIndex = 0
    let matchedChars = []
    const fragment = []
    for (let matchIndex of matches) {
      matchIndex -= offsetIndex
      // If marking up the basename, omit path matches
      if (matchIndex < 0) {
        continue
      }
      const unmatched = path.substring(lastIndex, matchIndex)
      if (unmatched) {
        if (matchedChars.length > 0) {
          const joined = matchedChars.join('');
          if (joined)
            fragment.push(<b key={matchIndex}>{joined}</b>)
          matchedChars = []
        }

        fragment.push(unmatched)
      }

      matchedChars.push(path[matchIndex])
      lastIndex = matchIndex + 1
    }

    if (matchedChars.length > 0) {
      const joined = matchedChars.join('');
      if (joined)
        fragment.push(<b key="last">{joined}</b>)
    }

    // Remaining characters are plain text
    const last = path.substring(lastIndex)
    if (last)
      fragment.push(last)
    return fragment
  }

  _onNodeClick = (node: ITreeNode) => {
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
        this.props.onSelectFile(String(node.id));
      }
    }
  };

  _search = (event: FormEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value;
    this.setState({
      query,
      tree: this._getTree(this.props.files, query),
    });
  };
}

export default FileTree;
