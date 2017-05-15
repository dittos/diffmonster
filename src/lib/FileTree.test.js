import { makeTree } from './FileTree';

describe('makeTree', () => {
  it('should group files by dir', () => {
    expect(makeTree([
      'a/1',
      'a/2',
      'b/1',
      'b/2',
      'b/c/1',
      'b/c/2',
    ], f => f)).toMatchSnapshot();
  });

  it('should concatenate dirs with only a dir', () => {
    expect(makeTree([
      'b/c/d/1',
      'b/c/d/2',
      'b/c/e/1',
      'b/c/e/2',
    ], f => f)).toMatchSnapshot();
    expect(makeTree([
      'a/1',
      'a/2',
      'b/c/d/1',
      'b/c/d/2',
      'b/c/e/1',
      'b/c/e/2',
    ], f => f)).toMatchSnapshot();
  });
});
