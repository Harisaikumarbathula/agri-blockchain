const fs = require('fs');
const content = fs.readFileSync('test.log', 'utf16le');
fs.writeFileSync('test-utf8.log', content, 'utf8');
