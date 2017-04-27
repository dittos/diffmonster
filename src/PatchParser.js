export const LineType = {
  CONTEXT: ' ',
  ADDITION: '+',
  DELETION: '-',
};

export function parsePatch(patch) {
  const lines = patch.split('\n');
  const hunks = [];
  let hunk = null;
  for (var i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.indexOf('@@ ') === 0) {
      if (hunk && hunk.lines.length > 0) {
        hunks.push(parseLines(hunk));
      }
      hunk = {
        position: i,
        lines: []
      };
    }
    hunk.lines.push(line);
  }
  if (hunk && hunk.lines.length > 0) {
    hunks.push(parseLines(hunk));
  }

  return hunks;
}

export function parseHunkHeader(header) {
  const result = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(header);
  return {
    from: {
      start: parseInt(result[1], 10),
      count: result[2] ? parseInt(result[2], 10) : 1
    },
    to: {
      start: parseInt(result[3], 10),
      count: result[4] ? parseInt(result[4], 10) : 1
    }
  };
}

function parseLines(hunk) {
  hunk.header = hunk.lines.shift();
  hunk.range = parseHunkHeader(hunk.header);
  var fromLine = hunk.range.from.start;
  var toLine = hunk.range.to.start;
  hunk.lines = hunk.lines.map((line, i) => {
    const type = line.charAt(0);
    const position = hunk.position + i;
    const content = line.substring(1);
    switch (type) {
      case LineType.CONTEXT:
        return {
          type,
          fromLine: fromLine++,
          toLine: toLine++,
          position,
          content,
        };
      case LineType.ADDITION:
        return {
          type,
          fromLine: 0,
          toLine: toLine++,
          position,
          content,
        };
      case LineType.DELETION:
        return {
          type,
          fromLine: fromLine++,
          toLine: 0,
          position,
          content,
        };
      default:
        throw new Error('invalid format');
    }
  });
  return hunk;
}
