const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/execute-arbitrage", \(req, res\) => \{/m;
const replacement = `app.post("/api/execute-arbitrage", (req, res) => {
  const currentDb = readDb();
  if (currentDb.riskSettings.tradingMode === "LIVE") {
    return res.status(501).json({ error: "Live arbitrage execution requires verified API keys for multiple exchanges. Only Gate.io is currently connected in live mode." });
  }
`;

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
