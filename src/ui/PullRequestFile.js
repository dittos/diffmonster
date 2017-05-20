import React from 'react';
import g from 'glamorous';
import { Colors } from '@blueprintjs/core';
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

const BaseLineNumberCell = g.td({
  width: '1%',
  minWidth: '50px',
  padding: '0 10px',
  boxSizing: 'border-box',
  textAlign: 'right',
  verticalAlign: 'top',
  borderRight: `1px solid ${Colors.LIGHT_GRAY2}`,
});

const BaseContentCell = g.td({
  whiteSpace: 'pre-wrap',
  padding: '0 10px',
});

const LineTypeComponents = {
  [LineType.CONTEXT]: {
    LineNumberCell: g(BaseLineNumberCell)({
      background: Colors.LIGHT_GRAY5,
    }),
    ContentCell: BaseContentCell,
  },
  [LineType.DELETION]: {
    LineNumberCell: g(BaseLineNumberCell)({
      background: oc.red[2],
      borderColor: oc.red[2],
    }),
    ContentCell: g(BaseContentCell)({
      background: oc.red[1],
    }),
    Highlight: g.span({
      background: oc.red[3],
    }),
  },
  [LineType.ADDITION]: {
    LineNumberCell: g(BaseLineNumberCell)({
      background: oc.green[2],
      borderColor: oc.green[2],
    }),
    ContentCell: g(BaseContentCell)({
      background: oc.green[1],
    }),
    Highlight: g.span({
      background: oc.green[3],
    }),
  },
  [LineType.NOEOL]: {
    LineNumberCell: BaseLineNumberCell,
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

function CommentThread({ comments }) {
  return (
    <CommentContainer>
      {comments.map((comment, i) =>
        <Comment first={i === 0} key={comment.id}>
          <CommentMeta>
            <CommentUser>{comment.user.login}</CommentUser>
          </CommentMeta>
          <div dangerouslySetInnerHTML={{__html: marked(comment.body, { gfm: true })}} />
        </Comment>
      )}
    </CommentContainer>
  );
}

function Hunk({ hunk, commentsByPosition, language }) {
  const lines = [];
  const highlighter = language ? new Highlighter(language) : null;
  highlightDiff(hunk).forEach(line => {
    const C = LineTypeComponents[line.type];
    lines.push(
      <tr key={'L' + line.position}>
        <C.LineNumberCell>{line.fromLine || ''}</C.LineNumberCell>
        <C.LineNumberCell>{line.toLine || ''}</C.LineNumberCell>
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
      </tr>
    );
    const comments = commentsByPosition[line.position];
    if (comments) {
      lines.push(
        <tr key={'C' + comments[0].id}>
          <td colSpan={3} style={{padding: 0}}>
            <CommentThread comments={comments} />
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

export default function PullRequestFile({ file, parsedPatch, comments }) {
  const commentsByPosition = {};
  comments.forEach(comment => {
    if (comment.position) {
      if (!commentsByPosition[comment.position])
        commentsByPosition[comment.position] = [];
      commentsByPosition[comment.position].push(comment);
    }
  });

  let language;
  const parts = file.filename.split('.');
  if (parts.length > 1) {
    const ext = parts[parts.length - 1];
    if (getLanguage(ext))
      language = ext;
  }

  return (
    <DiffTable>
      {parsedPatch.map((hunk, i) =>
        [<thead>
          <HunkHeaderRow>
            <td style={{paddingTop: i > 0 ? '16px' : 0}} colSpan={3}>{hunk.header}</td>
          </HunkHeaderRow>
        </thead>,
        <Hunk
          key={hunk.position}
          hunk={hunk}
          commentsByPosition={commentsByPosition}
          language={language}
        />]
      )}
    </DiffTable>
  );
}
