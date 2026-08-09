import React, { useState, useEffect } from "react";
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
import { AlertTriangle } from "lucide-react";
import { gateWs } from "./services/gateio";
import { Market, ArbitrageOpportunity, Order, Trade, Balance, RiskSettings, ExchangeAccount, AuditLog, SystemHealth, LiveReadiness } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
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
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket for real-time updates (Backend & Gate.io WS)
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host || "localhost:3000";
      const wsUrl = `${protocol}//${host}`;
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

    // Connect Gate.io real-time WebSocket client
    try {
      gateWs.connect();
      gateWs.subscribeTickers(["BTC_USDT", "ETH_USDT", "SOL_USDT"], (ticker) => {
        if (!ticker || !ticker.currency_pair) return;
        setMarkets((prevMarkets) =>
          prevMarkets.map((m) => {
            if (m.symbol === ticker.currency_pair || m.symbol.replace("/", "_") === ticker.currency_pair) {
              const last = parseFloat(ticker.last) || m.lastPrice;
              const ask = parseFloat(ticker.lowest_ask) || m.ask;
              const bid = parseFloat(ticker.highest_bid) || m.bid;
              const change = parseFloat(ticker.change_percentage) || m.change24h;
              const vol = parseFloat(ticker.base_volume) || m.volume24h;
              return {
                ...m,
                lastPrice: last,
                ask: ask,
                bid: bid,
                spread: Math.abs(ask - bid),
                spreadPercent: ask > 0 ? (Math.abs(ask - bid) / ask) * 100 : 0,
                change24h: change,
                volume24h: vol,
                timestamp: Date.now(),
              };
            }
            return m;
          })
        );
      });
    } catch (gateErr: any) {
      console.warn("Gate WS init error:", gateErr?.message);
    }

    return () => {
      if (ws) ws.close();
      gateWs.disconnect();
    };
  }, []);

  const fetchData = async () => {
    try {
      const [mRes, oRes, ordRes, trdRes, bRes, rRes, eRes, aRes, anRes, lrRes] = await Promise.all([
        fetch("/api/markets").then(r => r.ok ? r.json() : Promise.reject(new Error("markets " + r.status))),
        fetch("/api/opportunities").then(r => r.ok ? r.json() : Promise.reject(new Error("opportunities " + r.status))),
        fetch("/api/orders").then(r => r.ok ? r.json() : Promise.reject(new Error("orders " + r.status))),
        fetch("/api/trades").then(r => r.ok ? r.json() : Promise.reject(new Error("trades " + r.status))),
        fetch("/api/balances").then(r => r.ok ? r.json() : Promise.reject(new Error("balances " + r.status))),
        fetch("/api/risk-settings").then(r => r.ok ? r.json() : Promise.reject(new Error("risk-settings " + r.status))),
        fetch("/api/exchanges").then(r => r.ok ? r.json() : Promise.reject(new Error("exchanges " + r.status))),
        fetch("/api/audit-logs").then(r => r.ok ? r.json() : Promise.reject(new Error("audit-logs " + r.status))),
        fetch("/api/analytics").then(r => r.ok ? r.json() : Promise.reject(new Error("analytics " + r.status))),
        fetch("/api/trading/live-readiness").then(r => r.ok ? r.json() : Promise.reject(new Error("readiness " + r.status))),
      ]);

      setMarkets(mRes);
      setOpportunities(oRes);
      setOrders(ordRes);
      setTrades(trdRes);
      setBalances(bRes);
      setRiskSettings(rRes);
      setExchangeAccounts(eRes);
      setAuditLogs(aRes);
      setAnalytics(anRes);
      setLiveReadiness(lrRes);
    } catch (e: any) {
      // Ignore transient network errors during preview startup or srcdoc rendering
      const msg = e?.message || "";
      if (!msg.includes("Load failed") && !msg.includes("expected pattern") && !msg.includes("Failed to fetch")) {
        console.warn("API fetch delayed:", msg);
      }
    }
  };

  const handleToggleKillSwitch = async () => {
    const newActive = !riskSettings?.killSwitchActive;
    await fetch("/api/kill-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: newActive })
    });
    fetchData();
  };

  const handleUpdateRiskSettings = async (newSettings: Partial<RiskSettings>) => {
    await fetch("/api/risk-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings)
    });
    fetchData();
  };

  const handleToggleTradingMode = async (mode: "PAPER" | "LIVE", confirmed = false): Promise<boolean> => {
    try {
      const res = await fetch("/api/trading-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, confirmed })
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.readiness) {
          setLiveReadiness(err.readiness);
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
    const res = await fetch("/api/execute-arbitrage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId: opp.id })
    });
    
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Trade cancelled — opportunity no longer profitable.");
      fetchData();
      return;
    }
    
    fetchData();
    setActiveTab("orders");
  };

  const handleAddExchange = async (exchangeName: string, apiKey: string, apiSecret: string) => {
    try {
      const res = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeName, apiKey, apiSecret })
      });
      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error || "Failed to connect exchange." };
      }
      fetchData();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || "Network error while connecting exchange." };
    }
  };

  const handleDeleteExchange = async (id: string) => {
    await fetch(`/api/exchanges/${id}`, { method: "DELETE" });
    fetchData();
  };

  const totalBalanceUsd = balances.reduce((acc, b) => acc + (b.usdValue || 0), 0);

  if (activeTab === "ipad") {
    return (
      <IpadMonitorMode
        markets={markets}
        opportunities={opportunities}
        systemHealth={systemHealth}
        onExit={() => setActiveTab("dashboard")}
      />
    );
  }

  return (
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
            balances={balances}
            opportunities={opportunities}
            systemHealth={systemHealth}
            analytics={analytics}
            onSelectTab={setActiveTab}
          />
        )}
        {activeTab === "trade" && (
          <TradePanel
            markets={markets}
            riskSettings={riskSettings}
            onOrderExecuted={fetchData}
          />
        )}
        {activeTab === "portfolio" && (
          <PortfolioView
            balances={balances}
            trades={trades}
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
            markets={markets}
            onSelectMarket={(m) => {
              setSelectedMarket(m);
              setActiveTab("terminal");
            }}
          />
        )}
        {activeTab === "arbitrage" && (
          <ArbitrageScanner
            opportunities={opportunities}
            riskSettings={riskSettings}
            onExecuteOpportunity={handleExecuteOpportunity}
          />
        )}
        {activeTab === "terminal" && (
          <TradingTerminal
            markets={markets}
            selectedMarket={selectedMarket}
            onSelectMarket={setSelectedMarket}
          />
        )}
        {activeTab === "orders" && (
          <OrdersAndTrades
            orders={orders}
            trades={trades}
          />
        )}
        {activeTab === "risk" && (
          <RiskAndStrategy
            riskSettings={riskSettings}
            liveReadiness={liveReadiness}
            onUpdateRiskSettings={handleUpdateRiskSettings}
            onToggleTradingMode={handleToggleTradingMode}
            onNavigateToExchanges={() => setActiveTab("exchanges")}
          />
        )}
        {activeTab === "exchanges" && (
          <ExchangeConnections
            exchanges={exchangeAccounts}
            onAddExchange={handleAddExchange}
            onDeleteExchange={handleDeleteExchange}
          />
        )}
        {activeTab === "admin" && (
          <SystemHealthPanel
            systemHealth={systemHealth}
            auditLogs={auditLogs}
          />
        )}
      </main>
    </div>
  );
}
