import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { Balance, LedgerEntry, DepositRecord, TradingMode } from '../types';

interface WalletProps {
  tradingMode: TradingMode;
  onNavigate: (tab: string) => void;
}

export const Wallet: React.FC<WalletProps> = ({ tradingMode, onNavigate }) => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [deposits, setDeposits] = useState<DepositRecord[]>([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wallet");
      if (!res.ok) throw new Error("Failed to load wallet data");
      const data = await res.json();
      setBalances(data.balances);
      setLedger(data.ledger);
      setDeposits(data.deposits);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [tradingMode]);

  const handleDeposit = async () => {
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

  const handleWithdrawClick = () => {
    if (!amount || Number(amount) <= 0) return;
    setShowWithdrawModal(true);
    setAuthCode('');
  };

  const confirmWithdraw = async () => {
    if (!authCode || authCode.length < 6) {
      alert("Please enter a valid 6-digit 2FA code.");
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
      
      setAmount('');
      setShowWithdrawModal(false);
      fetchWallet();
      
      // We know it takes 3 seconds in our simulated backend, so let's refresh after 4 seconds
      setTimeout(fetchWallet, 4000);
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (tradingMode === "PAPER") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
        <WalletIcon className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-slate-300 mb-2">Live Wallet Disabled</h2>
        <p className="text-center max-w-md">
          You are currently in PAPER trading mode. Switch to LIVE trading mode to manage your real-money wallet.
        </p>
      </div>
    );
  }

  const ngnBalance = balances.find(b => b.asset === "NGN")?.free || 0;
  const lockedBalance = balances.find(b => b.asset === "NGN")?.locked || 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full overflow-hidden p-6 gap-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <WalletIcon className="w-5 h-5 text-amber-400" />
          Real Money Wallet
        </h1>
        <button onClick={fetchWallet} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchWallet} className="ml-auto underline text-sm">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Available Balance</div>
          <div className="text-3xl font-bold text-slate-100 font-mono tracking-tight">
            ₦{ngnBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between opacity-70">
          <div className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Locked Funds</div>
          <div className="text-2xl font-semibold text-slate-300 font-mono tracking-tight">
            ₦{lockedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="text-slate-400 text-sm mb-4 uppercase tracking-wider font-semibold">Transfer Funds</div>
          <div className="flex gap-2">
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount NGN" 
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleDeposit} disabled={!amount} className="flex-1 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
              <ArrowDownRight className="w-4 h-4" /> Deposit
            </button>
            <button onClick={handleWithdrawClick} disabled={!amount} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
              <ArrowUpRight className="w-4 h-4" /> Withdraw
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-slate-200">Deposit History</h3>
          </div>
          <div className="flex-1 overflow-auto p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500">No deposit history found.</td>
                  </tr>
                ) : deposits.map(d => (
                  <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 text-slate-400">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-slate-200 font-mono tracking-tight">₦{d.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${d.status === 'SUCCESSFUL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : d.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-semibold text-slate-200">Ledger Transactions</h3>
          </div>
          <div className="flex-1 overflow-auto p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-slate-500">No ledger entries found.</td>
                  </tr>
                ) : ledger.map(l => (
                  <tr key={l.id} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-200">{l.transactionType}</div>
                      <div className="text-[10px] text-slate-500">{new Date(l.createdAt).toLocaleString()}</div>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono tracking-tight ${l.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {l.direction === 'CREDIT' ? '+' : '-'}₦{l.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400 font-mono tracking-tight">
                      ₦{l.balanceAfter.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-700 p-6 rounded-xl shadow-xl shadow-black/50 max-w-sm w-full">
            <h2 className="text-lg font-bold text-slate-100 mb-2">Security Verification</h2>
            <p className="text-sm text-slate-400 mb-6">
              To withdraw <strong>₦{Number(amount).toLocaleString()}</strong>, please enter your 6-digit 2FA code.
            </p>
            
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">2FA Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-lg text-center tracking-[0.5em] text-slate-200 outline-none focus:border-amber-500 font-mono"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWithdrawModal(false)} 
                disabled={withdrawLoading}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmWithdraw}
                disabled={authCode.length < 6 || withdrawLoading}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {withdrawLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
