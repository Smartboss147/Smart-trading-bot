import React, { useState } from "react";
import { Key, Plus, Shield, Trash2, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { ExchangeAccount } from "../types";

interface ExchangeConnectionsProps {
  exchanges: ExchangeAccount[];
  onAddExchange: (exchangeName: string, apiKey: string, apiSecret: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteExchange?: (id: string) => Promise<void>;
}

export function ExchangeConnections({ exchanges, onAddExchange, onDeleteExchange }: ExchangeConnectionsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [exchangeName, setExchangeName] = useState("Gate.io");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await onAddExchange(exchangeName, apiKey, apiSecret);
    setIsSubmitting(false);

    if (result.success) {
      setApiKey("");
      setApiSecret("");
      setShowAddModal(false);
    } else {
      setSubmitError(result.error || "Authentication failed. Please check your credentials.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Exchange API Connections</h2>
          <p className="text-xs text-slate-400 mt-1">Credentials are securely encrypted server-side and tested against live API endpoints before activation.</p>
        </div>
        <button
          onClick={() => {
            setSubmitError(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" /> Add Exchange
        </button>
      </div>

      {exchanges.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <Key className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-200">No exchange connected</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Connect your exchange API keys to start live trading, balance synchronization, and real-time arbitrage execution.
            </p>
          </div>
          <button
            onClick={() => {
              setSubmitError(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" /> Add Exchange
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exchanges.map(ex => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex flex-col justify-between relative space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="font-bold text-slate-100 text-base">{ex.exchangeName}</h3>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Layers className="w-3 h-3" /> {ex.accountType || "Spot Trading Account"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                      ex.status === "CONNECTED" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ex.status === "CONNECTED" ? "bg-emerald-400" : "bg-rose-400"}`} />
                      {ex.status}
                    </span>
                    {onDeleteExchange && (
                      <button
                        onClick={() => onDeleteExchange(ex.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Disconnect Exchange"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-slate-400">
                  <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                    <span>API Key:</span>
                    <span className="text-slate-200">{ex.apiKeyMasked}</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                    <span>Permissions:</span>
                    <span className="text-cyan-400">{ex.permissions.join(", ") || "None"}</span>
                  </div>
                </div>

                {ex.lastError && (
                  <div className="mt-3 bg-rose-950/40 border border-rose-800/40 p-2 rounded text-xs text-rose-300 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{ex.lastError}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Encrypted Vault
                </span>
                <span>Last Sync: {new Date(ex.lastSync).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100">Connect New Exchange</h3>
            
            {submitError && (
              <div className="bg-rose-950/50 border border-rose-800 p-3 rounded text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Authentication Failed</div>
                  <div className="text-[11px] text-rose-300/90 mt-0.5">{submitError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Exchange</label>
                <select
                  value={exchangeName}
                  onChange={e => setExchangeName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value="Gate.io">Gate.io (Live Spot Supported)</option>
                  <option value="Binance">Binance</option>
                  <option value="Coinbase">Coinbase</option>
                  <option value="Kraken">Kraken</option>
                  <option value="OKX">OKX</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">API Key</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="Paste official API key..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">API Secret</label>
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  placeholder="Paste official API secret..."
                  value={apiSecret}
                  onChange={e => setApiSecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isSubmitting ? "Authenticating..." : "Connect Securely"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
