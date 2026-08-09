const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\("\/api\/deposit", \(req, res\) => \{[\s\S]*?\n\}\);\n/m;
const replacement = `app.post("/api/deposit", async (req, res) => {
  const currentDb = readDb();
  if (!currentDb.deposits) currentDb.deposits = [];
  if (!currentDb.ledger) currentDb.ledger = [];
  if (!currentDb.auditLogs) currentDb.auditLogs = [];
  
  const { amount } = req.body;
  if (!amount || amount < 1000) {
    return res.status(400).json({ error: "Minimum deposit is ₦1,000" });
  }

  const reference = \`dep-\${Date.now()}\`;
  
  const deposit = {
    id: reference,
    userId: "user-1",
    amount: amount,
    currency: "NGN",
    paymentMethod: "PAYSTACK",
    reference: reference,
    status: "PENDING",
    mode: "LIVE",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  currentDb.deposits.unshift(deposit);
  writeDb(currentDb);
  
  if (paystackClient) {
    try {
      const response = await paystackClient.transaction.initialize({
        amount: amount * 100, // Paystack expects kobo
        email: "user-1@apexquant.test",
        reference: reference,
        callback_url: "http://localhost:3000/wallet" // Or wherever frontend is
      });
      return res.json({ success: true, authorization_url: response.data.authorization_url, deposit });
    } catch (err) {
      console.error("Paystack init error", err);
      // Fallback for simulation if paystack fails or isn't fully set up in sandbox
      return res.json({ success: true, deposit, warning: "Paystack initialization failed, using mock." });
    }
  }

  res.json({ success: true, deposit });
});
`;

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
