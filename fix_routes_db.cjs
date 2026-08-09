const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// The earlier regex replace was flawed and didn't add the line because of how regex dotall didn't match correctly or something.
// We'll just replace the lines.
content = content.replace(/app\.get\("\/api\/opportunities", \(req, res\) => \{\s+if \(currentDb/m, 'app.get("/api/opportunities", (req, res) => {\n  const currentDb = readDb();\n  if (currentDb');
content = content.replace(/app\.get\("\/api\/orders", \(req, res\) => \{\s+const mode = currentDb/m, 'app.get("/api/orders", (req, res) => {\n  const currentDb = readDb();\n  const mode = currentDb');
content = content.replace(/app\.get\("\/api\/trades", \(req, res\) => \{\s+const mode = currentDb/m, 'app.get("/api/trades", (req, res) => {\n  const currentDb = readDb();\n  const mode = currentDb');
content = content.replace(/app\.get\("\/api\/balances", async \(req, res\) => \{\s+const mode = currentDb/m, 'app.get("/api/balances", async (req, res) => {\n  const currentDb = readDb();\n  const mode = currentDb');
content = content.replace(/app\.get\("\/api\/risk-settings", \(req, res\) => \{\s+res\.json\(currentDb/m, 'app.get("/api/risk-settings", (req, res) => {\n  const currentDb = readDb();\n  res.json(currentDb');
content = content.replace(/app\.post\("\/api\/risk-settings", \(req, res\) => \{\s+currentDb/m, 'app.post("/api/risk-settings", (req, res) => {\n  const currentDb = readDb();\n  currentDb');
content = content.replace(/app\.get\("\/api\/exchanges", \(req, res\) => \{\s+res\.json\(currentDb/m, 'app.get("/api/exchanges", (req, res) => {\n  const currentDb = readDb();\n  res.json(currentDb');

fs.writeFileSync('server.ts', content);
