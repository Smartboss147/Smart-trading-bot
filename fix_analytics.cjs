const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/app\.get\("\/api\/analytics", \(req, res\) => \{\n\s+const mode = currentDb/m, 'app.get("/api/analytics", (req, res) => {\n  const currentDb = readDb();\n  const mode = currentDb');

content = content.replace(/app\.get\("\/api\/audit-logs", \(req, res\) => \{\n\s+res\.json\(currentDb/m, 'app.get("/api/audit-logs", (req, res) => {\n  const currentDb = readDb();\n  res.json(currentDb');

fs.writeFileSync('server.ts', content);
