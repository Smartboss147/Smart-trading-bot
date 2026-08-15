-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. User Settings (Risk settings)
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    trading_mode TEXT DEFAULT 'PAPER',
    min_net_edge_percent NUMERIC DEFAULT 0.5,
    max_trade_size_usd NUMERIC DEFAULT 1000,
    max_daily_loss_usd NUMERIC DEFAULT 500,
    max_concurrent_trades INTEGER DEFAULT 3,
    max_slippage_percent NUMERIC DEFAULT 0.2,
    max_data_age_ms INTEGER DEFAULT 5000,
    min_liquidity_usd NUMERIC DEFAULT 10000,
    kill_switch_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = id);

-- 3. Exchange Connections
CREATE TABLE public.exchange_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange_name TEXT NOT NULL,
    api_key TEXT,
    api_key_masked TEXT,
    api_secret_encrypted TEXT,
    status TEXT DEFAULT 'DISCONNECTED',
    permissions JSONB DEFAULT '[]',
    is_paper BOOLEAN DEFAULT false,
    last_sync TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, exchange_name)
);
ALTER TABLE public.exchange_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own connections" ON public.exchange_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.exchange_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.exchange_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.exchange_connections FOR DELETE USING (auth.uid() = user_id);

-- 4. Balances (Ledgers/Deposits could update this or be stored as views, but let's store snapshot)
CREATE TABLE public.balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    exchange TEXT NOT NULL,
    free NUMERIC DEFAULT 0,
    locked NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    usd_value NUMERIC DEFAULT 0,
    mode TEXT DEFAULT 'PAPER',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, asset, exchange, mode)
);
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own balances" ON public.balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own balances" ON public.balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balances" ON public.balances FOR UPDATE USING (auth.uid() = user_id);

-- 5. Orders
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange TEXT,
    symbol TEXT,
    strategy TEXT,
    side TEXT,
    type TEXT,
    quantity NUMERIC,
    price NUMERIC,
    filled NUMERIC DEFAULT 0,
    remaining NUMERIC,
    status TEXT,
    mode TEXT DEFAULT 'PAPER',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);

-- 6. Trades
CREATE TABLE public.trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exchange TEXT,
    symbol TEXT,
    strategy TEXT,
    side TEXT,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    quantity NUMERIC,
    requested_price NUMERIC,
    average_fill_price NUMERIC,
    fees NUMERIC,
    slippage NUMERIC,
    gross_profit NUMERIC,
    net_profit NUMERIC,
    status TEXT,
    mode TEXT DEFAULT 'PAPER',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id);

-- 7. Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT,
    category TEXT,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Ledger Entries
CREATE TABLE public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    account_mode TEXT,
    transaction_type TEXT,
    currency TEXT,
    amount NUMERIC,
    direction TEXT,
    balance_before NUMERIC,
    balance_after NUMERIC,
    reference TEXT,
    provider_reference TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ledger entries" ON public.ledger_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ledger entries" ON public.ledger_entries FOR UPDATE USING (auth.uid() = user_id);

-- 9. Deposits
CREATE TABLE public.deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC,
    currency TEXT,
    payment_method TEXT,
    reference TEXT,
    provider_reference TEXT,
    status TEXT,
    mode TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deposits" ON public.deposits FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_settings (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.balances (user_id, asset, exchange, free, locked, total, usd_value, mode)
  VALUES 
    (new.id, 'NGN', 'Binance', 2500000.00, 50000.00, 2550000.00, 1700.00, 'PAPER'),
    (new.id, 'USDT', 'Binance', 12450.50, 150.00, 12600.50, 12600.50, 'PAPER'),
    (new.id, 'BTC', 'Binance', 0.45, 0.01, 0.46, 43240.00, 'PAPER'),
    (new.id, 'ETH', 'Binance', 3.20, 0.00, 3.20, 10240.00, 'PAPER')
  ON CONFLICT (user_id, asset, exchange, mode) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


