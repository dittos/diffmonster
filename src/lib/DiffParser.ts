import { Diff2Html } from 'diff2html';

export const LineType = {
  CONTEXT: 'd2h-cntx',
  ADDITION: 'd2h-ins',
  DELETION: 'd2h-del',
};

export interface DiffFile extends Diff2Html.Result {
  filename: string;
  sha: string | undefined;
  status: 'removed' | 'added' | 'renamed';
  previous_filename: string | undefined;
  blocks: DiffBlock[];
}

export interface DiffBlock extends Diff2Html.Block {
  lines: DiffLine[];
}

export interface DiffLine extends Diff2Html.Line {
  position: number;
}

export function parseDiff(diff: string) {
  // generate PR files API-like object https://developer.github.com/v3/pulls/#list-pull-requests-files
  const parsed = Diff2Html.getJsonFromDiff(diff) as DiffFile[];
  parsed.forEach(file => {
    file.filename = file.isDeleted ? file.oldName : file.newName;
    // TODO: GitHub doesn't provide checksum for content unchanged file
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
