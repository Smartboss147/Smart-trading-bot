export interface GateOrderBookUpdate {
  symbol: string;
  bids: [string, string][]; // [price, amount]
  asks: [string, string][]; // [price, amount]
  timestamp: number;
}

export interface GateTradeUpdate {
  id: number;
  symbol: string;
  price: string;
  amount: string;
  side: 'buy' | 'sell';
  create_time_ms: number;
}

export interface GateTickerUpdate {
  currency_pair: string;
  last: string;
  lowest_ask: string;
  highest_bid: string;
  change_percentage: string;
  base_volume: string;
  quote_volume: string;
  high_24h: string;
  low_24h: string;
}

type MessageCallback = (channel: string, event: string, result: any) => void;

export class GateWsClient {
  private url: string;
  private ws: WebSocket | null = null;
  private callbacks: Map<string, Set<MessageCallback>> = new Map();
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private subscribedOrderBookPairs: Set<string> = new Set();
  private subscribedTradesPairs: Set<string> = new Set();
  private subscribedTickerPairs: Set<string> = new Set();

  constructor(url = 'wss://api.gateio.ws/ws/v4') {
    this.url = url;
  }

  public connect() {
    if (this.ws) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('[Gate.io WS] Connected to Gate.io WebSocket v4 (wss://api.gateio.ws/ws/v4)');
        this.resubscribe();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const channel = data.channel;
          const evt = data.event;
          const result = data.result;

          if (channel && this.callbacks.has(channel)) {
            const channelCallbacks = this.callbacks.get(channel);
            channelCallbacks?.forEach((cb) => cb(channel, evt, result));
          }
        } catch (err: any) {
          console.warn('[Gate.io WS] Error parsing message:', err?.message);
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[Gate.io WS] WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        console.log('[Gate.io WS] Disconnected. Reconnecting in 3s...');
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      };
    } catch (err: any) {
      console.warn('[Gate.io WS] Connection failed:', err?.message);
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    }
  }

  public subscribeOrderBook(pairs: string[], limit = 5, interval = '100ms', callback: (data: GateOrderBookUpdate) => void) {
    const channel = 'spot.order_book';
    this.addCallback(channel, (_, event, result) => {
      if (event === 'update' && result) {
        callback({
          symbol: result.s || result.currency_pair,
          bids: result.bids || [],
          asks: result.asks || [],
          timestamp: result.t || Date.now(),
        });
      }
    });

    pairs.forEach((p) => this.subscribedOrderBookPairs.add(p));
    this.send(channel, 'subscribe', pairs.flatMap((p) => [p, limit.toString(), interval]));
  }

  public subscribeTrades(pairs: string[], callback: (data: GateTradeUpdate) => void) {
    const channel = 'spot.trades';
    this.addCallback(channel, (_, event, result) => {
      if (event === 'update' && result) {
        const trades = Array.isArray(result) ? result : [result];
        trades.forEach((t: any) => {
          callback({
            id: t.id,
            symbol: t.currency_pair,
            price: t.price,
            amount: t.amount,
            side: t.side,
            create_time_ms: t.create_time_ms ? Number(t.create_time_ms) : Date.now(),
          });
        });
      }
    });

    pairs.forEach((p) => this.subscribedTradesPairs.add(p));
    this.send(channel, 'subscribe', pairs);
  }

  public subscribeTickers(pairs: string[], callback: (data: GateTickerUpdate) => void) {
    const channel = 'spot.tickers';
    this.addCallback(channel, (_, event, result) => {
      if (event === 'update' && result) {
        callback(result);
      }
    });

    pairs.forEach((p) => this.subscribedTickerPairs.add(p));
    this.send(channel, 'subscribe', pairs);
  }

  private addCallback(channel: string, cb: MessageCallback) {
    if (!this.callbacks.has(channel)) {
      this.callbacks.set(channel, new Set());
    }
    this.callbacks.get(channel)!.add(cb);
  }

  private send(channel: string, event: string, payload: any[]) {
    if (this.ws && this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      const msg = {
        time: Math.floor(Date.now() / 1000),
        channel,
        event,
        payload,
      };
      this.ws.send(JSON.stringify(msg));
    }
  }

  private resubscribe() {
    if (this.subscribedOrderBookPairs.size > 0) {
      const pairs = Array.from(this.subscribedOrderBookPairs);
      this.send('spot.order_book', 'subscribe', pairs.flatMap((p) => [p, '5', '100ms']));
    }
    if (this.subscribedTradesPairs.size > 0) {
      this.send('spot.trades', 'subscribe', Array.from(this.subscribedTradesPairs));
    }
    if (this.subscribedTickerPairs.size > 0) {
      this.send('spot.tickers', 'subscribe', Array.from(this.subscribedTickerPairs));
    }
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const gateWs = new GateWsClient();
