import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { DashboardOverview } from "./components/DashboardOverview";
import { MarketScanner } from "./components/MarketScanner";
import { ArbitrageScanner } from "./components/ArbitrageScanner";
import { TradingTerminal } from "./components/TradingTerminal";
import { OrdersAndTrades } from "./components/OrdersAndTrades";
import { RiskAndStrategy } from "./components/RiskAndStrategy";
import { ExchangeConnections } from "./components/ExchangeConnections";
import { SystemHealthPanel } from "./components/SystemHealthPanel";
import { IpadMonitorMode } from "./components/IpadMonitorMode";
import { TradePanel } from "./components/TradePanel";
import { PortfolioView } from "./components/PortfolioView";
import { Wallet } from "./components/Wallet";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { gateWs } from "./services/gateio";
import { safeFetchJson } from "./utils/api";
import { Market, ArbitrageOpportunity, Order, Trade, Balance, RiskSettings, ExchangeAccount, AuditLog, SystemHealth, LiveReadiness } from "./types";

// --- ErrorBoundary Component ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[Uncaught Error]:", error, errorInfo);
  }

  private handleReset = () => {
    window.localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-slate-400 text-sm mb-8">
              The application encountered an unexpected error. This usually happens due to a temporary connection issue.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Loading
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4" />
                Reset & Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// --- End ErrorBoundary ---

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Global error logging for debugging
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      console.error("[App] Global error:", e.message, e.filename, e.lineno);
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
  const [exchangeAccounts, setExchangeAccounts] = useState<ExchangeAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [liveReadiness, setLiveReadiness] = useState<LiveReadiness | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Fetch initial data
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for real-time updates (Backend & Gate.io WS)
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      if (!host) {
        console.warn("WebSocket skipped: window.location.host is empty");
        return;
      }
      const wsUrl = `${protocol}//${host}`;
      console.log(`[App] Connecting WebSocket to ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "MARKET_UPDATE") {
            if (data.markets) setMarkets(data.markets);
            if (data.opportunities) setOpportunities(data.opportunities);
            if (data.systemHealth) setSystemHealth(data.systemHealth);
          }
        } catch (e: any) {
          console.warn("WS parse error:", e?.message);
        }
      };
    } catch (err: any) {
      console.warn("Failed to initialize WebSocket:", err?.message);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const isFetchingRef = useRef(false);

  const fetchData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      // First check if server is reachable
      const health = await safeFetchJson("/api/health");
      if (!health.ok) {
        console.warn("[App] Health check failed:", health.error);
      }

      const endpoints = [
        "/api/markets",
        "/api/opportunities",
        "/api/orders",
        "/api/trades",
        "/api/balances",
        "/api/risk-settings",
        "/api/exchanges",
        "/api/audit-logs",
        "/api/analytics",
        "/api/trading/live-readiness"
      ];

      const results = [];
      for (const ep of endpoints) {
        try {
          console.log(`[App] Fetching ${ep}...`);
          const res = await safeFetchJson(ep);
          console.log(`[App] Fetched ${ep}:`, res.ok ? "OK" : "FAILED", res.error || "");
          results.push(res);
        } catch (epErr: any) {
          console.error(`[App] Endpoint ${ep} crashed:`, epErr);
          results.push({ ok: false, error: epErr.message });
        }
      }

      if (results[0].ok && Array.isArray(results[0].data)) setMarkets(results[0].data);
      if (results[1].ok && Array.isArray(results[1].data)) setOpportunities(results[1].data);
      if (results[2].ok && Array.isArray(results[2].data)) setOrders(results[2].data);
      if (results[3].ok && Array.isArray(results[3].data)) setTrades(results[3].data);
      if (results[4].ok && Array.isArray(results[4].data)) setBalances(results[4].data);
      if (results[5].ok && results[5].data) setRiskSettings(results[5].data);
      if (results[6].ok && Array.isArray(results[6].data)) setExchangeAccounts(results[6].data);
      if (results[7].ok && Array.isArray(results[7].data)) setAuditLogs(results[7].data);
      if (results[8].ok && results[8].data) setAnalytics(results[8].data);
      if (results[9].ok && results[9].data) setLiveReadiness(results[9].data);
    } catch (globalErr: any) {
      console.error("[App] fetchData global error:", globalErr);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleToggleKillSwitch = async () => {
    const newActive = !riskSettings?.killSwitchActive;
    await safeFetchJson("/api/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: newActive })
    });
    fetchData();
  };

  const handleUpdateRiskSettings = async (newSettings: Partial<RiskSettings>) => {
    await safeFetchJson("/api/risk-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings)
    });
    fetchData();
  };

  const handleToggleTradingMode = async (mode: "PAPER" | "LIVE", confirmed = false): Promise<boolean> => {
    try {
      const res = await safeFetchJson("/api/trading-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, confirmed })
      });
      if (!res.ok) {
        if (res.data?.readiness) {
          setLiveReadiness(res.data.readiness);
        }
        return false;
      }
      fetchData();
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleExecuteOpportunity = async (opp: ArbitrageOpportunity) => {
    const res = await safeFetchJson("/api/execute-arbitrage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: opp.id })
    });
    
    if (!res.ok) {
      alert(res.error || "Trade cancelled — opportunity no longer profitable.");
      fetchData();
      return;
    }
    
    fetchData();
    setActiveTab("orders");
  };

  const handleAddExchange = async (exchangeName: string, apiKey: string, apiSecret: string) => {
    // Sanitize keys to remove all non-printable characters, spaces, and hidden Unicode symbols
    const sanitize = (str: string) => str.trim().replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, "");
    
    const cleanKey = sanitize(apiKey);
    const cleanSecret = sanitize(apiSecret);

    if (cleanKey.length < 16 || cleanSecret.length < 16) {
      return { success: false, error: "API Key or Secret appears too short. Please ensure you copied the full strings accurately from the exchange." };
    }

    const res = await safeFetchJson("/api/exchanges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exchangeName, apiKey: cleanKey, apiSecret: cleanSecret })
    });

    if (!res.ok) {
      return { success: false, error: res.error || "Failed to connect exchange." };
    }
    fetchData();
    return { success: true };
  };

  const handleDeleteExchange = async (id: string) => {
    const res = await safeFetchJson(`/api/exchanges/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert(res.error || "Failed to delete exchange.");
    }
    fetchData();
  };

  const totalBalanceUsd = (balances || []).reduce((acc, b) => acc + (b?.usdValue || 0), 0);

  if (activeTab === "ipad") {
    return (
      <ErrorBoundary>
        <IpadMonitorMode
          markets={markets || []}
          opportunities={opportunities || []}
          systemHealth={systemHealth}
          onExit={() => setActiveTab("dashboard")}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          riskSettings={riskSettings}
          systemHealth={systemHealth}
          onToggleKillSwitch={handleToggleKillSwitch}
          totalBalanceUsd={totalBalanceUsd}
        />

        {riskSettings?.tradingMode === "LIVE" && (
          <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 tracking-wide shadow-md shadow-amber-500/20 z-40 relative">
            <AlertTriangle className="w-5 h-5" />
            REAL MONEY MODE — Your connected account contains real funds. Orders may result in real financial transactions.
          </div>
        )}

        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6">
          {activeTab === "dashboard" && (
            <DashboardOverview
              balances={balances || []}
              opportunities={opportunities || []}
              systemHealth={systemHealth}
              analytics={analytics}
              onSelectTab={setActiveTab}
            />
          )}
          {activeTab === "trade" && (
            <TradePanel
              markets={markets || []}
              riskSettings={riskSettings}
              onOrderExecuted={fetchData}
            />
          )}
          {activeTab === "portfolio" && (
            <PortfolioView
              balances={balances || []}
              trades={trades || []}
            />
          )}
          {activeTab === "wallet" && (
            <Wallet
              tradingMode={riskSettings?.tradingMode || "PAPER"}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === "scanner" && (
            <MarketScanner
              markets={markets || []}
              onSelectMarket={(m) => {
                setSelectedMarket(m);
                setActiveTab("terminal");
              }}
            />
          )}
          {activeTab === "arbitrage" && (
            <ArbitrageScanner
              opportunities={opportunities || []}
              riskSettings={riskSettings}
              onExecuteOpportunity={handleExecuteOpportunity}
            />
          )}
          {activeTab === "terminal" && (
            <TradingTerminal
              markets={markets || []}
              selectedMarket={selectedMarket}
              onSelectMarket={setSelectedMarket}
            />
          )}
          {activeTab === "orders" && (
            <OrdersAndTrades
              orders={orders || []}
              trades={trades || []}
            />
          )}
          {activeTab === "risk" && (
            <RiskAndStrategy
              riskSettings={riskSettings}
              liveReadiness={liveReadiness}
              systemHealth={systemHealth}
              onUpdateRiskSettings={handleUpdateRiskSettings}
              onToggleTradingMode={handleToggleTradingMode}
              onNavigateToExchanges={() => setActiveTab("exchanges")}
            />
          )}
          {activeTab === "exchanges" && (
            <ExchangeConnections
              exchanges={exchangeAccounts || []}
              onAddExchange={handleAddExchange}
              onDeleteExchange={handleDeleteExchange}
              onRefresh={fetchData}
            />
          )}
          {activeTab === "admin" && (
            <SystemHealthPanel
              systemHealth={systemHealth}
              auditLogs={auditLogs || []}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
