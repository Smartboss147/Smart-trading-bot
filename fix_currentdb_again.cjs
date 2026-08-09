const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// The replacement script had some failures because the regex missed the first occurrence maybe, or I used `async` / lack thereof wrongly.

content = content.replace(/app\.get\("\/api\/wallet", async \(req, res\) => \{\n\s+let liveBalances = currentDb/m, 'app.get("/api/wallet", async (req, res) => {\n  const currentDb = readDb();\n  let liveBalances = currentDb');

fs.writeFileSync('server.ts', content);
