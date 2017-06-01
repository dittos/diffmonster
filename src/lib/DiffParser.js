import { Diff2Html } from 'diff2html';

export const LineType = {
  CONTEXT: 'd2h-cntx',
  ADDITION: 'd2h-ins',
  DELETION: 'd2h-del',
  NOEOL: '\\', // bye
};

export function parseDiff(diff) {
  // generate PR files API-like object https://developer.github.com/v3/pulls/#list-pull-requests-files
  const parsed = Diff2Html.getJsonFromDiff(diff);
  parsed.forEach(file => {
    file.filename = file.isDeleted ? file.oldName : file.newName;
    file.sha = file.isDeleted ? file.checksumBefore : file.checksumAfter;
    if (file.isDeleted) {
      file.status = 'removed';
    } else if (file.isNew || file.isCopy) {
      file.status = 'added';
    } else if (file.isRename) {
      file.status = 'renamed';
      file.previous_filename = file.oldName;
    }
    let position = 0;
    file.blocks.forEach(block => {
      position++;
      block.lines.forEach(line => {
        line.position = position++;
        line.content = line.content.slice(1);
      });
    });
  });
  return parsed;
}
