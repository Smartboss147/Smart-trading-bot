const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.get\("\/api\/opportunities", \(req, res\) => \{\n  res\.json\(liveOpportunities\);\n\}\);/m;
const replacement = `app.get("/api/opportunities", (req, res) => {
  const currentDb = readDb();
  if (currentDb.riskSettings.tradingMode === "LIVE") {
    res.json([]);
  } else {
    res.json(liveOpportunities);
  }
});`;

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
