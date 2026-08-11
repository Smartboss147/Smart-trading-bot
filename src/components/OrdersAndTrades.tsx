import React from "react";
import { Cpu, CheckCircle2 } from "lucide-react";
import { Order, Trade } from "../types";

interface OrdersAndTradesProps {
  orders: Order[];
  trades: Trade[];
}

export function OrdersAndTrades({ orders, trades }: OrdersAndTradesProps) {
  return (
    <div className="space-y-6">
      {/* Active Open Orders */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-slate-100 text-base">Active Open Orders ({(orders || []).filter(o => o.status === "OPEN").length})</h2>
          </div>
        </div>

        {(!orders || orders.length === 0) ? (
          <div className="text-center py-8 text-slate-500 text-xs">No active or historical orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3 text-center">Mode</th>
                  <th className="py-2.5 px-3">Exchange</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(orders || []).filter(o => o && o.id).map(o => (
                  <tr key={o.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-cyan-400">{o.id}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${o.mode === 'LIVE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {o.mode || 'PAPER'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{o.exchange}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">{o.symbol}</td>
                    <td className={`py-2.5 px-3 font-semibold ${o.side === "BUY" ? "text-emerald-400" : "text-rose-400"}`}>{o.side}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{o.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{o.symbol.endsWith("NGN") ? "₦" : "$"}{o.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{new Date(o.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Executed Trade History */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-slate-100 text-base">Executed Trade Audit Trail ({(trades || []).length})</h2>
          </div>
        </div>

        {(!trades || trades.length === 0) ? (
          <div className="text-center py-8 text-slate-500 text-xs">No completed trades recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <th className="py-2.5 px-3">Trade ID</th>
                  <th className="py-2.5 px-3 text-center">Mode</th>
                  <th className="py-2.5 px-3">Exchange</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Strategy</th>
                  <th className="py-2.5 px-3 text-right">Fill Price</th>
                  <th className="py-2.5 px-3 text-right">Fees</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(trades || []).filter(t => t && t.id).map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-cyan-400">{t.id}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.mode === 'LIVE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {t.mode || 'PAPER'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{t.exchange}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-100">{t.symbol}</td>
                    <td className="py-2.5 px-3 text-slate-400">{t.strategy}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{t.symbol.endsWith("NGN") ? "₦" : "$"}{t.averageFillPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right text-rose-400">{t.symbol.endsWith("NGN") ? "₦" : "$"}{t.fees.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+{t.symbol.endsWith("NGN") ? "₦" : "$"}{t.netProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{new Date(t.completedAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
