import React from 'react';
import styled from 'styled-components';
import oc from 'open-color';
import { highlight } from "highlight.js";
import "highlight.js/styles/default.css";
import { parsePatch, LineType } from './PatchParser';

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
  },
  [LineType.ADDITION]: {
    LineNumberCell: styled(BaseLineNumberCell)`
      background: ${oc.green[2]};
      border-color: ${oc.green[2]};
    `,
    ContentCell: styled(BaseContentCell)`
      background: ${oc.green[1]};
    `,
  },
};

export default function PullRequestFile({ file }) {
  const patch = parsePatch(file.patch);
  let highlightStack;
  return (
    <DiffTable>
      {patch.map((hunk, hunkIndex) => (
        <tbody key={hunkIndex}>
          <HunkHeaderRow>
            <td colSpan={2} />
            <HunkHeaderCell>{hunk.header}</HunkHeaderCell>
          </HunkHeaderRow>
          {hunk.lines.map(line => {
            const highlightResult = highlight('java', line.content, false, highlightStack);
            highlightStack = highlightResult.top;
            const C = LineTypeComponents[line.type];
            return (
              <tr key={line.position}>
                <C.LineNumberCell>{line.fromLine || ''}</C.LineNumberCell>
                <C.LineNumberCell>{line.toLine || ''}</C.LineNumberCell>
                <C.ContentCell dangerouslySetInnerHTML={{__html: highlightResult.value}} />
              </tr>
            );
          })}
        </tbody>
      ))}
    </DiffTable>
  );
  return <pre>{JSON.stringify(parsePatch(file.patch), null, 2)}</pre>;
}
