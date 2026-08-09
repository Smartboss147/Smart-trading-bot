const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/app\.post\("\/api\/withdraw", \(req, res\) => \{\n\n  if \(\!currentDb/m, 'app.post("/api/withdraw", (req, res) => {\n  const currentDb = readDb();\n  if (!currentDb');

content = content.replace(/app\.post\("\/api\/deposit", async \(req, res\) => \{\n\n  if \(\!currentDb/m, 'app.post("/api/deposit", async (req, res) => {\n  const currentDb = readDb();\n  if (!currentDb');

fs.writeFileSync('server.ts', content);
