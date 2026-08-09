import React from "react";
import { Activity, ShieldAlert, Zap, Terminal, BarChart2, Cpu, Settings, Key, Globe, Eye, Wallet, TrendingUp } from "lucide-react";
import { RiskSettings, SystemHealth } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  riskSettings: RiskSettings | null;
  systemHealth: SystemHealth | null;
  onToggleKillSwitch: () => void;
  totalBalanceUsd: number;
}

export function Navbar({ activeTab, setActiveTab, riskSettings, systemHealth, onToggleKillSwitch, totalBalanceUsd }: NavbarProps) {
  const killSwitchActive = riskSettings?.killSwitchActive || false;
  const isLive = riskSettings?.tradingMode === "LIVE";

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Mode */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold tracking-wider text-lg bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                APEXQUANT
              </h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Multi-Market Arbitrage Terminal</p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block" />

          {/* Paper / Live Badge */}
          <div className={`px-2.5 py-1 rounded text-xs font-semibold tracking-wide flex items-center gap-1.5 ${
            isLive ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            {isLive ? "LIVE TRADING" : "PAPER TRADING"}
          </div>

          {/* Latency badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-cyan-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>{systemHealth?.dataLatencyMs || 24}ms</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart2 },
            { id: "wallet", label: "Live Wallet", icon: Wallet },
            { id: "trade", label: "Trade (NGN)", icon: TrendingUp },
            { id: "portfolio", label: "Portfolio", icon: BarChart2 },
            { id: "scanner", label: "Market Scanner", icon: Globe },
            { id: "arbitrage", label: "Arbitrage Feed", icon: Zap },
            { id: "terminal", label: "Chart & Book", icon: Activity },
            { id: "orders", label: "Orders & Trades", icon: Cpu },
            { id: "risk", label: "Risk & Strategy", icon: Settings },
            { id: "exchanges", label: "Exchanges", icon: Key },
            { id: "admin", label: "Admin & Audit", icon: ShieldAlert },
            { id: "ipad", label: "iPad Monitor", icon: Eye },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right side status & Kill Switch */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase">Total Portfolio</div>
            <div className="text-sm font-mono font-bold text-slate-100">${totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>

          <button
            onClick={onToggleKillSwitch}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md ${
              killSwitchActive
                ? "bg-red-600 text-white animate-bounce shadow-red-600/50"
                : "bg-red-950/80 text-red-400 border border-red-800/60 hover:bg-red-900/80 hover:text-red-200"
            }`}
            title="Emergency Kill Switch - Stops all trading & cancels open orders instantly"
          >
            <ShieldAlert className="w-4 h-4" />
            {killSwitchActive ? "KILL SWITCH ACTIVE" : "KILL SWITCH"}
          </button>
        </div>
      </div>
    </header>
  );
}
