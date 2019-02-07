var KEY_FILE_TREE_WIDTH = 'fileTreeWidth';

function read<T>(key: string, defaultValue: T): T {
  const value = window.localStorage.getItem(key);
  if (value == null) {
    return defaultValue;
  }
  return JSON.parse(value);
}

function write<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

var fileTreeWidth = read(KEY_FILE_TREE_WIDTH, 400);

export function getFileTreeWidth() {
  return fileTreeWidth;
}

export function setFileTreeWidth(value: number) {
  write(KEY_FILE_TREE_WIDTH, value);
  fileTreeWidth = value;
}