const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'import { ApiClient } from "gate-api";',
  'import { ApiClient, SpotApi } from "gate-api";'
);
fs.writeFileSync('server.ts', code);
