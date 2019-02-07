import { DiffFile } from "./DiffParser";

function defaultGetFilename(file: DiffFile): string {
  return file.filename;
}

export interface FileTreeNode<File = DiffFile> {
  name: string;
  dirs: {[key: string]: FileTreeNode<File>};
  files?: File[];
}

export function makeTree<T extends DiffFile>(files: T[], getFilename: (file: T) => string = defaultGetFilename): FileTreeNode<T> {
  const tree: FileTreeNode<T> = {name: '', dirs: {}};
  for (let file of files) {
    const parts = getFilename(file).split('/');
    parts.pop();
    var curNode = tree;
    for (let dir of parts) {
      if (!curNode.dirs[dir])
        curNode.dirs[dir] = {name: dir, dirs: {}};
      curNode = curNode.dirs[dir];
    }
    if (!curNode.files)
      curNode.files = [];
    curNode.files.push(file);
  }
  for (let dir of Object.keys(tree.dirs)) {
    const merged = mergeTreePaths(tree.dirs[dir]);
    delete tree.dirs[dir];
    tree.dirs[merged.name] = merged;
  }
  return tree;
}

function mergeTreePaths<T extends DiffFile>(tree: FileTreeNode<T>) {
  const dirs = Object.keys(tree.dirs);
  const merged = tree;
  if (dirs.length === 1 && !tree.files) {
    const dir = tree.dirs[dirs[0]];
    tree = mergeTreePaths({
      name: tree.name + '/' + dir.name,
      dirs: dir.dirs,
      files: dir.files
    });
  } else {
    for (let dir of dirs) {
      merged.dirs[dir] = mergeTreePaths(tree.dirs[dir]);
    }
  }
  return tree;
}
