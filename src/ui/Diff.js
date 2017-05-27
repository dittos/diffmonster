import React from 'react';
import g from 'glamorous';
import { Colors } from '@blueprintjs/core';
import oc from 'open-color';
import { highlight, getLanguage } from "highlight.js";
import "highlight.js/styles/default.css";
import { LineType } from '../lib/PatchParser';
import { highlightDiff } from '../lib/DiffHighlight';
import CommentThread from './CommentThread';

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

const AddCommentIcon = 'PullRequestFile-AddCommentIcon';

const BaseLineRow = g.tr({
  [`& .${AddCommentIcon}`]: {
    visibility: 'hidden',
  },
  [`&:hover .${AddCommentIcon}`]: {
    visibility: 'visible',
  },
});

const AddCommentCell = g.td({
  padding: '0 5px',
  cursor: 'pointer',
  color: Colors.GRAY1,
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
  [LineType.NOEOL]: {
    ContentCell: g(BaseContentCell)({
      color: oc.red[7],
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
    this.stack = null;
  }

  highlight(code) {
    const result = highlight(this.lang, code, false, this.stack);
    this.stack = result.top;
    return result.value;
  }
}

class Hunk extends React.Component {
  render() {
    const {
      hunk,
      commentsByPosition,
      language,
      canCreateComment,
      commentComposerPosition,
      onCloseCommentComposer,
    } = this.props;
    const lines = [];
    const highlighter = language ? new Highlighter(language) : null;
    highlightDiff(hunk).forEach(line => {
      const C = LineTypeComponents[line.type];
      lines.push(
        <C.LineRow key={'L' + line.position}>
          {canCreateComment &&
            <AddCommentCell onClick={() => this.props.onOpenCommentComposer(line.position)}>
              <span className={`pt-icon-standard pt-icon-comment ${AddCommentIcon}`} />
            </AddCommentCell>}
          <LineNumberCell>{line.fromLine || ''}</LineNumberCell>
          <LineNumberCell>{line.toLine || ''}</LineNumberCell>
          <C.ContentCell>
          {line.content.map((span, spanIndex) => {
            const props = {
              key: spanIndex,
            };
            if (highlighter)
              props.dangerouslySetInnerHTML = {__html: highlighter.highlight(span.content)};
            else
              props.children = span.content;
            return span.highlight ?
              <C.Highlight {...props} />
              : <span {...props} />;
          })}
          </C.ContentCell>
        </C.LineRow>
      );
      const comments = commentsByPosition[line.position];
      const showComposer = line.position === commentComposerPosition;
      if (comments || showComposer) {
        lines.push(
          <tr key={'C' + line.position}>
            <td colSpan={canCreateComment ? 4 : 3} style={{padding: 0}}>
              <CommentContainer>
                <CommentThread
                  comments={comments}
                  showComposer={showComposer}
                  onCloseComposer={onCloseCommentComposer}
                />
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
    const { file, parsedPatch, canCreateComment } = this.props;
    const commentsByPosition = {};
    if (file.comments) {
      file.comments.forEach(comment => {
        if (comment.position) {
          if (!commentsByPosition[comment.position])
            commentsByPosition[comment.position] = [];
          commentsByPosition[comment.position].push(comment);
        }
      });
    }

    let language;
    const parts = file.filename.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1];
      if (getLanguage(ext))
        language = ext;
    }

    const colSpan = canCreateComment ? 4 : 3;

    const items = [];
    for (var i = 0; i < parsedPatch.length; i++) {
      const hunk = parsedPatch[i];
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
          hunk={hunk}
          commentsByPosition={commentsByPosition}
          language={language}
          canCreateComment={canCreateComment}
          commentComposerPosition={this.state.commentComposerPosition}
          onOpenCommentComposer={this._openCommentComposer}
          onCloseCommentComposer={this._closeCommentComposer}
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
