import React, { useState } from "react";
import { Search, ArrowUpDown, Globe, Activity } from "lucide-react";
import { Market } from "../types";

interface MarketScannerProps {
  markets: Market[];
  onSelectMarket: (market: Market) => void;
}

export function MarketScanner({ markets, onSelectMarket }: MarketScannerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<keyof Market>("volume24h");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredMarkets = markets.filter(m => 
    m.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.exchange.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === "string") {
      return sortOrder === "asc" ? (aVal as string).localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
    }
    return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (key: keyof Market) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-slate-100 text-lg">Multi-Market Real-Time Scanner ({markets.length} Markets)</h2>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search symbol (e.g. BTC, ETH)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Markets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase border-b border-slate-800">
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort("symbol")}>
                  <div className="flex items-center gap-1">Symbol <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => handleSort("exchange")}>
                  <div className="flex items-center gap-1">Exchange <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort("bid")}>
                  <div className="flex items-center justify-end gap-1">Bid Price <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort("ask")}>
                  <div className="flex items-center justify-end gap-1">Ask Price <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort("spread")}>
                  <div className="flex items-center justify-end gap-1">Spread <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort("volume24h")}>
                  <div className="flex items-center justify-end gap-1">24h Volume <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-200" onClick={() => handleSort("change24h")}>
                  <div className="flex items-center justify-end gap-1">24h Change <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="py-3 px-4 text-center">Data Age</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredMarkets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 font-sans">
                    No markets found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredMarkets.map(m => (
                  <tr
                    key={`${m.exchange}-${m.symbol}`}
                    onClick={() => onSelectMarket(m)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-all"
                  >
                    <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {m.symbol}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{m.exchange}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{m.symbol.endsWith("NGN") ? "₦" : "$"}{m.bid.toLocaleString(undefined, { minimumFractionDigits: m.bid < 1 ? 4 : 2 })}</td>
                    <td className="py-3 px-4 text-right text-rose-400">{m.symbol.endsWith("NGN") ? "₦" : "$"}{m.ask.toLocaleString(undefined, { minimumFractionDigits: m.ask < 1 ? 4 : 2 })}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{(m.spread / m.lastPrice * 100).toFixed(3)}%</td>
                    <td className="py-3 px-4 text-right text-slate-300">{m.symbol.endsWith("NGN") ? "₦" : "$"}{(m.volume24h / 1000000).toFixed(2)}M</td>
                    <td className={`py-3 px-4 text-right font-semibold ${m.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {m.change24h >= 0 ? "+" : ""}{m.change24h}%
                    </td>
                    <td className="py-3 px-4 text-center text-cyan-400">{m.dataAgeMs}ms</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
