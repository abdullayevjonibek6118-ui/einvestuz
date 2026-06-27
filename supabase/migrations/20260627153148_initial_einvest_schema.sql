create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.market_scope as enum ('uzbekistan', 'global');
create type public.document_kind as enum ('annual_report', 'quarterly_report', 'material_fact', 'prospectus', 'charter', 'other');
create type public.ingestion_status as enum ('running', 'succeeded', 'failed', 'partial');

create table public.data_sources (
  id text primary key,
  name text not null,
  base_url text,
  market public.market_scope not null default 'uzbekistan',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  ticker citext not null unique,
  name text not null,
  isin citext unique,
  market public.market_scope not null default 'uzbekistan',
  exchange text not null default 'UZSE',
  sector text,
  industry text,
  currency char(3) not null default 'UZS',
  listing_category text,
  stock_type text,
  openinfo_id bigint,
  website text,
  source_id text references public.data_sources(id),
  source_updated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index companies_market_idx on public.companies(market, exchange);
create index companies_name_idx on public.companies using gin(to_tsvector('simple', name));

create table public.market_quotes (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  price numeric(24,6) not null check (price >= 0),
  open numeric(24,6), high numeric(24,6), low numeric(24,6), previous_close numeric(24,6),
  volume numeric(28,6), change_percent numeric(12,6), currency char(3) not null default 'UZS',
  quoted_at timestamptz not null,
  source_id text references public.data_sources(id),
  created_at timestamptz not null default now(),
  unique(company_id, quoted_at, source_id)
);
create index market_quotes_company_time_idx on public.market_quotes(company_id, quoted_at desc);

create table public.financial_periods (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  period text not null,
  period_end date,
  period_type text,
  revenue numeric(28,4), ebitda numeric(28,4), net_income numeric(28,4), assets numeric(28,4), liabilities numeric(28,4), equity numeric(28,4), operating_cash_flow numeric(28,4), free_cash_flow numeric(28,4),
  roe numeric(14,6), roa numeric(14,6), eps numeric(24,8), pe numeric(18,6), pb numeric(18,6), debt_to_equity numeric(18,6), current_ratio numeric(18,6), gross_margin numeric(14,6), net_margin numeric(14,6),
  currency char(3) not null default 'UZS', source_id text references public.data_sources(id), raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(company_id, period, source_id)
);
create index financial_periods_company_idx on public.financial_periods(company_id, period_end desc nulls last);

create table public.dividends (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  approved_date date, record_date date, payment_date date,
  amount_per_share numeric(24,8), yield_percent numeric(14,6), currency char(3) not null default 'UZS',
  source_id text references public.data_sources(id), raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index dividends_company_idx on public.dividends(company_id, approved_date desc);

create table public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind public.document_kind not null default 'other', title text not null, period text, published_at timestamptz, url text not null,
  source_id text references public.data_sources(id), metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  unique(company_id, url)
);

create table public.market_news (
  id uuid primary key default gen_random_uuid(),
  title text not null, url text not null unique, source_name text not null, published_at timestamptz,
  summary text, sentiment numeric(5,4) check (sentiment between -1 and 1), market_impact text,
  raw jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.company_news (
  company_id uuid references public.companies(id) on delete cascade,
  news_id uuid references public.market_news(id) on delete cascade,
  relevance numeric(5,4) check (relevance between 0 and 1),
  primary key(company_id, news_id)
);

create table public.macro_indicators (
  id bigint generated always as identity primary key,
  code text not null, label text not null, value numeric(28,8) not null, unit text, observed_at date not null,
  source_id text references public.data_sources(id), metadata jsonb not null default '{}'::jsonb,
  unique(code, observed_at, source_id)
);

create table public.ipo_events (
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id) on delete set null,
  issuer_name text not null, status text not null, expected_date date, offer_price_min numeric(24,6), offer_price_max numeric(24,6), currency char(3) default 'UZS',
  source_url text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text, preferred_currency char(3) not null default 'UZS', locale text not null default 'ru-UZ',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.portfolios (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Основной', base_currency char(3) not null default 'UZS', is_virtual boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.portfolio_positions (
  id uuid primary key default gen_random_uuid(), portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  company_id uuid references public.companies(id) on delete restrict, ticker citext not null,
  quantity numeric(24,8) not null check (quantity > 0), average_price numeric(24,8) not null check (average_price >= 0), currency char(3) not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(portfolio_id, ticker)
);
create table public.watchlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(user_id, company_id)
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(), source_id text not null references public.data_sources(id), status public.ingestion_status not null default 'running',
  started_at timestamptz not null default now(), finished_at timestamptz, rows_read integer not null default 0, rows_written integer not null default 0,
  error_message text, metadata jsonb not null default '{}'::jsonb
);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger sources_updated_at before update on public.data_sources for each row execute function public.set_updated_at();
create trigger financials_updated_at before update on public.financial_periods for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger portfolios_updated_at before update on public.portfolios for each row execute function public.set_updated_at();
create trigger positions_updated_at before update on public.portfolio_positions for each row execute function public.set_updated_at();
create trigger ipo_updated_at before update on public.ipo_events for each row execute function public.set_updated_at();

alter table public.data_sources enable row level security;
alter table public.companies enable row level security;
alter table public.market_quotes enable row level security;
alter table public.financial_periods enable row level security;
alter table public.dividends enable row level security;
alter table public.company_documents enable row level security;
alter table public.market_news enable row level security;
alter table public.company_news enable row level security;
alter table public.macro_indicators enable row level security;
alter table public.ipo_events enable row level security;
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_positions enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.ingestion_runs enable row level security;

create policy "public market sources readable" on public.data_sources for select using (is_active);
create policy "public companies readable" on public.companies for select using (true);
create policy "public quotes readable" on public.market_quotes for select using (true);
create policy "public financials readable" on public.financial_periods for select using (true);
create policy "public dividends readable" on public.dividends for select using (true);
create policy "public documents readable" on public.company_documents for select using (true);
create policy "public news readable" on public.market_news for select using (true);
create policy "public company news readable" on public.company_news for select using (true);
create policy "public macro readable" on public.macro_indicators for select using (true);
create policy "public ipo readable" on public.ipo_events for select using (true);

create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users read own portfolios" on public.portfolios for select using (auth.uid() = user_id);
create policy "users create own portfolios" on public.portfolios for insert with check (auth.uid() = user_id);
create policy "users update own portfolios" on public.portfolios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own portfolios" on public.portfolios for delete using (auth.uid() = user_id);
create policy "users manage own positions" on public.portfolio_positions for all using (exists(select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid())) with check (exists(select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()));
create policy "users manage own watchlist" on public.watchlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.data_sources(id, name, base_url, market) values
  ('stockscope', 'StockScope Uzbekistan', 'https://stockscope.uz', 'uzbekistan'),
  ('uzse', 'Uzbekistan Stock Exchange', 'https://uzse.uz', 'uzbekistan'),
  ('openinfo', 'OpenInfo Uzbekistan', 'https://openinfo.uz', 'uzbekistan'),
  ('cbu', 'Central Bank of Uzbekistan', 'https://cbu.uz', 'uzbekistan')
on conflict (id) do update set name = excluded.name, base_url = excluded.base_url, updated_at = now();
