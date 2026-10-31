-- MenuMint — initial schema
--
-- Security model (summary):
--   * Every table has RLS enabled. Table privileges are granted explicitly below
--     (no reliance on Supabase's default grants) and narrowed with column grants
--     where a role must not touch certain columns (e.g. restaurants.owner_id).
--   * Membership checks go through SECURITY DEFINER helpers so policies never
--     recurse into restaurant_memberships' own RLS.
--   * Writes to subscriptions and analytics_events happen only with the service
--     role (Stripe webhooks / anonymous ingestion); there are no write policies.
--   * Anonymous visitors can read: restaurants, branding, published + unarchived
--     menus (published_content) and unarchived QR codes. Drafts never leak.

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Lenient text -> uuid conversion (null when the text is not a uuid).
create or replace function public.safe_uuid(p_value text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then p_value::uuid
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  onboarding jsonb,
  created_at timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (lower(email));

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique
    constraint restaurants_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 64),
  name text not null check (char_length(name) between 1 and 120),
  tagline text not null default '',
  description text not null default '',
  cuisine text not null default '',
  address text not null default '',
  phone text not null default '',
  website text not null default '',
  currency text not null default 'USD'
    check (currency in ('USD','EUR','GBP','CAD','AUD','MXN','BRL','JPY','CHF','SEK')),
  logo_url text,
  cover_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index restaurants_owner_idx on public.restaurants (owner_id);

create table public.restaurant_memberships (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);
create index restaurant_memberships_user_idx on public.restaurant_memberships (user_id);

create table public.branding_configs (
  restaurant_id uuid primary key references public.restaurants (id) on delete cascade,
  template text not null default 'modern-bistro'
    check (template in ('modern-bistro','classic-elegance','minimal-cafe','bold-street-food','luxury-dining','coastal-fresh')),
  primary_color text not null default '#C8572B' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#E8BA77' check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  background_color text not null default '#FFF9F2' check (background_color ~ '^#[0-9A-Fa-f]{6}$'),
  heading_font text not null default 'fraunces'
    check (heading_font in ('fraunces','playfair','cormorant','dm-serif','archivo-black','space-grotesk','inter','dm-sans','lora','geist')),
  body_font text not null default 'dm-sans'
    check (body_font in ('fraunces','playfair','cormorant','dm-serif','archivo-black','space-grotesk','inter','dm-sans','lora','geist')),
  button_style text not null default 'pill' check (button_style in ('pill','rounded','square')),
  card_style text not null default 'elevated' check (card_style in ('elevated','outlined','flat','minimal')),
  radius integer not null default 18 check (radius between 0 and 32),
  background text not null default 'paper' check (background in ('solid','gradient','paper')),
  category_nav text not null default 'pills' check (category_nav in ('pills','underline')),
  item_layout text not null default 'list' check (item_layout in ('list','grid')),
  header_style text not null default 'cover' check (header_style in ('cover','centered','minimal')),
  theme text not null default 'light' check (theme in ('light','dark')),
  show_images boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  currency text not null default 'USD'
    check (currency in ('USD','EUR','GBP','CAD','AUD','MXN','BRL','JPY','CHF','SEK')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  has_unpublished_changes boolean not null default false,
  published_at timestamptz,
  published_content jsonb,
  archived boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug),
  -- Target for composite FKs that keep children inside the same restaurant.
  unique (id, restaurant_id)
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null,
  restaurant_id uuid not null,
  name text not null default '',
  description text not null default '',
  position integer not null default 0,
  foreign key (menu_id, restaurant_id) references public.menus (id, restaurant_id) on delete cascade,
  unique (id, menu_id)
);
create index menu_categories_menu_idx on public.menu_categories (menu_id, position);
create index menu_categories_restaurant_idx on public.menu_categories (restaurant_id);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null,
  category_id uuid not null,
  restaurant_id uuid not null,
  name text not null default '',
  description text not null default '',
  price integer not null default 0 check (price >= 0),
  available boolean not null default true,
  featured boolean not null default false,
  archived boolean not null default false,
  dietary text[] not null default '{}',
  allergens text[] not null default '{}',
  image_url text,
  position integer not null default 0,
  foreign key (category_id, menu_id) references public.menu_categories (id, menu_id) on delete cascade,
  foreign key (menu_id, restaurant_id) references public.menus (id, restaurant_id) on delete cascade
);
create index menu_items_menu_idx on public.menu_items (menu_id, position);
create index menu_items_category_idx on public.menu_items (category_id, position);
create index menu_items_restaurant_idx on public.menu_items (restaurant_id);

create table public.item_images (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  storage_path text not null,
  url text not null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index item_images_restaurant_idx on public.item_images (restaurant_id);

create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{8}$'),
  name text not null default '',
  menu_id uuid,
  style jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A QR code may only point at a menu of its own restaurant; deleting the menu
  -- falls back to the restaurant landing page (menu_id -> null).
  foreign key (menu_id, restaurant_id) references public.menus (id, restaurant_id) on delete set null (menu_id)
);
create index qr_codes_restaurant_idx on public.qr_codes (restaurant_id, created_at);

-- No FKs on menu/item/qr ids so history survives deletes. No IPs / user agents.
create table public.analytics_events (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  type text not null check (type in ('menu_view', 'qr_scan', 'item_view')),
  menu_id uuid,
  item_id uuid,
  qr_code_id uuid,
  device text not null default 'unknown' check (device in ('mobile', 'tablet', 'desktop', 'unknown')),
  referrer_host text,
  is_demo boolean not null default false,
  occurred_at timestamptz not null default now()
);
create index analytics_events_restaurant_time_idx on public.analytics_events (restaurant_id, occurred_at);

create table public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'business')),
  status text not null default 'none'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid', 'none')),
  source text not null default 'default' check (source in ('default', 'stripe', 'demo')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  kind text not null,
  message text not null default '',
  created_at timestamptz not null default now()
);
create index activity_log_restaurant_time_idx on public.activity_log (restaurant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger restaurants_updated_at before update on public.restaurants
  for each row execute function public.set_updated_at();
create trigger branding_configs_updated_at before update on public.branding_configs
  for each row execute function public.set_updated_at();
create trigger menus_updated_at before update on public.menus
  for each row execute function public.set_updated_at();
create trigger qr_codes_updated_at before update on public.qr_codes
  for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth hooks: profile + default subscription for every new auth user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status, source)
  values (new.id, 'free', 'none', 'default')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(coalesce(new.email, '')) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER: bypass RLS to avoid recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_restaurant_member(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurant_memberships m
    where m.restaurant_id = rid and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_restaurant_owner(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.restaurant_memberships m
    where m.restaurant_id = rid and m.user_id = auth.uid() and m.role = 'owner'
  );
$$;

-- The restaurant's primary owner (restaurants.owner_id) membership is immutable
-- through the API, so no one can lock the owner out of their own restaurant.
create or replace function public.is_primary_owner(rid uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.restaurants r where r.id = rid and r.owner_id = uid);
$$;

-- Creating a restaurant automatically makes its owner an 'owner' member.
create or replace function public.handle_new_restaurant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.restaurant_memberships (restaurant_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (restaurant_id, user_id) do update set role = 'owner';
  return new;
end;
$$;

create trigger on_restaurant_created
  after insert on public.restaurants
  for each row execute function public.handle_new_restaurant();

-- ---------------------------------------------------------------------------
-- Privileges (explicit; RLS then filters rows)
-- ---------------------------------------------------------------------------

revoke all on
  public.profiles, public.restaurants, public.restaurant_memberships, public.branding_configs,
  public.menus, public.menu_categories, public.menu_items, public.item_images, public.qr_codes,
  public.analytics_events, public.subscriptions, public.activity_log
from anon, authenticated;

grant all on
  public.profiles, public.restaurants, public.restaurant_memberships, public.branding_configs,
  public.menus, public.menu_categories, public.menu_items, public.item_images, public.qr_codes,
  public.analytics_events, public.subscriptions, public.activity_log
to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Public (anon) read surface.
grant select on public.restaurants, public.branding_configs, public.menus, public.qr_codes to anon;

-- Authenticated users.
grant select on public.profiles to authenticated;
grant update (full_name, onboarding) on public.profiles to authenticated;

grant select, insert, delete on public.restaurants to authenticated;
-- owner_id and is_demo are deliberately NOT updatable by end users.
grant update (slug, name, tagline, description, cuisine, address, phone, website, currency, logo_url, cover_url)
  on public.restaurants to authenticated;

grant select, insert, delete on public.restaurant_memberships to authenticated;
grant update (role) on public.restaurant_memberships to authenticated;

grant select, insert, update, delete on
  public.branding_configs, public.menus, public.menu_categories, public.menu_items, public.qr_codes
to authenticated;
grant select, insert, delete on public.item_images to authenticated;
grant select, insert on public.activity_log to authenticated;
grant select on public.analytics_events to authenticated;
grant select on public.subscriptions to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_memberships enable row level security;
alter table public.branding_configs enable row level security;
alter table public.menus enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.item_images enable row level security;
alter table public.qr_codes enable row level security;
alter table public.analytics_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.activity_log enable row level security;

-- profiles: self only
create policy "profiles: self select" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: self update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- restaurants: public business info
create policy "restaurants: public read" on public.restaurants
  for select to anon, authenticated using (true);
create policy "restaurants: create own" on public.restaurants
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and is_demo = false);
create policy "restaurants: owners update" on public.restaurants
  for update to authenticated
  using (public.is_restaurant_owner(id)) with check (public.is_restaurant_owner(id));
create policy "restaurants: primary owner delete" on public.restaurants
  for delete to authenticated using (owner_id = (select auth.uid()));

-- memberships: members read; owners manage; primary owner row is protected
create policy "memberships: members read" on public.restaurant_memberships
  for select to authenticated using (public.is_restaurant_member(restaurant_id));
create policy "memberships: owners add" on public.restaurant_memberships
  for insert to authenticated with check (public.is_restaurant_owner(restaurant_id));
create policy "memberships: owners change role" on public.restaurant_memberships
  for update to authenticated
  using (public.is_restaurant_owner(restaurant_id) and not public.is_primary_owner(restaurant_id, user_id))
  with check (public.is_restaurant_owner(restaurant_id) and not public.is_primary_owner(restaurant_id, user_id));
create policy "memberships: owners remove or self leave" on public.restaurant_memberships
  for delete to authenticated
  using (
    not public.is_primary_owner(restaurant_id, user_id)
    and (public.is_restaurant_owner(restaurant_id) or user_id = (select auth.uid()))
  );

-- branding: public read; members write
create policy "branding: public read" on public.branding_configs
  for select to anon, authenticated using (true);
create policy "branding: members insert" on public.branding_configs
  for insert to authenticated with check (public.is_restaurant_member(restaurant_id));
create policy "branding: members update" on public.branding_configs
  for update to authenticated
  using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));
create policy "branding: members delete" on public.branding_configs
  for delete to authenticated using (public.is_restaurant_member(restaurant_id));

-- menus: members full access; public sees published, unarchived menus
create policy "menus: public read published" on public.menus
  for select to anon, authenticated using (status = 'published' and archived = false);
create policy "menus: members read" on public.menus
  for select to authenticated using (public.is_restaurant_member(restaurant_id));
create policy "menus: members insert" on public.menus
  for insert to authenticated with check (public.is_restaurant_member(restaurant_id));
create policy "menus: members update" on public.menus
  for update to authenticated
  using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));
create policy "menus: members delete" on public.menus
  for delete to authenticated using (public.is_restaurant_member(restaurant_id));

-- menu_categories / menu_items: members only (public reads use published_content)
create policy "categories: members read" on public.menu_categories
  for select to authenticated using (public.is_restaurant_member(restaurant_id));
create policy "categories: members insert" on public.menu_categories
  for insert to authenticated with check (public.is_restaurant_member(restaurant_id));
create policy "categories: members update" on public.menu_categories
  for update to authenticated
  using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));
create policy "categories: members delete" on public.menu_categories
  for delete to authenticated using (public.is_restaurant_member(restaurant_id));

create policy "items: members read" on public.menu_items
  for select to authenticated using (public.is_restaurant_member(restaurant_id));
create policy "items: members insert" on public.menu_items
  for insert to authenticated with check (public.is_restaurant_member(restaurant_id));
create policy "items: members update" on public.menu_items
  for update to authenticated
  using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));
create policy "items: members delete" on public.menu_items
  for delete to authenticated using (public.is_restaurant_member(restaurant_id));

-- item_images
create policy "images: members read" on public.item_images
  for select to authenticated using (public.is_restaurant_member(restaurant_id));
create policy "images: members insert" on public.item_images
  for insert to authenticated
  with check (public.is_restaurant_member(restaurant_id) and uploaded_by = (select auth.uid()));
create policy "images: members delete" on public.item_images
  for delete to authenticated using (public.is_restaurant_member(restaurant_id));

-- qr_codes: public read of active codes; members full access
create policy "qr: public read active" on public.qr_codes
  for select to anon, authenticated using (archived = false);
create policy "qr: members read" on public.qr_codes
  for select to authenticated using (public.is_restaurant_member(restaurant_id));
create policy "qr: members insert" on public.qr_codes
  for insert to authenticated with check (public.is_restaurant_member(restaurant_id));
create policy "qr: members update" on public.qr_codes
  for update to authenticated
  using (public.is_restaurant_member(restaurant_id)) with check (public.is_restaurant_member(restaurant_id));
create policy "qr: members delete" on public.qr_codes
  for delete to authenticated using (public.is_restaurant_member(restaurant_id));

-- analytics_events: members read; ingestion via service role only
create policy "analytics: members read" on public.analytics_events
  for select to authenticated using (public.is_restaurant_member(restaurant_id));

-- subscriptions: self read; writes via service role only
create policy "subscriptions: self read" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

-- activity_log: append-only for members
create policy "activity: members read" on public.activity_log
  for select to authenticated using (public.is_restaurant_member(restaurant_id));
create policy "activity: members insert" on public.activity_log
  for insert to authenticated
  with check (public.is_restaurant_member(restaurant_id) and (user_id is null or user_id = (select auth.uid())));

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Builds the camelCase MenuContent snapshot from live rows (archived items excluded).
-- SECURITY INVOKER: callers only see rows RLS lets them see.
create or replace function public.build_menu_content(p_menu_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'name', m.name,
    'description', m.description,
    'currency', m.currency,
    'categories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'description', c.description,
          'position', c.position,
          'items', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', i.id,
                'categoryId', i.category_id,
                'name', i.name,
                'description', i.description,
                'price', i.price,
                'available', i.available,
                'featured', i.featured,
                'archived', i.archived,
                'dietary', to_jsonb(i.dietary),
                'allergens', to_jsonb(i.allergens),
                'imageUrl', i.image_url,
                'position', i.position
              ) order by i.position, i.id
            )
            from public.menu_items i
            where i.category_id = c.id and i.archived = false
          ), '[]'::jsonb)
        ) order by c.position, c.id
      )
      from public.menu_categories c
      where c.menu_id = m.id
    ), '[]'::jsonb)
  )
  from public.menus m
  where m.id = p_menu_id;
$$;

create or replace function public.save_menu_content(p_menu_id uuid, p_content jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_menu public.menus%rowtype;
  v_cat jsonb;
  v_cat_idx bigint;
  v_cat_id uuid;
  v_item jsonb;
  v_item_idx bigint;
  v_item_id uuid;
  v_rows integer;
begin
  if p_content is null or jsonb_typeof(p_content) <> 'object' then
    raise exception 'Invalid menu content' using errcode = '22023';
  end if;

  select * into v_menu from public.menus where id = p_menu_id for update;
  if not found then
    raise exception 'Menu not found' using errcode = 'P0002';
  end if;

  delete from public.menu_categories where menu_id = p_menu_id; -- cascades to items
  delete from public.menu_items where menu_id = p_menu_id;

  for v_cat, v_cat_idx in
    select value, ordinality - 1
    from jsonb_array_elements(coalesce(p_content -> 'categories', '[]'::jsonb)) with ordinality
  loop
    -- Client-generated ids: reuse when free, otherwise (owned by another menu,
    -- duplicated in the payload or invalid) mint a fresh one. ON CONFLICT also
    -- covers rows the caller cannot see through RLS.
    v_cat_id := coalesce(public.safe_uuid(v_cat ->> 'id'), gen_random_uuid());
    loop
      insert into public.menu_categories (id, menu_id, restaurant_id, name, description, position)
      values (
        v_cat_id, p_menu_id, v_menu.restaurant_id,
        coalesce(v_cat ->> 'name', ''), coalesce(v_cat ->> 'description', ''), v_cat_idx
      )
      on conflict (id) do nothing;
      get diagnostics v_rows = row_count;
      exit when v_rows = 1;
      v_cat_id := gen_random_uuid();
    end loop;

    for v_item, v_item_idx in
      select value, ordinality - 1
      from jsonb_array_elements(coalesce(v_cat -> 'items', '[]'::jsonb)) with ordinality
    loop
      v_item_id := coalesce(public.safe_uuid(v_item ->> 'id'), gen_random_uuid());
      loop
        insert into public.menu_items (
          id, menu_id, category_id, restaurant_id, name, description, price,
          available, featured, archived, dietary, allergens, image_url, position
        )
        values (
          v_item_id, p_menu_id, v_cat_id, v_menu.restaurant_id,
          coalesce(v_item ->> 'name', ''),
          coalesce(v_item ->> 'description', ''),
          coalesce(round((v_item ->> 'price')::numeric)::integer, 0),
          coalesce((v_item ->> 'available')::boolean, true),
          coalesce((v_item ->> 'featured')::boolean, false),
          coalesce((v_item ->> 'archived')::boolean, false),
          array(select jsonb_array_elements_text(coalesce(v_item -> 'dietary', '[]'::jsonb))),
          array(select jsonb_array_elements_text(coalesce(v_item -> 'allergens', '[]'::jsonb))),
          nullif(v_item ->> 'imageUrl', ''),
          v_item_idx
        )
        on conflict (id) do nothing;
        get diagnostics v_rows = row_count;
        exit when v_rows = 1;
        v_item_id := gen_random_uuid();
      end loop;
    end loop;
  end loop;

  update public.menus
  set name = coalesce(p_content ->> 'name', name),
      description = coalesce(p_content ->> 'description', description),
      currency = coalesce(p_content ->> 'currency', currency),
      has_unpublished_changes = (status = 'published'),
      updated_at = now()
  where id = p_menu_id;
end;
$$;

create or replace function public.publish_menu(p_menu_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_content jsonb;
begin
  perform 1 from public.menus where id = p_menu_id for update;
  if not found then
    raise exception 'Menu not found' using errcode = 'P0002';
  end if;

  v_content := public.build_menu_content(p_menu_id);

  update public.menus
  set published_content = v_content,
      status = 'published',
      has_unpublished_changes = false,
      published_at = now(),
      updated_at = now()
  where id = p_menu_id;
end;
$$;

-- Used to invite teammates. Members cannot read other profiles under RLS.
create or replace function public.find_profile_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id from public.profiles p
  where lower(p.email) = lower(trim(p_email))
  limit 1;
$$;

-- Team list with emails/names. Profiles are self-read-only under RLS, so this
-- SECURITY DEFINER function exposes just email + full_name of co-members.
-- With the service role (auth.uid() is null) every membership is visible.
create or replace function public.restaurant_members(p_restaurant_id uuid, p_user_id uuid default null)
returns table (
  restaurant_id uuid,
  user_id uuid,
  role text,
  email text,
  full_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.restaurant_id, m.user_id, m.role, coalesce(p.email, ''), coalesce(p.full_name, ''), m.created_at
  from public.restaurant_memberships m
  left join public.profiles p on p.id = m.user_id
  where m.restaurant_id = p_restaurant_id
    and (p_user_id is null or m.user_id = p_user_id)
    and (auth.uid() is null or public.is_restaurant_member(p_restaurant_id))
  order by m.created_at, m.user_id;
$$;

-- Function privileges: nothing callable by anon except the harmless helpers RLS needs.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_restaurant_member(uuid),
  public.is_restaurant_owner(uuid),
  public.is_primary_owner(uuid, uuid),
  public.safe_uuid(text)
to anon;
grant execute on function
  public.is_restaurant_member(uuid),
  public.is_restaurant_owner(uuid),
  public.is_primary_owner(uuid, uuid),
  public.safe_uuid(text),
  public.set_updated_at(),
  public.build_menu_content(uuid),
  public.save_menu_content(uuid, jsonb),
  public.publish_menu(uuid),
  public.find_profile_id_by_email(text),
  public.restaurant_members(uuid, uuid)
to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage: public 'media' bucket, writes scoped to <restaurant_id>/... paths
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

create policy "media: members read" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_restaurant_member(public.safe_uuid((storage.foldername(name))[1])));
create policy "media: members upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_restaurant_member(public.safe_uuid((storage.foldername(name))[1])));
create policy "media: members update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_restaurant_member(public.safe_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'media' and public.is_restaurant_member(public.safe_uuid((storage.foldername(name))[1])));
create policy "media: members delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_restaurant_member(public.safe_uuid((storage.foldername(name))[1])));
