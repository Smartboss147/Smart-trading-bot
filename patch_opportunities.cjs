const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /const broadcastData = JSON\.stringify\(\{[\s\S]*?opportunities: liveOpportunities,[\s\S]*?\}\);/m;
const replacement = `const mode = readDb().riskSettings.tradingMode;
  const broadcastData = JSON.stringify({
    type: "MARKET_UPDATE",
    timestamp: now,
    markets: Array.from(marketsMap.values()),
    opportunities: mode === "LIVE" ? [] : liveOpportunities,
    systemHealth: {
      exchangeWs: "CONNECTED",
      restApi: "CONNECTED",
      database: "HEALTHY",
      marketData: "LIVE",
      dataLatencyMs: systemLatency,
      executionEngine: db.riskSettings.killSwitchActive ? "STOPPED" : "READY",
      riskEngine: db.riskSettings.killSwitchActive ? "TRIGGERED" : "ACTIVE",
      activeStrategiesCount: 2,
      uptimeSeconds: Math.floor(process.uptime())
    }
  });`;

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
