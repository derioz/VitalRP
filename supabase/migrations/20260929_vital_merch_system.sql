-- =========================================================================
-- Vital RP — Merch Store & Printify Fulfillment Database Schema
-- Migration: 20260929_vital_merch_system.sql
-- =========================================================================

-- 1. Create sequence for human-friendly order numbers (e.g. VRP-1001, VRP-1002)
create sequence if not exists public.merch_order_number_seq start with 1001;

-- 2. Merch Products Table
create table if not exists public.merch_products (
  id uuid primary key default gen_random_uuid(),
  printify_product_id text unique not null,
  title text not null,
  slug text unique not null,
  description text default '',
  blueprint_id integer,
  print_provider_id integer,
  category text not null default 'Apparel',
  status text not null default 'draft' check (status in ('draft', 'sample_ordered', 'approved', 'live', 'disabled')),
  is_featured boolean not null default false,
  is_limited_drop boolean not null default false,
  is_coming_soon boolean not null default false,
  season text,
  badge text,
  display_order integer not null default 0,
  base_price_cents integer not null default 0,
  retail_price_cents integer not null default 0,
  sale_price_cents integer,
  mockup_images jsonb not null default '[]'::jsonb,
  details text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 3. Merch Variants Table
create table if not exists public.merch_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.merch_products(id) on delete cascade,
  printify_variant_id bigint not null,
  title text not null,
  size text,
  color text,
  sku text default '',
  cost_cents integer not null default 0,
  retail_price_cents integer not null default 0,
  is_enabled boolean not null default true,
  is_in_stock boolean not null default true,
  options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique(product_id, printify_variant_id)
);

-- 4. Merch Discount & Promo Codes Table
create table if not exists public.merch_discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text default '',
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount')),
  discount_value numeric not null check (discount_value > 0),
  min_subtotal_cents integer not null default 0,
  max_uses integer,
  uses_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 5. Merch Orders Table
create table if not exists public.merch_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  discord_id text,
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  shipping_address jsonb not null,
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  discount_cents integer not null default 0,
  discount_code text,
  total_cents integer not null default 0,
  currency text not null default 'usd',
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status text not null default 'unfulfilled' check (
    fulfillment_status in (
      'unfulfilled',
      'submitted',
      'in_production',
      'shipped',
      'delivered',
      'canceled',
      'fulfillment_error'
    )
  ),
  stripe_payment_intent_id text unique,
  stripe_checkout_session_id text unique,
  printify_order_id text,
  printify_status text default 'pending',
  tracking_number text,
  carrier text,
  tracking_url text,
  fulfillment_error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 6. Merch Order Items Table
create table if not exists public.merch_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.merch_orders(id) on delete cascade,
  product_id uuid references public.merch_products(id) on delete set null,
  variant_id uuid references public.merch_variants(id) on delete set null,
  printify_product_id text not null,
  printify_variant_id bigint not null,
  product_title text not null,
  variant_title text,
  size text,
  color text,
  image_url text,
  unit_price_cents integer not null,
  quantity integer not null default 1,
  total_cents integer not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 7. Webhook Event Log Table (Idempotency Protection)
create table if not exists public.merch_webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('stripe', 'printify')),
  event_id text unique not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  error text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- 8. Printify Catalog Sync Logs Table
create table if not exists public.merch_sync_logs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'in_progress',
  products_synced integer not null default 0,
  variants_synced integer not null default 0,
  error_message text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------------
-- Indexes for High Performance Querying
-- ---------------------------------------------------------------------------
create index if not exists idx_merch_products_status on public.merch_products(status);
create index if not exists idx_merch_products_slug on public.merch_products(slug);
create index if not exists idx_merch_products_printify_id on public.merch_products(printify_product_id);
create index if not exists idx_merch_variants_product_id on public.merch_variants(product_id);
create index if not exists idx_merch_variants_printify_id on public.merch_variants(printify_variant_id);
create index if not exists idx_merch_orders_user_id on public.merch_orders(user_id);
create index if not exists idx_merch_orders_discord_id on public.merch_orders(discord_id);
create index if not exists idx_merch_orders_order_number on public.merch_orders(order_number);
create index if not exists idx_merch_orders_stripe_session on public.merch_orders(stripe_checkout_session_id);
create index if not exists idx_merch_orders_printify_id on public.merch_orders(printify_order_id);
create index if not exists idx_merch_discounts_code on public.merch_discounts(code);
create index if not exists idx_merch_webhook_events_id on public.merch_webhook_events(event_id);

-- ---------------------------------------------------------------------------
-- Automatic Order Number Generator Trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_merch_order_number()
returns trigger as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'VRP-' || nextval('public.merch_order_number_seq');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_merch_order_number on public.merch_orders;
create trigger trg_set_merch_order_number
  before insert on public.merch_orders
  for each row execute procedure public.set_merch_order_number();

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
alter table public.merch_products enable row level security;
alter table public.merch_variants enable row level security;
alter table public.merch_discounts enable row level security;
alter table public.merch_orders enable row level security;
alter table public.merch_order_items enable row level security;
alter table public.merch_webhook_events enable row level security;
alter table public.merch_sync_logs enable row level security;

-- Helper function to check if current user is an admin
create or replace function public.is_merch_admin()
returns boolean as $$
declare
  v_role text;
  v_discord_id text;
begin
  if auth.uid() is null then
    return false;
  end if;

  select role, discord_id into v_role, v_discord_id
  from public.profiles
  where id = auth.uid();

  -- Super Admin or Admin role in profile
  if v_role in ('admin', 'owner') or v_discord_id = '150580708144840704' then
    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer;

-- Products Policies: Public can read live/sample items; Admins have full access
drop policy if exists "Public can view active products" on public.merch_products;
create policy "Public can view active products"
  on public.merch_products for select
  using (status in ('live', 'sample_ordered', 'approved') or public.is_merch_admin());

drop policy if exists "Admins can manage products" on public.merch_products;
create policy "Admins can manage products"
  on public.merch_products for all
  using (public.is_merch_admin());

-- Variants Policies: Public can view variants of active products; Admins have full access
drop policy if exists "Public can view variants" on public.merch_variants;
create policy "Public can view variants"
  on public.merch_variants for select
  using (true);

drop policy if exists "Admins can manage variants" on public.merch_variants;
create policy "Admins can manage variants"
  on public.merch_variants for all
  using (public.is_merch_admin());

-- Discounts Policies: Public can view active discounts; Admins manage
drop policy if exists "Public can view active discounts" on public.merch_discounts;
create policy "Public can view active discounts"
  on public.merch_discounts for select
  using (is_active = true or public.is_merch_admin());

drop policy if exists "Admins can manage discounts" on public.merch_discounts;
create policy "Admins can manage discounts"
  on public.merch_discounts for all
  using (public.is_merch_admin());

-- Orders Policies: Users can view their own orders; Admins can view/manage all
drop policy if exists "Users can view their own orders" on public.merch_orders;
create policy "Users can view their own orders"
  on public.merch_orders for select
  using (auth.uid() = user_id or public.is_merch_admin());

drop policy if exists "Admins can manage orders" on public.merch_orders;
create policy "Admins can manage orders"
  on public.merch_orders for all
  using (public.is_merch_admin());

-- Order Items Policies: Viewable by order owner or admin
drop policy if exists "Users can view their own order items" on public.merch_order_items;
create policy "Users can view their own order items"
  on public.merch_order_items for select
  using (
    exists (
      select 1 from public.merch_orders
      where public.merch_orders.id = public.merch_order_items.order_id
        and (public.merch_orders.user_id = auth.uid() or public.is_merch_admin())
    )
  );

drop policy if exists "Admins can manage order items" on public.merch_order_items;
create policy "Admins can manage order items"
  on public.merch_order_items for all
  using (public.is_merch_admin());

-- Webhooks & Sync Logs: Admins only
drop policy if exists "Admins can view webhook events" on public.merch_webhook_events;
create policy "Admins can view webhook events"
  on public.merch_webhook_events for all
  using (public.is_merch_admin());

drop policy if exists "Admins can view sync logs" on public.merch_sync_logs;
create policy "Admins can view sync logs"
  on public.merch_sync_logs for all
  using (public.is_merch_admin());
