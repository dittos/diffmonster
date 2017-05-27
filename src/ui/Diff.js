import React from 'react';
import g from 'glamorous';
import { Colors, Button, Intent } from '@blueprintjs/core';
import oc from 'open-color';
import { highlight, getLanguage } from "highlight.js";
import "highlight.js/styles/default.css";
import marked from 'marked';
import { LineType } from '../lib/PatchParser';
import { highlightDiff } from '../lib/DiffHighlight';

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

const Comment = g.div({
  padding: '8px',
  margin: '8px',
  border: `1px solid ${Colors.GRAY5}`,
  borderRadius: '3px',
  fontFamily: 'sans-serif',
});

const CommentComposer = g.div({
  margin: '8px',
  fontFamily: 'sans-serif',
});

const CommentComposerActions = g.div({
  marginTop: '8px',

  '& button': {
    marginRight: '8px',
  }
});

const CommentMeta = g.div({
  paddingBottom: '8px',
});

const CommentUser = g.a({
  fontWeight: 'bold',
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

function CommentThread({ comments, showComposer }) {
  return (
    <CommentContainer>
      {comments && comments.map((comment, i) =>
        <Comment first={i === 0} key={comment.id}>
          <CommentMeta>
            <CommentUser>{comment.user.login}</CommentUser>
          </CommentMeta>
          <div dangerouslySetInnerHTML={{__html: marked(comment.body, { gfm: true })}} />
        </Comment>
      )}
      {showComposer && <CommentComposer key="composer">
        <textarea
          placeholder="Write comment..."
          className="pt-input pt-fill"
        />
        <CommentComposerActions>
          <Button text="Write" intent={Intent.PRIMARY} />
          <Button text="Cancel" />
        </CommentComposerActions>
      </CommentComposer>}
    </CommentContainer>
  );
}

class Hunk extends React.Component {
  state = {
    commentComposerPosition: -1,
  };

  render() {
    const { hunk, commentsByPosition, language, canCreateComment } = this.props;
    const lines = [];
    const highlighter = language ? new Highlighter(language) : null;
    highlightDiff(hunk).forEach(line => {
      const C = LineTypeComponents[line.type];
      lines.push(
        <C.LineRow key={'L' + line.position}>
          {canCreateComment &&
            <AddCommentCell onClick={() => this._openCommentComposer(line)}>
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
      const showComposer = line.position === this.state.commentComposerPosition;
      if (comments || showComposer) {
        lines.push(
          <tr key={'C' + line.position}>
            <td colSpan={canCreateComment ? 4 : 3} style={{padding: 0}}>
              <CommentThread comments={comments} showComposer={showComposer} />
            </td>
          </tr>
        );
      }
    });
    return (
      <HunkGroup>
        {lines}
      </HunkGroup>
    );
  }

  _openCommentComposer(line) {
    this.setState({ commentComposerPosition: line.position });
  }
}

export default function PullRequestFile({ file, parsedPatch, canCreateComment }) {
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

  return (
    <DiffTable>
      {parsedPatch.map((hunk, i) =>
        [<thead>
          <HunkHeaderRow>
            <td style={{paddingTop: i > 0 ? '16px' : 0}} colSpan={colSpan}>
              {hunk.header}
            </td>
          </HunkHeaderRow>
        </thead>,
        <Hunk
          key={hunk.position}
          hunk={hunk}
          commentsByPosition={commentsByPosition}
          language={language}
          canCreateComment={canCreateComment}
        />]
      )}
    </DiffTable>
  );
}
