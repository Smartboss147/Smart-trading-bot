import React, { useState } from "react";
import { Balance, CurrencySymbol } from "../types";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, ShieldCheck } from "lucide-react";

interface PortfolioViewProps {
  balances: Balance[];
  trades: any[];
}

export function PortfolioView({ balances, trades }: PortfolioViewProps) {
  const [currency, setCurrency] = useState<CurrencySymbol>("NGN");
  const exchangeRateNgn = 1500;

  const totalUsd = balances.reduce((acc, b) => acc + (b.usdValue || 0), 0);
  const totalNgn = totalUsd * exchangeRateNgn;

  const realizedProfit = trades.reduce((acc, t) => acc + (t.netProfit || 0), 0);
  const realizedProfitNgn = realizedProfit * exchangeRateNgn;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Currency Toggle */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" /> Portfolio & Real Balances
          </h2>
          <p className="text-xs text-slate-400 mt-1">Live balances synchronized from connected exchange vaults.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-800">
          <span className="text-xs text-slate-400 px-2 uppercase font-mono">Display Currency:</span>
          {(["NGN", "USD", "EUR"] as CurrencySymbol[]).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                currency === c ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {c === "NGN" ? "₦ NGN" : c === "USD" ? "$ USD" : "€ EUR"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-2">
          <div className="text-xs font-medium text-slate-400 uppercase">Total Portfolio Value</div>
          <div className="text-2xl font-mono font-bold text-slate-100">
            {currency === "NGN" ? `₦${totalNgn.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          </div>
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Synchronized with Exchange Vaults
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-2">
          <div className="text-xs font-medium text-slate-400 uppercase">Realized P/L</div>
          <div className={`text-2xl font-mono font-bold ${realizedProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {currency === "NGN" ? `₦${realizedProfitNgn.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${realizedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          </div>
          <div className="text-xs text-slate-400">Calculated from closed trades</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-2">
          <div className="text-xs font-medium text-slate-400 uppercase">Connected Exchanges</div>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {new Set(balances.map(b => b.exchange)).size} Active Vaults
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> API Security Verified
          </div>
        </div>
      </div>

      {/* Balances Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-100">Exchange Asset Balances</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase">
                <th className="p-3">Asset</th>
                <th className="p-3">Exchange</th>
                <th className="p-3">Available</th>
                <th className="p-3">Locked</th>
                <th className="p-3">Total</th>
                <th className="p-3 text-right">Value ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs font-mono">
              {balances.map((b, idx) => {
                const val = currency === "NGN" ? (b.usdValue || 0) * exchangeRateNgn : (b.usdValue || 0);
                return (
                  <tr key={idx} className="hover:bg-slate-850">
                    <td className="p-3 font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {b.asset}
                    </td>
                    <td className="p-3 text-slate-400">{b.exchange}</td>
                    <td className="p-3 text-emerald-400">{b.free.toLocaleString()}</td>
                    <td className="p-3 text-amber-400">{b.locked.toLocaleString()}</td>
                    <td className="p-3 text-slate-200 font-bold">{b.total.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-100">
                      {currency === "NGN" ? `₦${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
