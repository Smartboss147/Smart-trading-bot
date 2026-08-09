import React, { useState } from "react";
import { Settings, ShieldAlert, Check, X, AlertCircle, ArrowRight, Key } from "lucide-react";
import { RiskSettings, LiveReadiness, SystemHealth } from "../types";
import { Activity, Zap, Wifi, WifiOff } from "lucide-react";

interface RiskAndStrategyProps {
  riskSettings: RiskSettings | null;
  liveReadiness: LiveReadiness | null;
  systemHealth: SystemHealth | null;
  onUpdateRiskSettings: (newSettings: Partial<RiskSettings>) => void;
  onToggleTradingMode: (mode: "PAPER" | "LIVE", confirmed?: boolean) => Promise<boolean>;
  onNavigateToExchanges?: () => void;
}

export function RiskAndStrategy({ 
  riskSettings, 
  liveReadiness, 
  systemHealth,
  onUpdateRiskSettings, 
  onToggleTradingMode,
  onNavigateToExchanges 
}: RiskAndStrategyProps) {
  const [minEdge, setMinEdge] = useState(riskSettings?.minNetEdgePercent || 0.15);
  const [maxTrade, setMaxTrade] = useState(riskSettings?.maxTradeSizeUsd || 100);
  const [maxLoss, setMaxLoss] = useState(riskSettings?.maxDailyLossUsd || 25);
  const [maxSlippage, setMaxSlippage] = useState(riskSettings?.maxSlippagePercent || 0.08);
  const [maxConcurrent, setMaxConcurrent] = useState(riskSettings?.maxConcurrentTrades || 3);
  const [showLiveConfirm, setShowLiveConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRiskSettings({
      minNetEdgePercent: Number(minEdge),
      maxTradeSizeUsd: Number(maxTrade),
      maxDailyLossUsd: Number(maxLoss),
      maxSlippagePercent: Number(maxSlippage),
      maxConcurrentTrades: Number(maxConcurrent),
    });
  };

  const isLive = riskSettings?.tradingMode === "LIVE";
  const isReady = liveReadiness?.ready || false;

  const handleSwitchToLive = async () => {
    setErrorMsg(null);
    if (!isReady) {
      setErrorMsg(liveReadiness?.reason || "Live trading is not ready. Connect and verify an exchange account before enabling live execution.");
      return;
    }
    setShowLiveConfirm(true);
  };

  const confirmEnableLive = async () => {
    setErrorMsg(null);
    const success = await onToggleTradingMode("LIVE", true);
    if (success) {
      setShowLiveConfirm(false);
    } else if (liveReadiness?.reason) {
      setErrorMsg(liveReadiness.reason);
      setShowLiveConfirm(false);
    }
  };

  const readinessItems = [
    { label: "Exchange connected", status: liveReadiness?.exchangeConnected ?? false },
    { label: "API authenticated", status: liveReadiness?.credentialsValid ?? false },
    { label: "Trading permission available", status: liveReadiness?.tradingPermission ?? false },
    { label: "Live market data available", status: liveReadiness?.marketDataAvailable ?? false },
    { label: "Account balance available", status: liveReadiness?.accountAccessible ?? false },
    { label: "Risk limits configured", status: liveReadiness?.riskManagementConfigured ?? false },
    { label: "Kill switch operational", status: liveReadiness?.killSwitchAvailable ?? false },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Real-time Market Connectivity Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          systemHealth?.exchangeWs === 'CONNECTED' 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-rose-500/10 border-rose-500/30 text-rose-400"
        }`}>
          <div className="p-2 rounded bg-white/5">
            {systemHealth?.exchangeWs === 'CONNECTED' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Gate.io WebSocket</div>
            <div className="text-sm font-bold">{systemHealth?.exchangeWs || 'DISCONNECTED'}</div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border flex items-center gap-3 ${
          liveReadiness?.marketDataAvailable 
            ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}>
          <div className="p-2 rounded bg-white/5">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Market Data Feed</div>
            <div className="text-sm font-bold">{liveReadiness?.marketDataAvailable ? 'LIVE' : 'OFFLINE / STALE'}</div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-slate-900 border-slate-800 flex items-center gap-3 text-slate-300">
          <div className="p-2 rounded bg-white/5">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Last Update</div>
            <div className="text-sm font-bold">
              {systemHealth?.dataLatencyMs !== undefined 
                ? `${Math.max(0, Math.floor(systemHealth.dataLatencyMs / 1000))}s ago` 
                : '---'}
            </div>
          </div>
        </div>
      </div>

      {/* Execution Trading Mode & Readiness */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Execution Trading Mode</h2>
            <p className="text-xs text-slate-400 mt-1">
              Live execution submits actual orders through official exchange APIs. Paper trading simulates fills using real market feeds.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded text-xs font-bold ${
              isLive ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            }`}>
              {isLive ? "LIVE TRADING ACTIVE" : "PAPER TRADING ACTIVE"}
            </div>
            <div className={`px-3 py-1 rounded text-xs font-bold ${
              isReady ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
            }`}>
              {isReady ? "LIVE READY" : "LIVE NOT READY"}
            </div>
          </div>
        </div>

        {/* Readiness Checklist */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Readiness Checklist</span>
            {!isReady && (
              <span className="text-[11px] text-rose-400 font-normal lowercase">
                ({readinessItems.filter(i => !i.status).length} required item missing)
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {readinessItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800/50">
                {item.status ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3" />
                  </div>
                )}
                <span className={item.status ? "text-slate-200" : "text-slate-400"}>{item.label}</span>
              </div>
            ))}
          </div>

          {!isReady && liveReadiness?.reason && (
            <div className="pt-2 text-xs text-rose-300 bg-rose-950/30 border border-rose-800/40 p-2.5 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-200 block">LIVE TRADING UNAVAILABLE</span>
                <span>{liveReadiness.reason}</span>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs text-rose-200 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Live Mode Error</div>
              <div>{errorMsg}</div>
            </div>
            {onNavigateToExchanges && (
              <button
                onClick={onNavigateToExchanges}
                className="px-2.5 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded font-bold text-[11px] shrink-0 flex items-center gap-1"
              >
                <Key className="w-3 h-3" /> Connect Exchange
              </button>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              setErrorMsg(null);
              onToggleTradingMode("PAPER");
            }}
            className={`w-full sm:flex-1 py-3 rounded font-bold text-xs uppercase tracking-wider transition-all ${
              !isLive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
            }`}
          >
            Switch to Paper Trading
          </button>
          
          <button
            onClick={handleSwitchToLive}
            disabled={!isReady && !isLive}
            className={`w-full sm:flex-1 py-3 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              isLive
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
                : isReady
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20"
                : "bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed opacity-60"
            }`}
          >
            Switch to Live Trading
          </button>

          {!isReady && onNavigateToExchanges && (
            <button
              onClick={onNavigateToExchanges}
              className="w-full sm:w-auto px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/20 shrink-0"
            >
              <Key className="w-4 h-4" /> Go to Exchange Connections
            </button>
          )}
        </div>

        {showLiveConfirm && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>WARNING: Enabling Live Trading Mode</span>
            </div>
            <p className="text-slate-300">
              Live trading will submit real financial orders using connected exchange API credentials. Ensure risk parameters, API key permissions, and balance allocations are correctly configured.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={confirmEnableLive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex items-center gap-1.5"
              >
                I Understand, Enable Live Trading
              </button>
              <button
                onClick={() => setShowLiveConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Risk Parameters Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">Server-Side Risk Management Rules</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Minimum Net Edge (%)</label>
              <input
                type="number"
                step="0.01"
                value={minEdge}
                onChange={e => setMinEdge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Maximum Trade Size ($ USD)</label>
              <input
                type="number"
                value={maxTrade}
                onChange={e => setMaxTrade(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Maximum Daily Loss ($ USD)</label>
              <input
                type="number"
                value={maxLoss}
                onChange={e => setMaxLoss(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Maximum Slippage (%)</label>
              <input
                type="number"
                step="0.01"
                value={maxSlippage}
                onChange={e => setMaxSlippage(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Maximum Concurrent Trades</label>
              <input
                type="number"
                value={maxConcurrent}
                onChange={e => setMaxConcurrent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 shadow-lg shadow-cyan-600/20"
            >
              <Check className="w-4 h-4" /> Save Risk Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
