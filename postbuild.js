const fs = require('fs');
const child_process = require('child_process');
const serialize = require('serialize-javascript');

const result = child_process.execSync('git log --oneline -1', { encoding: 'utf8' });
const html = fs.readFileSync('build/index.html', { encoding: 'utf8' });
fs.writeFileSync('build/index.html', html.replace('</head>', '<script>BUILD_INFO = ' + serialize(result.trim()) + '</script></head>'));