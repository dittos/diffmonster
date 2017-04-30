import React from 'react';
import styled from 'styled-components';
import oc from 'open-color';
import { highlight, getLanguage } from "highlight.js";
import "highlight.js/styles/default.css";
import { parsePatch, LineType } from './PatchParser';
import { highlightDiff } from './DiffHighlight';

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
      for (let comment of comments) {
        lines.push(
          <tr key={'C' + comment.id}>
            <td colSpan={3}>
              {JSON.stringify(comment, null, 2)}
            </td>
          </tr>
        );
      }
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
