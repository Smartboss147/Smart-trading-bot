import React, { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Activity, BarChart2 } from "lucide-react";
import { Market } from "../types";

interface TradingTerminalProps {
  markets: Market[];
  selectedMarket: Market | null;
  onSelectMarket: (market: Market) => void;
}

export function TradingTerminal({ markets, selectedMarket, onSelectMarket }: TradingTerminalProps) {
  const currentMarket = selectedMarket || markets[0] || {
    symbol: "BTCUSDT",
    bid: 94000,
    ask: 94015,
    lastPrice: 94000,
    volume24h: 34500000,
    change24h: 2.15,
    spread: 15,
    exchange: "Binance"
  };

  const [timeframe, setTimeframe] = useState("1h");

  // Generate chart mock price points based on lastPrice
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const variation = (Math.sin(i / 3) * (currentMarket.lastPrice * 0.005)) + (Math.random() * (currentMarket.lastPrice * 0.002));
    const price = Number((currentMarket.lastPrice - (30 - i) * 10 + variation).toFixed(2));
    return {
      time: `${i}:00`,
      price,
      volume: Math.floor(Math.random() * 500000 + 100000)
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left 3 Cols: Chart & Order Book */}
      <div className="lg:col-span-3 space-y-6">
        {/* Market Selector & Header */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select
              value={currentMarket.symbol}
              onChange={e => {
                const found = markets.find(m => m.symbol === e.target.value);
                if (found) onSelectMarket(found);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-100 font-bold px-3 py-1.5 rounded text-sm focus:outline-none focus:border-cyan-500"
            >
              {markets.map(m => (
                <option key={`${m.exchange}-${m.symbol}`} value={m.symbol}>
                  {m.symbol} ({m.exchange})
                </option>
              ))}
            </select>
            <div className="text-xl font-mono font-bold text-slate-100">
              ${currentMarket.lastPrice?.toLocaleString()}
            </div>
            <div className={`text-xs font-mono font-semibold ${currentMarket.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {currentMarket.change24h >= 0 ? "+" : ""}{currentMarket.change24h}%
            </div>
          </div>

          <div className="flex items-center gap-1">
            {["1m", "5m", "15m", "1h", "4h", "1D"].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  timeframe === tf ? "bg-cyan-500 text-slate-950" : "bg-slate-950 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-slate-100 text-sm">Price Action & Depth ({currentMarket.symbol})</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Exchange: {currentMarket.exchange}</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} domain={["auto", "auto"]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "6px" }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#22d3ee" }}
                />
                <Area type="monotone" dataKey="price" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Right Col: Order Book & Stats */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <h3 className="font-bold text-slate-100 text-sm mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Order Book Depth
          </h3>

          <div className="space-y-1 font-mono text-xs">
            <div className="text-[10px] text-slate-500 uppercase grid grid-cols-3 pb-1 border-b border-slate-800">
              <span>Price (USDT)</span>
              <span className="text-right">Size</span>
              <span className="text-right">Total</span>
            </div>

            {/* Asks */}
            {Array.from({ length: 5 }, (_, i) => {
              const askPrice = currentMarket.ask + (5 - i) * 2;
              return (
                <div key={`ask-${i}`} className="grid grid-cols-3 text-rose-400 py-0.5">
                  <span>${askPrice.toLocaleString()}</span>
                  <span className="text-right text-slate-300">{(Math.random() * 2 + 0.1).toFixed(3)}</span>
                  <span className="text-right text-slate-500">{(Math.random() * 10 + 2).toFixed(2)}</span>
                </div>
              );
            })}

            <div className="py-2 my-1 border-y border-slate-800 text-center font-bold text-slate-100 bg-slate-950">
              Spread: ${currentMarket.spread} ({(currentMarket.spread / currentMarket.lastPrice * 100).toFixed(3)}%)
            </div>

            {/* Bids */}
            {Array.from({ length: 5 }, (_, i) => {
              const bidPrice = currentMarket.bid - i * 2;
              return (
                <div key={`bid-${i}`} className="grid grid-cols-3 text-emerald-400 py-0.5">
                  <span>${bidPrice.toLocaleString()}</span>
                  <span className="text-right text-slate-300">{(Math.random() * 2 + 0.1).toFixed(3)}</span>
                  <span className="text-right text-slate-500">{(Math.random() * 10 + 2).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg text-xs space-y-2">
          <div className="font-bold text-slate-200 mb-2">Market Statistics</div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">24h Volume</span>
            <span className="font-mono text-slate-200">${(currentMarket.volume24h / 1000000).toFixed(2)}M</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">24h High</span>
            <span className="font-mono text-emerald-400">${(currentMarket.lastPrice * 1.03).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">24h Low</span>
            <span className="font-mono text-rose-400">${(currentMarket.lastPrice * 0.97).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Data Latency</span>
            <span className="font-mono text-cyan-400">{(currentMarket as Market).latencyMs || 24}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
