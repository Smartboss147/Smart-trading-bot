import React, { useState } from "react";
import { Key, Plus, Shield, Trash2, AlertCircle, RefreshCw, Layers, CheckCircle2, ExternalLink, HelpCircle } from "lucide-react";
import { ExchangeAccount } from "../types";
import { safeFetchJson } from "../utils/api";

interface ExchangeConnectionsProps {
  exchanges: ExchangeAccount[];
  onAddExchange: (exchangeName: string, apiKey: string, apiSecret: string, force?: boolean) => Promise<{ success: boolean; error?: string }>;
  onDeleteExchange?: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

export function ExchangeConnections({ exchanges, onAddExchange, onDeleteExchange, onRefresh }: ExchangeConnectionsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExchange, setEditingExchange] = useState<ExchangeAccount | null>(null);
  const [exchangeName, setExchangeName] = useState("Gate.io");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Test connection states per account id
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; code?: string }>>({});

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await safeFetchJson("/api/exchanges/refresh", {
        method: "POST"
      });
      if (!response.ok) {
        alert(response.error || "Failed to refresh accounts.");
      } else {
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Refresh error:", err);
      alert("Network error while refreshing accounts.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestConnection = async (ex: ExchangeAccount) => {
    setTestingId(ex.id);
    setTestResults(prev => ({ ...prev, [ex.id]: { success: false, message: "Testing..." } }));

    try {
      const res = await safeFetchJson("/api/exchanges/gateio/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (res.ok && res.data?.success) {
        setTestResults(prev => ({
          ...prev,
          [ex.id]: { success: true, message: "Connection verified successfully (Gate.io v4 Spot API)" }
        }));
      } else {
        const errorData = res.data;
        setTestResults(prev => ({
          ...prev,
          [ex.id]: { 
            success: false, 
            message: errorData?.error || errorData?.message || res.error || "Gate.io authentication or permission check failed",
            code: errorData?.code || "GATE_AUTH_FAILED"
          }
        }));
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [ex.id]: { success: false, message: err.message || "Network error during connection test", code: "NETWORK_ERROR" }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingExchange(null);
    setExchangeName("Gate.io");
    setApiKey("");
    setApiSecret("");
    setSubmitError(null);
    setShowAddModal(true);
  };

  const handleOpenUpdate = (ex: ExchangeAccount) => {
    setEditingExchange(ex);
    setExchangeName(ex.exchangeName);
    setApiKey(""); // Don't show old key
    setApiSecret("");
    setSubmitError(null);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent, force: boolean = false) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await onAddExchange(exchangeName, apiKey, apiSecret, force);
    setIsSubmitting(false);

    if (result.success) {
      setApiKey("");
      setApiSecret("");
      setShowAddModal(false);
      setEditingExchange(null);
    } else {
      setSubmitError(result.error || "Authentication failed. Please check your credentials.");
    }
  };

  const handleForceConnect = () => {
    handleSubmit({ preventDefault: () => {} } as any, true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Exchange API Connections</h2>
          <p className="text-xs text-slate-400 mt-1">Credentials are securely encrypted server-side and tested against live API endpoints before activation.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || exchanges.length === 0}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} /> 
            {isRefreshing ? "Refreshing..." : "Refresh Status"}
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Exchange
          </button>
        </div>
      </div>

      {(!exchanges || exchanges.length === 0) ? (
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
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 shadow-lg shadow-cyan-600/20"
          >
            <Plus className="w-4 h-4" /> Add Exchange
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(exchanges || []).filter(ex => ex && ex.id).map(ex => {
            const testResult = testResults[ex.id];
            const isTesting = testingId === ex.id;
            const isGate = /gate/i.test(ex.exchangeName);

            return (
              <div key={ex.id} className="bg-slate-900 border border-slate-800 p-5 rounded-lg flex flex-col justify-between relative space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h3 className="font-bold text-slate-100 text-base">{ex.exchangeName || "Unknown Exchange"}</h3>
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
                        {ex.status || "DISCONNECTED"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenUpdate(ex)}
                          className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                          title="Update Keys / Re-authenticate"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
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
                  </div>

                  <div className="space-y-2 text-xs font-mono text-slate-400">
                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800">
                      <span>API Key:</span>
                      <span className="text-slate-200">{ex.apiKeyMasked || "••••••••"}</span>
                    </div>
                    <div className="flex justify-between bg-slate-950 p-2 rounded border border-slate-800 items-center">
                      <span>Permissions:</span>
                      <span className="text-cyan-400 font-sans text-[11px] bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        Spot Trade, Account Read
                      </span>
                    </div>
                  </div>

                  {/* Test Connection Button & Status Banner */}
                  {isGate && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Live API Health Check</span>
                        <button
                          type="button"
                          disabled={isTesting}
                          onClick={() => handleTestConnection(ex)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] rounded border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3 text-cyan-400" />}
                          {isTesting ? "Testing..." : "Test Connection"}
                        </button>
                      </div>

                      {testResult && (
                        <div className={`p-2.5 rounded text-xs flex items-start gap-2 border ${
                          testResult.success 
                            ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-200" 
                            : "bg-rose-950/40 border-rose-800/50 text-rose-200"
                        }`}>
                          {testResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <div className="font-semibold text-[11px]">
                              {testResult.success ? "Connection Verified" : `Verification Failed (${testResult.code || "403"})`}
                            </div>
                            <div className="text-[11px] opacity-90 leading-tight">{testResult.message}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {ex.lastError && !testResult && (
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
                  <span>Last Sync: {ex.lastSync ? new Date(ex.lastSync).toLocaleTimeString() : "Never"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {editingExchange ? <RefreshCw className="w-4 h-4 text-cyan-400" /> : <Plus className="w-4 h-4 text-cyan-400" />}
              {editingExchange ? `Update ${editingExchange.exchangeName} Connection` : "Connect New Exchange"}
            </h3>

            {/* Minimum Permissions Notice for Gate.io */}
            {exchangeName === "Gate.io" && (
              <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-lg text-xs text-cyan-200 space-y-3 shadow-inner">
                <div className="flex items-center justify-between font-semibold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" /> Gate.io Required API Permissions & 403 Prevention
                  </span>
                  <a 
                    href="https://www.gate.io/help/api" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] underline bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-700/40"
                  >
                    Gate.io API Docs <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  To prevent <span className="text-rose-400 font-mono font-semibold">403 Forbidden</span> errors during authentication, balance checks, or order execution, your Gate.io API key must be created with the following exact permissions:
                </p>
                <div className="bg-slate-950/80 p-3 rounded border border-cyan-900/50 space-y-2">
                  <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">Required Scopes:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="bg-slate-900 p-2 rounded border border-cyan-800/40 flex items-center gap-2 text-cyan-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                      <span>Spot Trade</span>
                      <span className="text-[10px] text-emerald-400 ml-auto font-sans bg-emerald-950/60 px-1.5 py-0.2 rounded">Required</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-cyan-800/40 flex items-center gap-2 text-cyan-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                      <span>Account Read</span>
                      <span className="text-[10px] text-emerald-400 ml-auto font-sans bg-emerald-950/60 px-1.5 py-0.2 rounded">Required</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 space-y-1">
                  <div>• <strong className="text-slate-300">IP Whitelist:</strong> Leave unrestricted or whitelist your server deployment IP.</div>
                  <div>• <strong className="text-slate-300">Withdrawals:</strong> Do NOT enable withdrawal permissions for security.</div>
                </div>
              </div>
            )}
            
            {submitError && (
              <div className="bg-rose-950/60 border border-rose-800/80 p-3.5 rounded-lg text-xs text-rose-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-300">Authentication Failed</div>
                    <div className="text-[12px] text-rose-200/90 mt-0.5 leading-relaxed">{submitError}</div>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-rose-900/40 rounded p-2.5 text-[11px] text-slate-300 space-y-1">
                  <div className="font-semibold text-rose-300/90">Gate.io API Key Checklist:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                    <li>Ensure <span className="text-slate-200">Spot Trade</span> and <span className="text-slate-200">Account Read</span> permissions are enabled.</li>
                    <li>If you have <span className="text-slate-200">IP Whitelist</span> configured on Gate.io, allow unrestricted access or add your server IP.</li>
                    <li>Double check that the API Key and Secret are copied completely without extra spaces.</li>
                  </ul>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-rose-950/60 mt-2">
                  <span className="text-[11px] text-rose-300/80">Experiencing upstream server issues?</span>
                  <button
                    type="button"
                    onClick={handleForceConnect}
                    disabled={isSubmitting}
                    className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 rounded text-[11px] font-semibold transition-all shadow disabled:opacity-50"
                  >
                    {isSubmitting ? "Connecting..." : "Force Connect / Save Anyway"}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Exchange</label>
                <select
                  value={exchangeName}
                  onChange={e => setExchangeName(e.target.value)}
                  disabled={isSubmitting || !!editingExchange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  <option value="Gate.io">Gate.io (Live Spot Supported)</option>
                  <option value="Binance">Binance</option>
                  <option value="Coinbase">Coinbase</option>
                  <option value="Kraken">Kraken</option>
                  <option value="OKX">OKX</option>
                </select>
                {editingExchange && (
                  <p className="text-[10px] text-slate-500 mt-1">Exchange selection is locked for updates. To change exchanges, delete this connection and add a new one.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">New API Key</label>
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
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">New API Secret</label>
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
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingExchange(null);
                  }}
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
                  {isSubmitting ? "Updating..." : (editingExchange ? "Update Credentials" : "Connect Securely")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
