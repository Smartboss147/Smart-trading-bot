import React from "react";
import { Zap, ShieldCheck, ArrowRight, Play, AlertCircle } from "lucide-react";
import { ArbitrageOpportunity, RiskSettings } from "../types";

interface ArbitrageScannerProps {
  opportunities: ArbitrageOpportunity[];
  riskSettings: RiskSettings | null;
  onExecuteOpportunity: (opp: ArbitrageOpportunity) => void;
}

export function ArbitrageScanner({ opportunities, riskSettings, onExecuteOpportunity }: ArbitrageScannerProps) {
  const isKillSwitchActive = riskSettings?.killSwitchActive || false;
  const tradingMode = riskSettings?.tradingMode || "PAPER";

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">Live Arbitrage Detection Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Continuously evaluates cross-exchange spreads, trading fees (0.075%), estimated slippage, and liquidity depth.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">Min Net Edge Threshold</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{riskSettings?.minNetEdgePercent || 0.15}%</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">Max Trade Size</div>
            <div className="text-sm font-mono font-bold text-emerald-400">${riskSettings?.maxTradeSizeUsd || 100}</div>
          </div>
        </div>
      </div>

      {isKillSwitchActive && (
        <div className="bg-red-950/60 border border-red-800/80 p-4 rounded-lg flex items-center gap-3 text-red-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-sm font-medium">Emergency Kill Switch is currently active. Execution engine is halted.</span>
        </div>
      )}

      {(!opportunities || opportunities.length === 0) ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-16 text-center">
          <Zap className="w-10 h-10 mx-auto text-slate-600 mb-3 animate-pulse" />
          <h3 className="font-bold text-slate-300 text-base">Scanning Order Books for Profitable Spreads...</h3>
          <p className="text-xs text-slate-500 mt-1">Opportunities meeting net profitability threshold will appear here instantly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(opportunities || []).map(opp => (
            <div
              key={opp.id}
              className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-base text-slate-100">{opp.symbol}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {opp.type.replace("_", " ")}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      opp.dataMode === 'LIVE_DATA' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {opp.dataMode || 'LIVE_DATA'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-amber-400 font-bold">Score {opp.score}/100</span>
                  </div>
                </div>

                <div className="bg-slate-950 rounded p-3 mb-4 text-xs font-mono space-y-1.5 border border-slate-800/60">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Route:</span>
                    <span className="font-bold text-cyan-300">{opp.route}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Gross Spread:</span>
                    <span className="text-slate-200">+{opp.grossSpreadPercent.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Fees & Slippage:</span>
                    <span className="text-rose-400">-{(opp.estimatedFeesPercent + opp.estimatedSlippagePercent).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-emerald-400 font-bold">
                    <span>Net Expected Edge:</span>
                    <span>+{opp.netEdgePercent.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 uppercase">Est. Profit</div>
                    <div className="font-mono font-bold text-emerald-400 mt-0.5">{opp.symbol.endsWith("NGN") ? "₦" : "$"}{(opp.symbol.endsWith("NGN") ? opp.estimatedProfitUsd * 1500 : opp.estimatedProfitUsd).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 uppercase">Liquidity</div>
                    <div className="font-mono font-bold text-slate-200 mt-0.5">{opp.symbol.endsWith("NGN") ? "₦" : "$"}{(opp.symbol.endsWith("NGN") ? opp.liquidityUsd * 1500 : opp.liquidityUsd).toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 uppercase">Age</div>
                    <div className="font-mono font-bold text-cyan-400 mt-0.5">{opp.opportunityAgeMs}ms</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Liquidity & Risk Verified</span>
                </div>
                <button
                  disabled={isKillSwitchActive}
                  onClick={() => onExecuteOpportunity(opp)}
                  className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md ${
                    isKillSwitchActive
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : tradingMode === "LIVE"
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                      : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Execute ({tradingMode})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
