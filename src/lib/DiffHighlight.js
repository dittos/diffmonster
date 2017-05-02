// JavaScript port of diff-highlight script in Git
// https://github.com/git/git/blob/3dbfe2b8ae94cbdae5f3d32581aedaa5510fdc87/contrib/diff-highlight/diff-highlight

import { LineType } from './PatchParser';

export function highlightDiff(hunk) {
  const lines = [];
  let removed = [];
  let added = [];
  for (let line of hunk.lines) {
    switch (line.type) {
      case LineType.DELETION:
        removed.push(line);
        break;
      case LineType.ADDITION:
        added.push(line);
        break;
      default:
        showHunk(removed, added, lines);
        removed = [];
        added = [];

        lines.push(unhighlight(line));
        break;
    }
  }
  showHunk(removed, added, lines);
  return lines;
}

function unhighlight(line) {
  return {
    ...line,
    content: [{ highlight: false, content: line.content }]
  };
}

function showHunk(a, b, out) {
  if (
    // If one side is empty, then there is nothing to compare or highlight.
    (!a.length || !b.length)
    
    ||

    // If we have mismatched numbers of lines on each side, we could try to
    // be clever and match up similar lines. But for now we are simple and
    // stupid, and only handle multi-line hunks that remove and add the same
    // number of lines.
    (a.length !== b.length)
  ) {
    for (let line of a)
      out.push(unhighlight(line));
    for (let line of b)
      out.push(unhighlight(line));
    return;
  }

  const queue = [];
  for (var i = 0; i < a.length; i++) {
    const [rm, add] = highlightPair(a[i], b[i]);
    out.push(rm);
    queue.push(add);
  }
  for (let line of queue)
    out.push(line);
}

function highlightPair(lineA, lineB) {
  // FIXME: for some strings containing Emoji, length/charAt is not accurate
  const a = lineA.content, b = lineB.content;

  // Find common prefix
  var pa = 0, pb = 0;

  while (pa < a.length && pb < b.length) {
    if (a.charAt(pa) === b.charAt(pb)) {
      pa++;
      pb++;
    } else {
      break;
    }
  }

  // Find common suffix
  var sa = a.length - 1, sb = b.length - 1;

  while (sa >= pa && sb >= pb) {
    if (a.charAt(sa) === b.charAt(sb)) {
      sa--;
      sb--;
    } else {
      break;
    }
  }
  
  if (isPairInteresting(a, pa, sa, b, pb, sb)) {
    return [highlightLine(lineA, pa, sa), highlightLine(lineB, pb, sb)];
  } else {
    return [unhighlight(lineA), unhighlight(lineB)];
  }
}

function highlightLine(line, prefix, suffix) {
  const content = line.content;
  const start = content.substring(0, prefix);
  const mid = content.substring(prefix, suffix + 1);
  const end = content.substring(suffix + 1);

  return {
    ...line,
    content: [
      { highlight: false, content: start },
      { highlight: true, content: mid },
      { highlight: false, content: end }
    ].filter(({ content }) => content.length > 0)
  };
}

const BORING = /^\s*$/;

/**
 * Pairs are interesting to highlight only if we are going to end up
 * highlighting a subset (i.e., not the whole line). Otherwise, the highlighting
 * is just useless noise. We can detect this by finding either a matching prefix
 * or suffix (disregarding boring bits like whitespace and colorization).
 */
function isPairInteresting(a, pa, sa, b, pb, sb) {
  const prefixA = a.substring(0, pa);
  const prefixB = b.substring(0, pb);
  const suffixA = a.substring(sa + 1);
  const suffixB = b.substring(sb + 1);

  return (
    !BORING.test(prefixA) ||
    !BORING.test(prefixB) ||
    !BORING.test(suffixA) ||
    !BORING.test(suffixB)
  );
}
