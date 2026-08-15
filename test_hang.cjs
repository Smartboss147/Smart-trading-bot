const http = require('http');

async function test() {
  const endpoints = [
    "/api/markets",
    "/api/opportunities",
    "/api/orders",
    "/api/trades",
    "/api/balances",
    "/api/risk-settings",
    "/api/exchanges",
    "/api/audit-logs",
    "/api/analytics",
    "/api/trading/live-readiness"
  ];

  console.log("Sending requests...");
  const promises = endpoints.map(ep => {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const req = http.get("http://localhost:3000" + ep, (res) => {
        resolve(`${ep}: ${res.statusCode} in ${Date.now() - start}ms`);
      });
      req.on('error', reject);
      req.end();
    });
  });

  const results = await Promise.all(promises);
  results.forEach(r => console.log(r));
}
test();
