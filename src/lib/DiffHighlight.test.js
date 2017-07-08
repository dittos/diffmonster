import { parseDiff } from './DiffParser';
import { highlightDiff } from './DiffHighlight';

function parse(block) {
  return parseDiff(`diff --git a b
--- a
+++ b
${block}`)[0].blocks[0];
}

describe('DiffHighlight', () => {
  it('highlights the beginning of a line', () => {
    const patch = parse(`@@ -1,3 +1,3 @@
 aaa
-bbb
+0bb
 ccc`);
    expect(highlightDiff(patch)).toMatchSnapshot();
  });

  it('highlights the end of a line', () => {
    const patch = parse(`@@ -1,3 +1,3 @@
 aaa
-bbb
+bb0
 ccc`);
    expect(highlightDiff(patch)).toMatchSnapshot();
  });

  it('highlights the middle of a line', () => {
    const patch = parse(`@@ -1,3 +1,3 @@
 aaa
-bbb
+b0b
 ccc`);
    expect(highlightDiff(patch)).toMatchSnapshot();
  });

  it('does not highlight whole line', () => {
    const patch = parse(`@@ -1,3 +1,3 @@
 aaa
-bbb
+000
 ccc`);
    expect(highlightDiff(patch)).toMatchSnapshot();
  });

  it('does not highlight boring pairs', () => {
    const patch = parse(`@@ -1,3 +1,3 @@
 aaa
-  
+     
 ccc`);
    const result = highlightDiff(patch);
    expect(result.some(({ content }) => content.some(part => part.highlight))).toBe(false);
  });

  it('does not highlight mismatched hunk size', () => {
    const patch = parse(`@@ -1,3 +1,3 @@
 aaa
-bbb
+b0b
+ccc`);
    const result = highlightDiff(patch);
    expect(result.some(({ content }) => content.some(part => part.highlight))).toBe(false);
  });
});
