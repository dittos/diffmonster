import React from 'react';
import g from 'glamorous';
import { Colors } from '@blueprintjs/core';
import oc from 'open-color';
import { highlight, getLanguage } from "highlight.js";
import "highlight.js/styles/default.css";
import { LineType } from '../lib/DiffParser';
import { highlightDiff } from '../lib/DiffHighlight';
import CommentThread from './CommentThread';
import CommentComposer from './CommentComposer';

const CUSTOM_LANGUAGE_ALIASES = {
  // https://github.com/isagalaev/highlight.js/pull/1651
  kt: 'kotlin',
};

const DiffTable = g.table({
  lineHeight: '20px',
  fontSize: '12px',
  fontFamily: 'monospace',
  borderCollapse: 'collapse',
  margin: '0 16px 16px',
});

const HunkGroup = g.tbody({
  border: `1px solid ${Colors.LIGHT_GRAY1}`,
  marginBottom: '16px',
});

const HunkHeaderRow = g.tr({
  lineHeight: '32px',
});

const addCommentIconClassName = 'PullRequestFile-AddCommentIcon';

const BaseLineRow = g.tr({
  [`& .${addCommentIconClassName}`]: {
    visibility: 'hidden',
  },
  [`&:hover .${addCommentIconClassName}`]: {
    visibility: 'visible',
  },
});

const AddCommentCell = g.td({
  width: '16px',
  padding: '0 5px',
  cursor: 'pointer',
  color: Colors.GRAY1,
  verticalAlign: 'top',
  '&:hover': {
    color: Colors.BLUE1,
  },
});

const LineNumberCell = g.td({
  width: '1%',
  minWidth: '50px',
  padding: '0 10px',
  boxSizing: 'border-box',
  textAlign: 'right',
  verticalAlign: 'top',
});

const BaseContentCell = g.td({
  whiteSpace: 'pre-wrap',
  padding: '0 10px',
  background: Colors.WHITE,
});

const LineTypeComponents = {
  [LineType.CONTEXT]: {
    LineRow: g(BaseLineRow)({
      background: Colors.LIGHT_GRAY5,
    }),
    ContentCell: BaseContentCell,
  },
  [LineType.DELETION]: {
    LineRow: g(BaseLineRow)({
      background: oc.red[2],
    }),
    ContentCell: g(BaseContentCell)({
      background: oc.red[1],
    }),
    Highlight: g.span({
      background: oc.red[3],
    }),
  },
  [LineType.ADDITION]: {
    LineRow: g(BaseLineRow)({
      background: oc.green[2],
    }),
    ContentCell: g(BaseContentCell)({
      background: oc.green[1],
    }),
    Highlight: g.span({
      background: oc.green[3],
    }),
  },
};

const CommentContainer = g.div({
  borderTop: `1px solid ${Colors.LIGHT_GRAY2}`,
  borderBottom: `1px solid ${Colors.LIGHT_GRAY2}`,
});

class Highlighter {
  constructor(lang) {
    this.lang = lang;
    this.oldStack = null;
    this.newStack = null;
  }

  highlight(code, lineType) {
    const stack = lineType === LineType.DELETION ? this.oldStack : this.newStack;
    const result = highlight(this.lang, code, false, stack);
    if (lineType === LineType.DELETION) {
      this.oldStack = result.top;
    } else if (lineType === LineType.ADDITION) {
      this.newStack = result.top;
    } else {
      this.oldStack = this.newStack = result.top;
    }
    return result.value;
  }
}

function detectFileLanguage(file) {
  let lang = CUSTOM_LANGUAGE_ALIASES[file.language] || file.language;
  if (getLanguage(lang)) {
    return lang;
  }
  return null;
}

class Hunk extends React.Component {
  render() {
    const {
      hunk,
      file,
      commentsByPosition,
      pendingCommentsByPosition,
      language,
      canCreateComment,
      commentComposerPosition,
      onCloseCommentComposer,
      deleteComment,
    } = this.props;
    const lines = [];
    const highlighter = language ? new Highlighter(language) : null;
    highlightDiff(hunk).forEach(line => {
      const C = LineTypeComponents[line.type];
      lines.push(
        <C.LineRow key={'L' + line.position}>
          {canCreateComment &&
            <AddCommentCell onClick={() => this.props.onOpenCommentComposer(line.position)}>
              <span className={`pt-icon-standard pt-icon-comment ${addCommentIconClassName}`} />
            </AddCommentCell>}
          <LineNumberCell>{line.oldNumber || ''}</LineNumberCell>
          <LineNumberCell>{line.newNumber || ''}</LineNumberCell>
          <C.ContentCell>
          {line.content.map((span, spanIndex) => {
            const props = {
              key: spanIndex,
            };
            let content = span.content;
            if (spanIndex === line.content.length - 1)
              content += '\n';
            if (highlighter)
              props.dangerouslySetInnerHTML = {__html: highlighter.highlight(content, line.type)};
            else
              props.children = content;
            return span.highlight ?
              <C.Highlight {...props} />
              : <span {...props} />;
          })}
          </C.ContentCell>
        </C.LineRow>
      );
      const comments = commentsByPosition[line.position];
      const pendingComments = pendingCommentsByPosition[line.position];
      const showComposer = line.position === commentComposerPosition;
      if (comments || pendingComments || showComposer) {
        lines.push(
          <tr key={'C' + line.position}>
            <td colSpan={canCreateComment ? 4 : 3} style={{padding: 0}}>
              <CommentContainer>
                {comments && <CommentThread
                  comments={comments}
                  isPending={false}
                  deleteComment={deleteComment}
                />}
                {pendingComments && <CommentThread
                  comments={pendingComments}
                  isPending={true}
                  deleteComment={deleteComment}
                />}
                {showComposer && <CommentComposer
                  file={file}
                  position={line.position}
                  onCloseComposer={onCloseCommentComposer}
                />}
              </CommentContainer>
            </td>
          </tr>
        );
      }
    });
    return (
      <HunkGroup>{lines}</HunkGroup>
    );
  }
}

function collectCommentsByPosition(comments) {
  const commentsByPosition = {};
  comments.forEach(comment => {
    if (comment.position) {
      if (!commentsByPosition[comment.position])
        commentsByPosition[comment.position] = [];
      commentsByPosition[comment.position].push(comment);
    }
  });
  return commentsByPosition;
}

export default class Diff extends React.Component {
  state = {
    commentComposerPosition: -1,
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.file.sha !== nextProps.file.sha) {
      this._closeCommentComposer();
    }
  }

  render() {
    const { file, comments, pendingComments, canCreateComment, deleteComment } = this.props;
    const commentsByPosition = collectCommentsByPosition(comments);
    const pendingCommentsByPosition = collectCommentsByPosition(pendingComments);

    const colSpan = canCreateComment ? 4 : 3;

    const items = [];
    const language = detectFileLanguage(file);
    for (var i = 0; i < file.blocks.length; i++) {
      const hunk = file.blocks[i];
      items.push(
        <thead key={'H' + i}>
          <HunkHeaderRow>
            <td style={{paddingTop: i > 0 ? '16px' : 0}} colSpan={colSpan}>
              {hunk.header}
            </td>
          </HunkHeaderRow>
        </thead>
      );
      items.push(
        <Hunk
          key={'L' + i}
          file={file}
          hunk={hunk}
          commentsByPosition={commentsByPosition}
          pendingCommentsByPosition={pendingCommentsByPosition}
          language={language}
          canCreateComment={canCreateComment}
          commentComposerPosition={this.state.commentComposerPosition}
          onOpenCommentComposer={this._openCommentComposer}
          onCloseCommentComposer={this._closeCommentComposer}
          deleteComment={deleteComment}
        />
      );
    }

    return (
      <DiffTable>{items}</DiffTable>
    );
  }

  _openCommentComposer = position => {
    this.setState({ commentComposerPosition: position });
  };

  _closeCommentComposer = () => {
    this.setState({ commentComposerPosition: -1 });
  };
}
