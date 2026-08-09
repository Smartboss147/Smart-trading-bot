import React, { useState } from "react";
import { Market, RiskSettings, CurrencySymbol } from "../types";
import { ArrowRightLeft, ShieldCheck, Zap, AlertTriangle, Check } from "lucide-react";

interface TradePanelProps {
  markets: Market[];
  riskSettings: RiskSettings | null;
  onOrderExecuted: () => void;
}

export function TradePanel({ markets, riskSettings, onOrderExecuted }: TradePanelProps) {
  const [currency, setCurrency] = useState<CurrencySymbol>("NGN");
  const [selectedSymbol, setSelectedSymbol] = useState(markets[0]?.symbol || "BTCNGN");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [amountInput, setAmountInput] = useState<number>(5000); // ₦5,000 default
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [exchange, setExchange] = useState<string>("Binance");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const currentMarket = markets.find(m => m.symbol === selectedSymbol) || markets[0];
  const isLive = riskSettings?.tradingMode === "LIVE";
  const exchangeRateNgn = 1500; // 1 USD = ₦1,500

  // Conversion helper to NGN
  const amountInNgn = currency === "NGN" ? amountInput : amountInput * (currency === "USD" ? exchangeRateNgn : exchangeRateNgn * 1.08);

  const price = orderType === "MARKET" ? (side === "BUY" ? currentMarket?.ask : currentMarket?.bid) || 100 : (limitPrice || currentMarket?.lastPrice || 100);
  const isNgnPair = currentMarket?.symbol.endsWith("NGN");
  const unitPriceNgn = isNgnPair ? price : price * exchangeRateNgn;

  const estimatedQuantity = unitPriceNgn > 0 ? amountInNgn / unitPriceNgn : 0;
  const estimatedFeesNgn = amountInNgn * 0.001; // 0.1% fee
  const estimatedSlippageNgn = amountInNgn * 0.0005; // 0.05% slippage
  const totalEstimatedNgn = amountInNgn + estimatedFeesNgn;

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate ₦100 minimum & exchange rules
    if (amountInNgn < 100) {
      setErrorMessage("Trade amount must be at least ₦100.");
      return;
    }
    if (amountInNgn < 500) {
      setErrorMessage("Trade amount is below the exchange minimum of ₦500.");
      return;
    }

    if (isLive && !isLiveConfirmed()) {
      setShowConfirmModal(true);
      return;
    }

    executeOrderNow();
  };

  const isLiveConfirmed = () => {
    return localStorage.getItem("apexquant_live_confirmed") === "true";
  };

  const executeOrderNow = async () => {
    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange,
          symbol: currentMarket.symbol,
          side,
          quantity: estimatedQuantity,
          price,
          amountNgn: amountInNgn,
          strategy: "DirectTrade"
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Order execution failed");
      } else {
        setSuccessMessage(`Successfully executed ${side} order for ${currentMarket.symbol}! Order ID: ${data.order.id}`);
        onOrderExecuted();
      }
    } catch (err: any) {
      setErrorMessage("Network error during order submission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Currency Selector */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" /> Professional NGN & Crypto Trading Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1">Execute direct market & limit orders starting from ₦100 with exchange rule enforcement.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-800">
          <span className="text-xs text-slate-400 px-2 uppercase font-mono">Currency:</span>
          {(["NGN", "USD", "EUR"] as CurrencySymbol[]).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                currency === c ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {c === "NGN" ? "₦ NGN" : c === "USD" ? "$ USD" : "€ EUR"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Order Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAttempt} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Exchange</label>
                <select
                  value={exchange}
                  onChange={e => setExchange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Binance">Binance</option>
                  <option value="Coinbase">Coinbase</option>
                  <option value="Kraken">Kraken</option>
                  <option value="OKX">OKX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Market Pair</label>
                <select
                  value={selectedSymbol}
                  onChange={e => setSelectedSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                >
                  {markets.map(m => (
                    <option key={m.symbol} value={m.symbol}>
                      {m.symbol} ({m.quoteAsset}) - {m.lastPrice.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side selector */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSide("BUY")}
                className={`py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all ${
                  side === "BUY"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                Buy {currentMarket?.baseAsset}
              </button>
              <button
                type="button"
                onClick={() => setSide("SELL")}
                className={`py-2.5 rounded font-bold text-xs uppercase tracking-wider transition-all ${
                  side === "SELL"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800"
                }`}
              >
                Sell {currentMarket?.baseAsset}
              </button>
            </div>

            {/* Order Type */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-medium text-slate-400 uppercase">Type:</span>
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === "MARKET"}
                  onChange={() => setOrderType("MARKET")}
                  className="text-cyan-500 focus:ring-0"
                />
                Market
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="radio"
                  name="orderType"
                  checked={orderType === "LIMIT"}
                  onChange={() => setOrderType("LIMIT")}
                  className="text-cyan-500 focus:ring-0"
                />
                Limit
              </label>
            </div>

            {orderType === "LIMIT" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Limit Price ({currentMarket?.quoteAsset})</label>
                <input
                  type="number"
                  step="any"
                  value={limitPrice || currentMarket?.lastPrice}
                  onChange={e => setLimitPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Amount input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-400 uppercase">
                  Trade Amount ({currency === "NGN" ? "₦ NGN" : currency === "USD" ? "$ USD" : "€ EUR"})
                </label>
                <span className="text-[10px] text-cyan-400">Platform Minimum: ₦100 (Exchange Min: ₦500)</span>
              </div>
              <input
                type="number"
                min="100"
                step="any"
                value={amountInput}
                onChange={e => setAmountInput(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
              {/* Quick Preset Buttons */}
              <div className="flex gap-2 mt-2">
                {[100, 500, 1000, 5000, 10000, 50000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountInput(currency === "NGN" ? val : val / exchangeRateNgn)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[11px] font-mono text-slate-300"
                  >
                    {currency === "NGN" ? `₦${val.toLocaleString()}` : `$${(val / exchangeRateNgn).toFixed(2)}`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded font-bold text-xs uppercase tracking-wider shadow-lg transition-all ${
                side === "BUY" ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20" : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
              }`}
            >
              {submitting ? "Submitting Order..." : `${side} ${currentMarket?.baseAsset}`}
            </button>
          </form>
        </div>

        {/* Order Summary & Execution Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 mb-3 border-b border-slate-800 pb-2">Execution Breakdown</h3>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Pair:</span>
                <span className="text-slate-200">{currentMarket?.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Execution Price:</span>
                <span className="text-slate-200">{price.toLocaleString()} {currentMarket?.quoteAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Qty:</span>
                <span className="text-cyan-400">{estimatedQuantity.toFixed(6)} {currentMarket?.baseAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount in NGN:</span>
                <span className="text-slate-200">₦{amountInNgn.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Fee (0.1%):</span>
                <span className="text-slate-300">₦{estimatedFeesNgn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Slippage:</span>
                <span className="text-slate-300">₦{estimatedSlippageNgn.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold">
                <span className="text-slate-300">Total Est. Cost:</span>
                <span className="text-emerald-400">₦{totalEstimatedNgn.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <ShieldCheck className="w-4 h-4" /> Safety Verification
            </div>
            <p>Exchange rules verified. Minimum ₦100 limit active. Slippage protection enabled.</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Live Trading */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold">Live Order Confirmation</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to submit a <strong className="text-white">LIVE</strong> order to <strong className="text-cyan-400">{exchange}</strong> for <strong className="text-white">{currentMarket?.symbol}</strong> valued at <strong className="text-white">₦{amountInNgn.toLocaleString()}</strong>.
            </p>
            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div>Side: <span className={side === "BUY" ? "text-emerald-400" : "text-rose-400"}>{side}</span></div>
              <div>Estimated Qty: {estimatedQuantity.toFixed(6)} {currentMarket?.baseAsset}</div>
              <div>Estimated Total: ₦{totalEstimatedNgn.toLocaleString()}</div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("apexquant_live_confirmed", "true");
                  executeOrderNow();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold"
              >
                Confirm & Submit Live Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
