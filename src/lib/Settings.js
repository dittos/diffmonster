var KEY_FILE_TREE_WIDTH = 'fileTreeWidth';

function read(key, defaultValue) {
  const value = window.localStorage.getItem(key);
  if (value == null) {
    return defaultValue;
  }
  return JSON.parse(value);
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

var fileTreeWidth = read(KEY_FILE_TREE_WIDTH, 400);

export function getFileTreeWidth() {
  return fileTreeWidth;
}

export function setFileTreeWidth(value) {
  write(KEY_FILE_TREE_WIDTH, value);
  fileTreeWidth = value;
}