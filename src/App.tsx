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
import { safeFetchJson } from "./utils/api";
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

      const results = await Promise.all(endpoints.map(ep => safeFetchJson(ep)));

      if (results[0].ok && results[0].data) setMarkets(results[0].data);
      if (results[1].ok && results[1].data) setOpportunities(results[1].data);
      if (results[2].ok && results[2].data) setOrders(results[2].data);
      if (results[3].ok && results[3].data) setTrades(results[3].data);
      if (results[4].ok && results[4].data) setBalances(results[4].data);
      if (results[5].ok && results[5].data) setRiskSettings(results[5].data);
      if (results[6].ok && results[6].data) setExchangeAccounts(results[6].data);
      if (results[7].ok && results[7].data) setAuditLogs(results[7].data);
      if (results[8].ok && results[8].data) setAnalytics(results[8].data);
      if (results[9].ok && results[9].data) setLiveReadiness(results[9].data);
    } catch (e: any) {
      // Ignore transient network errors during preview startup
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
    const res = await safeFetchJson("/api/exchanges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exchangeName, apiKey, apiSecret })
    });
    if (!res.ok) {
      return { success: false, error: res.error || "Failed to connect exchange." };
    }
    fetchData();
    return { success: true };
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
