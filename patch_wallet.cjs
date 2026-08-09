const fs = require('fs');

let content = fs.readFileSync('src/components/Wallet.tsx', 'utf8');

// Replace the handleDeposit function
const handleDepositRegex = /const handleDeposit = async \(\) => \{[\s\S]*?\n  \};\n/m;
const newHandleDeposit = `const handleDeposit = async () => {
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert(data.warning || "Deposit initiated. Waiting for webhook confirmation.");
      }
      
      setAmount('');
      fetchWallet();
    } catch (err: any) {
      alert(err.message);
    }
  };
`;
content = content.replace(handleDepositRegex, newHandleDeposit);

// Replace the handleWithdraw function (remove setTimeout mock)
const handleWithdrawRegex = /const handleWithdraw = async \(\) => \{[\s\S]*?setWithdrawLoading\(false\);\n    \}\n  \};\n/m;
const newHandleWithdraw = `const handleWithdraw = async () => {
    if (authCode.length < 6) {
      alert("Please enter a valid 2FA code");
      return;
    }
    try {
      setWithdrawLoading(true);
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), authCode })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setShowWithdrawModal(false);
      setAmount('');
      setAuthCode('');
      
      alert("Withdrawal request submitted. It will be processed shortly.");
      fetchWallet();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };
`;
content = content.replace(handleWithdrawRegex, newHandleWithdraw);

fs.writeFileSync('src/components/Wallet.tsx', content);
