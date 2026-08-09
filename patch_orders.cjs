const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/orders", \(req, res\) => \{[\s\S]*?\n\}\);\n/m;
const newRoute = `app.post("/api/orders", async (req, res) => {
  const currentDb = readDb();
  if (currentDb.riskSettings.killSwitchActive) {
    return res.status(400).json({ error: "Kill switch is active. No new orders permitted." });
  }

  const { exchange, symbol, side, quantity, price, strategy, amountNgn } = req.body;
  const now = Date.now();
  const tradingMode = currentDb.riskSettings.tradingMode;

  if (tradingMode === "LIVE") {
    if (!spotApi) {
      return res.status(503).json({ error: "Exchange unavailable: Gate.io API keys missing or invalid" });
    }

    try {
      const gateOrder = {
        currencyPair: symbol.replace("USDT", "_USDT"),
        side: side === "BUY" ? "buy" : "sell",
        amount: quantity.toString(),
        price: price.toString(),
        type: "limit",
        timeInForce: "ioc"
      };

      const response = await spotApi.createOrder(gateOrder);
      const orderData = response.body;

      if (orderData.status === "cancelled" || orderData.filledTotal === "0") {
        return res.status(400).json({ error: "Order was not filled on exchange" });
      }

      const orderId = orderData.id || \`gate-ord-\${now}\`;
      const filledQty = parseFloat(orderData.filledAmount || "0");
      const avgPrice = parseFloat(orderData.avgDealPrice || price.toString());
      const fee = parseFloat(orderData.fee || "0");

      const newOrder = {
        id: orderId.toString(),
        userId: "user-1",
        exchange: "Gate.io",
        symbol: symbol,
        strategy: strategy || "DirectTrade",
        side: side || "BUY",
        type: "LIMIT",
        quantity: quantity,
        price: price,
        filled: filledQty,
        remaining: quantity - filledQty,
        status: orderData.status === "closed" ? "FILLED" : "PARTIAL",
        mode: "LIVE",
        createdAt: now,
        updatedAt: now
      };

      const newTrade = {
        id: \`gate-trd-\${now}\`,
        userId: "user-1",
        exchange: "Gate.io",
        symbol: symbol,
        strategy: strategy || "DirectTrade",
        side: side || "BUY",
        orderId: orderId.toString(),
        quantity: filledQty,
        requestedPrice: price,
        averageFillPrice: avgPrice,
        fees: fee,
        slippage: Math.abs(avgPrice - price),
        grossProfit: 0, 
        netProfit: 0,
        status: "SUCCESS",
        mode: "LIVE",
        createdAt: now,
        completedAt: now
      };

      currentDb.orders.unshift(newOrder);
      currentDb.trades.unshift(newTrade);
      currentDb.auditLogs.unshift({
        id: \`log-\${now}\`,
        action: "ORDER_EXECUTED",
        category: "TRADE",
        details: \`Executed LIVE order for \${symbol} on Gate.io. Qty: \${filledQty}\`,
        timestamp: now,
        user: "system"
      });
      writeDb(currentDb);
      db = currentDb;
      return res.json({ success: true, order: newOrder, trade: newTrade });

    } catch (err) {
      console.error("Gate.io order execution failed:", err.response ? err.response.data : err.message);
      return res.status(500).json({ error: "Order execution failed on Gate.io" });
    }
  }

  // --- PAPER MODE ---
  const isNgnPair = symbol?.endsWith("NGN");
  const calculatedNgn = amountNgn || (quantity * price * (isNgnPair ? 1 : 1500));
  
  const paperNgnBalance = currentDb.balances.find((b) => b.asset === "NGN" && b.mode === "PAPER");
  if (!paperNgnBalance || paperNgnBalance.free < calculatedNgn) {
    return res.status(400).json({ error: "INSUFFICIENT PAPER BALANCE" });
  }
  paperNgnBalance.free -= calculatedNgn;
  paperNgnBalance.total -= calculatedNgn;

  const orderId = \`ord-\${Date.now()}\`;
  const newOrder = {
    id: orderId,
    userId: "user-1",
    exchange: exchange || "Binance",
    symbol: symbol || "BTCUSDT",
    strategy: strategy || "DirectTrade",
    side: side || "BUY",
    type: "MARKET",
    quantity: quantity || 0.01,
    price: price || 94000,
    filled: quantity || 0.01,
    remaining: 0,
    status: "FILLED",
    mode: "PAPER",
    createdAt: now,
    updatedAt: now
  };

  const netProfit = Number(((quantity * price * 0.0025)).toFixed(2));
  const newTrade = {
    id: \`trd-\${Date.now()}\`,
    userId: "user-1",
    exchange: exchange || "Binance",
    symbol: symbol || "BTCUSDT",
    strategy: strategy || "DirectTrade",
    side: side || "BUY",
    orderId,
    quantity: quantity || 0.01,
    requestedPrice: price || 94000,
    averageFillPrice: price || 94000,
    fees: Number((quantity * price * 0.00075).toFixed(4)),
    slippage: 0.02,
    grossProfit: netProfit * 1.3,
    netProfit,
    status: "SUCCESS",
    mode: "PAPER",
    createdAt: now,
    completedAt: now
  };

  if (paperNgnBalance) {
    paperNgnBalance.free += calculatedNgn + netProfit;
    paperNgnBalance.total += calculatedNgn + netProfit;
  }

  currentDb.orders.unshift(newOrder);
  currentDb.trades.unshift(newTrade);
  currentDb.auditLogs.unshift({
    id: \`log-\${now}\`,
    action: "ORDER_EXECUTED",
    category: "TRADE",
    details: \`Executed PAPER order for \${symbol}. Qty: \${quantity}\`,
    timestamp: now,
    user: "admin"
  });
  writeDb(currentDb);
  db = currentDb;
  res.json({ success: true, order: newOrder, trade: newTrade });
});
`;

content = content.replace(regex, newRoute);
fs.writeFileSync('server.ts', content);
