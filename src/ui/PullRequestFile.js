import React from 'react';
import styled from 'styled-components';
import oc from 'open-color';
import { highlight, getLanguage } from "highlight.js";
import "highlight.js/styles/default.css";
import marked from 'marked';
import { parsePatch, LineType } from '../lib/PatchParser';
import { highlightDiff } from '../lib/DiffHighlight';

const NoPreview = styled.div`
  padding: 16px;
`;

const DiffTable = styled.table`
  line-height: 20px;
  font-size: 12px;
  font-family: monospace;
  border-collapse: collapse;
  border-bottom: 1px solid ${oc.gray[3]};
`;

const HunkHeaderRow = styled.tr`
  background: ${oc.blue[0]};
  color: ${oc.blue[4]};
  border-top: 1px solid ${oc.gray[3]};
  border-bottom: 1px solid ${oc.gray[3]};
  line-height: 32px;
`;

const HunkHeaderCell = styled.td`
  padding: 0 10px;
`;

const BaseLineNumberCell = styled.td`
  width: 1%;
  min-width: 50px;
  padding: 0 10px;
  box-sizing: border-box;
  text-align: right;
  vertical-align: top;
  color: ${oc.gray[6]};
  border-right: 1px solid ${oc.gray[3]};
`;

const BaseContentCell = styled.td`
  white-space: pre-wrap;
  padding: 0 10px;
`;

const LineTypeComponents = {
  [LineType.CONTEXT]: {
    LineNumberCell: styled(BaseLineNumberCell)`
      background: ${oc.gray[0]};
    `,
    ContentCell: BaseContentCell,
  },
  [LineType.DELETION]: {
    LineNumberCell: styled(BaseLineNumberCell)`
      background: ${oc.red[2]};
      border-color: ${oc.red[2]};
    `,
    ContentCell: styled(BaseContentCell)`
      background: ${oc.red[1]};
    `,
    Highlight: styled.span`
      background: ${oc.red[3]};
    `,
  },
  [LineType.ADDITION]: {
    LineNumberCell: styled(BaseLineNumberCell)`
      background: ${oc.green[2]};
      border-color: ${oc.green[2]};
    `,
    ContentCell: styled(BaseContentCell)`
      background: ${oc.green[1]};
    `,
    Highlight: styled.span`
      background: ${oc.green[3]};
    `,
  },
};

const Comment = styled.div`
  padding: 8px;
  margin: 8px;
  border: 1px solid ${oc.gray[4]};
  border-radius: 2px;
  font-family: sans-serif;
  color: ${oc.gray[8]};
`;

const CommentUser = styled.a`
  font-weight: bold;
`;

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
    <div>
      {comments.map((comment, i) =>
        <Comment first={i === 0} key={comment.id}>
          <div>
            <CommentUser>{comment.user.login}</CommentUser>
          </div>
          <div dangerouslySetInnerHTML={{__html: marked(comment.body, { gfm: true })}} />
        </Comment>
      )}
    </div>
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
          <td colSpan={3}>
            <CommentThread comments={comments} />
          </td>
        </tr>
      );
    }
  });
  return (
    <tbody>
      <HunkHeaderRow>
        <td colSpan={2} />
        <HunkHeaderCell>{hunk.header}</HunkHeaderCell>
      </HunkHeaderRow>
      {lines}
    </tbody>
  );
}

export default function PullRequestFile({ file, comments }) {
  if (!file.patch)
    return <NoPreview>Binary file</NoPreview>;

  const patch = parsePatch(file.patch);
  
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
      {patch.map(hunk =>
        <Hunk
          key={hunk.position}
          hunk={hunk}
          commentsByPosition={commentsByPosition}
          language={language}
        />
      )}
    </DiffTable>
  );
}
