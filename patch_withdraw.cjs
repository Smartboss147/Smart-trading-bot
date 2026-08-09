const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /  \/\/ Simulate payment provider processing the withdrawal asynchronously\n  setTimeout\(\(\) => \{[\s\S]*?\}, 3000\);\n/m;
content = content.replace(regex, '');
fs.writeFileSync('server.ts', content);
