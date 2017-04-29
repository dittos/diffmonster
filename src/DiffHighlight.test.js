import { parsePatch } from './PatchParser';
import { highlightDiff } from './DiffHighlight';

describe('DiffHighlight', () => {
  it('highlights the beginning of a line', () => {
    const patch = parsePatch(`@@ -1,3 +1,3 @@
 aaa
-bbb
+0bb
 ccc`)[0];
    expect(highlightDiff(patch)).toMatchSnapshot();
  });

  it('highlights the end of a line', () => {
    const patch = parsePatch(`@@ -1,3 +1,3 @@
 aaa
-bbb
+bb0
 ccc`)[0];
    expect(highlightDiff(patch)).toMatchSnapshot();
  });

  it('highlights the middle of a line', () => {
    const patch = parsePatch(`@@ -1,3 +1,3 @@
 aaa
-bbb
+b0b
 ccc`)[0];
    expect(highlightDiff(patch)).toMatchSnapshot();
  });

  it('does not highlight whole line', () => {
    const patch = parsePatch(`@@ -1,3 +1,3 @@
 aaa
-bbb
+000
 ccc`)[0];
    expect(highlightDiff(patch)).toMatchSnapshot();
  });

  it('does not highlight boring pairs', () => {
    const patch = parsePatch(`@@ -1,3 +1,3 @@
 aaa
-  
+     
 ccc`)[0];
    const result = highlightDiff(patch);
    expect(result.some(({ content }) => content.some(part => part.highlight))).toBe(false);
  });

  it('does not highlight mismatched hunk size', () => {
    const patch = parsePatch(`@@ -1,3 +1,3 @@
 aaa
-bbb
+b0b
+ccc`)[0];
    const result = highlightDiff(patch);
    expect(result.some(({ content }) => content.some(part => part.highlight))).toBe(false);
  });
});
