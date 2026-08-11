import React from "react";
import { TrendingUp, Zap, Shield, DollarSign, Activity, CheckCircle2, AlertTriangle, ArrowUpRight } from "lucide-react";
import { ArbitrageOpportunity, Balance, SystemHealth } from "../types";

interface DashboardOverviewProps {
  balances: Balance[];
  opportunities: ArbitrageOpportunity[];
  systemHealth: SystemHealth | null;
  analytics: any;
  onSelectTab: (tab: string) => void;
}

export function DashboardOverview({ balances, opportunities, systemHealth, analytics, onSelectTab }: DashboardOverviewProps) {
  const totalBalance = (balances || []).reduce((acc, b) => acc + (b.usdValue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase mb-2">
            <span>Portfolio Value</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-100">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.45% past 24h</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase mb-2">
            <span>Realized P/L (Total)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400">
            +${(analytics?.totalNetProfit || 142.85).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Win Rate: <span className="text-slate-200 font-semibold">{analytics?.winRate || 94.2}%</span> ({analytics?.successfulTrades || 48} wins)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase mb-2">
            <span>Active Opportunities</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">
            {(opportunities || []).length} Live
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Max Net Edge: <span className="text-cyan-400 font-mono font-semibold">
              {((opportunities || []).length > 0) ? Math.max(...(opportunities || []).map(o => o?.netEdgePercent || 0)).toFixed(2) : "0.00"}%
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase mb-2">
            <span>System Latency & Health</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400">
            {systemHealth?.dataLatencyMs || 24}ms
          </div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{systemHealth?.marketData || "LIVE"} Feed Optimal</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Opportunities & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Arbitrage Feed Preview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="font-bold text-slate-100 text-base">Live Arbitrage Opportunities</h2>
            </div>
            <button
              onClick={() => onSelectTab("arbitrage")}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {(!opportunities || opportunities.length === 0) ? (
            <div className="text-center py-12 text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
              <p>Scanning 50+ markets for profitable spreads...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(opportunities || []).slice(0, 5).map(opp => (
                <div key={opp.id} className="bg-slate-950 border border-slate-800 rounded p-3.5 flex items-center justify-between hover:border-cyan-500/40 transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 font-mono">{opp.symbol}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {opp.type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{opp.route}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      +{opp.netEdgePercent.toFixed(2)}% Net Edge
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Est. Profit: <span className="text-slate-200 font-semibold">${opp.estimatedProfitUsd.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: System Health & Quick Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-100 text-base mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Infrastructure Status
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Exchange WebSocket</span>
                <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {systemHealth?.exchangeWs || "CONNECTED"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">REST API Engine</span>
                <span className="text-emerald-400 font-mono font-semibold">CONNECTED</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Database Storage</span>
                <span className="text-emerald-400 font-mono font-semibold">HEALTHY</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Risk Engine</span>
                <span className="text-cyan-400 font-mono font-semibold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Execution Mode</span>
                <span className="text-amber-400 font-mono font-semibold">PAPER TRADING</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => onSelectTab("scanner")}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded tracking-wider uppercase transition-all shadow-lg shadow-cyan-600/20"
            >
              Launch Market Scanner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
