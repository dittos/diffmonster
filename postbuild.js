const fs = require('fs');
const child_process = require('child_process');

const result = child_process.execSync('git log --oneline -1', { encoding: 'utf8' });
fs.appendFileSync('build/index.html', '\n<!-- ' + result.trim() + ' -->');