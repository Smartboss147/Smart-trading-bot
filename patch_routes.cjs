const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// The error is because in some routes we deleted `const currentDb = readDb();`
// We should re-add it or use `db`. Actually, earlier I made it so we removed `const currentDb = readDb();` accidentally.

content = content.replace(
  /app\.get\("\/api\/analytics", \(req, res\) => \{\n  const mode = currentDb/m,
  'app.get("/api/analytics", (req, res) => {\n  const currentDb = readDb();\n  const mode = currentDb'
);

content = content.replace(
  /app\.get\("\/api\/audit-logs", \(req, res\) => \{\n  res\.json\(currentDb/m,
  'app.get("/api/audit-logs", (req, res) => {\n  const currentDb = readDb();\n  res.json(currentDb'
);

content = content.replace(
  /app\.get\("\/api\/wallet", async \(req, res\) => \{\n  let liveBalances = currentDb/m,
  'app.get("/api/wallet", async (req, res) => {\n  const currentDb = readDb();\n  let liveBalances = currentDb'
);

content = content.replace(
  /app\.post\("\/api\/deposit", async \(req, res\) => \{\n  if \(\!currentDb/m,
  'app.post("/api/deposit", async (req, res) => {\n  const currentDb = readDb();\n  if (!currentDb'
);

content = content.replace(
  /app\.post\("\/api\/webhook\/paystack", \(req, res\) => \{\n  \/\/ Mock Paystack/m,
  'app.post("/api/webhook/paystack", (req, res) => {\n  const currentDb = readDb();\n  // Mock Paystack'
);

content = content.replace(
  /app\.post\("\/api\/withdraw", \(req, res\) => \{\n  if \(\!currentDb/m,
  'app.post("/api/withdraw", (req, res) => {\n  const currentDb = readDb();\n  if (!currentDb'
);


fs.writeFileSync('server.ts', content);
