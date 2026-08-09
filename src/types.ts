export type TradingMode = 'PAPER' | 'LIVE';
export type CurrencySymbol = 'NGN' | 'USD' | 'EUR';

export interface ExchangeRule {
  symbol: string;
  minNotionalNgn: number;
  minQuantity: number;
  pricePrecision: number;
  quantityPrecision: number;
  exchangeMinUsd: number;
}

export interface Market {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  bid: number;
  ask: number;
  lastPrice: number;
  bidQty: number;
  askQty: number;
  volume24h: number;
  change24h: number;
  spread: number;
  spreadPercent: number;
  latencyMs: number;
  dataAgeMs: number;
  timestamp: number;
  exchange: string;
  status: 'ACTIVE' | 'STALE' | 'SUSPENDED';
}

export interface ArbitrageLeg {
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  exchange: string;
}

export interface ArbitrageOpportunity {
  id: string;
  type: 'CROSS_EXCHANGE' | 'TRIANGULAR';
  symbol: string;
  route: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  grossSpreadPercent: number;
  estimatedFeesPercent: number;
  estimatedSlippagePercent: number;
  netEdgePercent: number;
  estimatedProfitUsd: number;
  requiredCapitalUsd: number;
  liquidityUsd: number;
  opportunityAgeMs: number;
  score: number;
  status: 'VALIDATING' | 'EXECUTABLE' | 'EXPIRED' | 'EXECUTING';
  dataMode?: 'LIVE_DATA' | 'PAPER' | 'UNAVAILABLE';
  legs?: ArbitrageLeg[];
  timestamp: number;
}

export interface Order {
  id: string;
  userId: string;
  exchange: string;
  symbol: string;
  strategy: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity: number;
  price: number;
  filled: number;
  remaining: number;
  status: 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'FAILED';
  mode?: 'PAPER' | 'LIVE';
  createdAt: number;
  updatedAt: number;
  error?: string;
}

export interface Trade {
  id: string;
  userId: string;
  exchange: string;
  symbol: string;
  strategy: string;
  side: 'BUY' | 'SELL';
  orderId: string;
  quantity: number;
  requestedPrice: number;
  averageFillPrice: number;
  fees: number;
  slippage: number;
  grossProfit: number;
  netProfit: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  mode?: 'PAPER' | 'LIVE';
  createdAt: number;
  completedAt: number;
  errorMessage?: string;
}

export interface Balance {
  asset: string;
  exchange: string;
  free: number;
  locked: number;
  total: number;
  usdValue: number;
  mode: TradingMode;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  accountMode: TradingMode;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRADE_DEBIT' | 'TRADE_CREDIT' | 'TRADING_FEE' | 'REFUND' | 'REVERSAL' | 'ADJUSTMENT';
  currency: string;
  amount: number;
  direction: 'CREDIT' | 'DEBIT';
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  providerReference?: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'REVERSED';
  createdAt: number;
  updatedAt: number;
}

export interface DepositRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  reference: string;
  providerReference?: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' | 'REVERSED';
  mode: TradingMode;
  createdAt: number;
  updatedAt: number;
}


export interface RiskSettings {
  tradingMode: TradingMode;
  minNetEdgePercent: number;
  maxTradeSizeUsd: number;
  maxDailyLossUsd: number;
  maxConcurrentTrades: number;
  maxSlippagePercent: number;
  maxDataAgeMs: number;
  minLiquidityUsd: number;
  killSwitchActive: boolean;
}

export interface ExchangeAccount {
  id: string;
  exchangeName: string;
  apiKeyMasked: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  permissions: string[];
  lastSync: number;
  isPaper: boolean;
  accountType?: string;
  lastError?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  category: 'SECURITY' | 'TRADE' | 'RISK' | 'SYSTEM' | 'EXCHANGE';
  details: string;
  timestamp: number;
  user: string;
}

export interface SystemHealth {
  exchangeWs: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  restApi: 'CONNECTED' | 'DEGRADED';
  database: 'HEALTHY' | 'ERROR';
  marketData: 'LIVE' | 'STALE';
  dataLatencyMs: number;
  executionEngine: 'READY' | 'BUSY' | 'STOPPED';
  riskEngine: 'ACTIVE' | 'TRIGGERED';
  activeStrategiesCount: number;
  uptimeSeconds: number;
}

export interface LiveReadiness {
  ready: boolean;
  exchangeConnected: boolean;
  credentialsValid: boolean;
  marketDataAvailable: boolean;
  accountAccessible: boolean;
  tradingPermission: boolean;
  riskManagementConfigured: boolean;
  killSwitchAvailable: boolean;
  reason: string | null;
}
