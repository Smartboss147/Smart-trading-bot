import React from "react";
import { Zap, Activity, Globe, Shield } from "lucide-react";
import { Market, ArbitrageOpportunity, SystemHealth } from "../types";

interface IpadMonitorModeProps {
  markets: Market[];
  opportunities: ArbitrageOpportunity[];
  systemHealth: SystemHealth | null;
  onExit: () => void;
}

export function IpadMonitorMode({ markets, opportunities, systemHealth, onExit }: IpadMonitorModeProps) {
  return (
    <div className="fixed inset-0 bg-slate-950 z-50 p-6 flex flex-col space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-emerald-400 animate-pulse" />
          <h1 className="text-xl font-bold font-mono tracking-wider text-cyan-400">APEXQUANT // IPAD MONITORING MODE</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-400">
            LATENCY: {systemHealth?.dataLatencyMs || 24}ms
          </div>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded"
          >
            Exit Monitor Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Arbitrage Opportunities Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Live Arbitrage Spreads ({opportunities.length})
          </h2>
          <div className="space-y-3 font-mono text-xs">
            {opportunities.map(opp => (
              <div key={opp.id} className="bg-slate-950 p-3.5 rounded border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100 text-sm">{opp.symbol}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{opp.route}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold text-sm">+{opp.netEdgePercent.toFixed(2)}% Net Edge</div>
                  <div className="text-slate-400 text-[11px]">Est Profit: ${opp.estimatedProfitUsd.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Markets Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            Active Markets Ticker
          </h2>
          <div className="space-y-2 font-mono text-xs">
            {markets.slice(0, 8).map(m => (
              <div key={m.symbol} className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-100">{m.symbol}</span>
                <span className="text-emerald-400">${m.bid.toLocaleString()}</span>
                <span className="text-rose-400">${m.ask.toLocaleString()}</span>
                <span className="text-cyan-400">{m.dataAgeMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
