-- MenuMint — live demo seed (Saffron & Sage demo restaurant)
--
-- Clerk is the auth provider, so profiles are not created from auth.users.
-- This seed finds (or creates) a profile for demo@menumint.app using a normal
-- generated uuid, then builds the public Saffron & Sage demo restaurant.
--
-- How to use: paste into the Supabase SQL editor or run via
--   `supabase db push` is not needed — this file is data, not schema.
--
-- Re-running is safe: the existing "saffron-sage" restaurant is deleted and
-- rebuilt. Runs as a privileged role (RLS bypassed) and does not depend on
-- auth.uid().

do $$
declare
  v_user uuid;
  v_restaurant uuid;
  v_dinner uuid;
  v_drinks uuid;
  v_brunch uuid;
  v_qr_table uuid;
  v_qr_bar uuid;
  v_day integer;
  v_views integer;
  v_n integer;
  v_at timestamptz;
  v_is_drinks boolean;
  v_from_qr boolean;
  v_menu uuid;
  v_item uuid;
  v_devices text[] := array['mobile','mobile','mobile','mobile','tablet','desktop'];
  v_device text;
begin
  -- Clerk owns auth; profiles live in public.profiles and no longer reference
  -- auth.users, so the demo owner can be created directly.
  select id into v_user from public.profiles where lower(email) = 'demo@menumint.app' limit 1;
  if v_user is null then
    v_user := gen_random_uuid();
    insert into public.profiles (id, email, full_name)
    values (v_user, 'demo@menumint.app', 'Elena Marchetti');
  end if;

  -- Profile + subscription normally come from the auth trigger; make sure they exist.
  insert into public.profiles (id, email, full_name)
  values (v_user, 'demo@menumint.app', 'Elena Marchetti')
  on conflict (id) do update set full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end;

  insert into public.subscriptions (user_id, plan, status, source)
  values (v_user, 'pro', 'active', 'demo')
  on conflict (user_id) do update set plan = 'pro', status = 'active', source = 'demo';

  delete from public.restaurants where slug = 'saffron-sage';

  insert into public.restaurants (
    owner_id, slug, name, tagline, description, cuisine, address, phone, website, currency, logo_url, cover_url, is_demo
  ) values (
    v_user, 'saffron-sage', 'Saffron & Sage', 'Mediterranean kitchen & natural wine',
    'A neighbourhood bistro cooking over open fire, with pasta made by hand every morning.',
    'Mediterranean', '214 Alder Street, Portland, OR', '(503) 555-0142', '', 'USD',
    null, '/images/covers/modern-bistro.jpg', true
  ) returning id into v_restaurant;
  -- Owner membership is created by the on_restaurant_created trigger.

  -- "modern-bistro" template defaults (src/lib/templates.ts)
  insert into public.branding_configs (
    restaurant_id, template, primary_color, secondary_color, background_color, heading_font, body_font,
    button_style, card_style, radius, background, category_nav, item_layout, header_style, theme, show_images
  ) values (
    v_restaurant, 'modern-bistro', '#C8572B', '#E8BA77', '#FFF9F2', 'fraunces', 'dm-sans',
    'pill', 'elevated', 18, 'paper', 'pills', 'list', 'cover', 'light', true
  );

  insert into public.menus (restaurant_id, name, slug, description, currency, position)
  values (v_restaurant, 'Dinner', 'dinner', 'Served nightly from 5pm.', 'USD', 0)
  returning id into v_dinner;
  insert into public.menus (restaurant_id, name, slug, description, currency, position)
  values (v_restaurant, 'Drinks', 'drinks', 'Aperitivo hour 4 – 6pm.', 'USD', 1)
  returning id into v_drinks;
  insert into public.menus (restaurant_id, name, slug, description, currency, position)
  values (v_restaurant, 'Weekend Brunch', 'weekend-brunch', 'Saturdays & Sundays.', 'USD', 2)
  returning id into v_brunch;

  -- save_menu_content is SECURITY INVOKER and does not use auth.uid(); as a
  -- privileged role it simply writes the rows (ids are generated).
  perform public.save_menu_content(v_dinner, $json${
    "name": "Dinner", "description": "Served nightly from 5pm.", "currency": "USD",
    "categories": [
      { "name": "Small Plates", "description": "Made for sharing, best with a glass of something cold.", "items": [
        { "name": "Burrata & Heirloom Tomatoes", "description": "Puglian burrata, late-summer tomatoes, basil oil, Maldon salt.", "price": 1600, "available": true, "featured": true, "archived": false, "dietary": ["vegetarian","gluten-free"], "allergens": ["milk"], "imageUrl": "/images/dishes/burrata.jpg" },
        { "name": "Charred Octopus", "description": "Smoked paprika potatoes, salsa verde, lemon.", "price": 2200, "available": true, "featured": false, "archived": false, "dietary": ["gluten-free","dairy-free"], "allergens": ["molluscs"], "imageUrl": "/images/dishes/octopus.jpg" },
        { "name": "Whipped Feta & Hot Honey", "description": "Za'atar flatbread, Calabrian chilli honey.", "price": 1200, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian"], "allergens": ["milk","gluten","sesame"], "imageUrl": null },
        { "name": "Crispy Artichokes", "description": "Preserved lemon aioli, parsley, sea salt.", "price": 1300, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian","gluten-free"], "allergens": ["eggs"], "imageUrl": null }
      ]},
      { "name": "Pasta & Grains", "description": "Pasta rolled by hand every morning.", "items": [
        { "name": "Pappardelle Ragù", "description": "Eight-hour beef & pork ragù, Parmigiano Reggiano.", "price": 2600, "available": true, "featured": true, "archived": false, "dietary": [], "allergens": ["gluten","eggs","milk","celery"], "imageUrl": "/images/dishes/pappardelle.jpg" },
        { "name": "Saffron Risotto", "description": "Carnaroli rice, Iranian saffron, crispy sage.", "price": 2400, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian","gluten-free"], "allergens": ["milk","sulphites"], "imageUrl": "/images/dishes/risotto.jpg" },
        { "name": "Wild Mushroom Orzo", "description": "Chanterelles, thyme, brown butter.", "price": 2300, "available": false, "featured": false, "archived": false, "dietary": ["vegetarian"], "allergens": ["gluten","milk"], "imageUrl": null }
      ]},
      { "name": "From the Fire", "description": "Cooked over oak and olive wood.", "items": [
        { "name": "Whole Grilled Branzino", "description": "Lemon, oregano, charred greens.", "price": 3400, "available": true, "featured": false, "archived": false, "dietary": ["gluten-free","dairy-free"], "allergens": ["fish"], "imageUrl": "/images/dishes/branzino.jpg" },
        { "name": "Wood-fired Margherita", "description": "San Marzano tomato, fior di latte, basil.", "price": 1800, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian"], "allergens": ["gluten","milk"], "imageUrl": "/images/dishes/margherita.jpg" },
        { "name": "Dry-aged Ribeye", "description": "45-day aged, rosemary jus, served medium-rare.", "price": 4800, "available": true, "featured": false, "archived": false, "dietary": ["gluten-free"], "allergens": ["sulphites"], "imageUrl": "/images/dishes/steak.jpg" }
      ]},
      { "name": "Desserts", "description": "", "items": [
        { "name": "Tiramisu", "description": "Mascarpone, espresso-soaked savoiardi, cocoa.", "price": 1100, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian"], "allergens": ["gluten","eggs","milk"], "imageUrl": "/images/dishes/tiramisu.jpg" },
        { "name": "Olive Oil Cake", "description": "Blood orange, crème fraîche, pistachio.", "price": 1000, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian"], "allergens": ["gluten","eggs","milk","tree-nuts"], "imageUrl": "/images/dishes/olive-oil-cake.jpg" }
      ]}
    ]
  }$json$::jsonb);

  perform public.save_menu_content(v_drinks, $json${
    "name": "Drinks", "description": "Aperitivo hour 4 – 6pm.", "currency": "USD",
    "categories": [
      { "name": "Cocktails", "description": "", "items": [
        { "name": "Saffron Spritz", "description": "Aperitivo, saffron cordial, prosecco, orange.", "price": 1400, "available": true, "featured": true, "archived": false, "dietary": ["vegan"], "allergens": ["sulphites"], "imageUrl": "/images/dishes/spritz.jpg" },
        { "name": "Negroni Bianco", "description": "Gin, bianco vermouth, Suze.", "price": 1500, "available": true, "featured": false, "archived": false, "dietary": ["vegan"], "allergens": ["sulphites"], "imageUrl": null }
      ]},
      { "name": "Coffee", "description": "Single-origin beans from our neighbours at Kiln Roasters.", "items": [
        { "name": "Flat White", "description": "Double ristretto, silky milk.", "price": 500, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian"], "allergens": ["milk"], "imageUrl": "/images/dishes/latte.jpg" },
        { "name": "Espresso", "description": "", "price": 350, "available": true, "featured": false, "archived": false, "dietary": ["vegan"], "allergens": [], "imageUrl": null }
      ]}
    ]
  }$json$::jsonb);

  perform public.save_menu_content(v_brunch, $json${
    "name": "Weekend Brunch", "description": "Saturdays & Sundays.", "currency": "USD",
    "categories": [
      { "name": "Brunch", "description": "Saturdays & Sundays, 9am – 2pm.", "items": [
        { "name": "Butter Croissant", "description": "Laminated in-house, 72-hour dough.", "price": 450, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian"], "allergens": ["gluten","milk","eggs"], "imageUrl": "/images/dishes/croissant.jpg" },
        { "name": "Shakshuka", "description": "Spiced tomato, baked eggs, labneh, sourdough.", "price": 1600, "available": true, "featured": false, "archived": false, "dietary": ["vegetarian"], "allergens": ["eggs","milk","gluten"], "imageUrl": null },
        { "name": "Tuna Poke Bowl", "description": "Sushi rice, avocado, edamame, sesame-ginger dressing.", "price": 1900, "available": true, "featured": false, "archived": false, "dietary": ["dairy-free"], "allergens": ["fish","soy","sesame"], "imageUrl": "/images/dishes/poke-bowl.jpg" }
      ]}
    ]
  }$json$::jsonb);

  -- Publish Dinner + Drinks directly (same logic as public.publish_menu).
  update public.menus
  set published_content = public.build_menu_content(id),
      status = 'published',
      has_unpublished_changes = false,
      published_at = now()
  where id in (v_dinner, v_drinks);

  insert into public.qr_codes (restaurant_id, code, name, menu_id, style)
  values (v_restaurant, 'sgtable1', 'Table tents', null,
    '{"fg":"#241B18","bg":"#FFFFFF","dotStyle":"rounded","cornerStyle":"rounded","logo":false,"frameLabel":"Scan for menu"}'::jsonb)
  returning id into v_qr_table;
  insert into public.qr_codes (restaurant_id, code, name, menu_id, style)
  values (v_restaurant, 'sgdrink1', 'Bar — drinks list', v_drinks,
    '{"fg":"#9A3F1C","bg":"#FFF9F2","dotStyle":"dots","cornerStyle":"circle","logo":false,"frameLabel":"Drinks"}'::jsonb)
  returning id into v_qr_bar;

  -- Clearly-flagged sample analytics (is_demo = true), deterministic.
  perform setseed(0.42);
  for v_day in reverse 44..0 loop
    v_views := round((14 + random() * 10) * (1 + (45 - v_day) / 45.0)
      * (case when extract(dow from now() - make_interval(days => v_day)) in (0, 5, 6) then 1.6 else 1 end));
    for v_n in 1..v_views loop
      v_at := date_trunc('day', now() - make_interval(days => v_day))
        + make_interval(hours => 11 + floor(random() * 11)::int, mins => floor(random() * 60)::int);
      continue when v_at > now();
      v_from_qr := random() < 0.62;
      v_is_drinks := random() < 0.3;
      v_menu := case when v_is_drinks then v_drinks else v_dinner end;
      v_device := v_devices[1 + floor(random() * 6)::int];

      if v_from_qr then
        insert into public.analytics_events (restaurant_id, type, menu_id, qr_code_id, device, is_demo, occurred_at)
        values (v_restaurant, 'qr_scan', v_menu, case when v_is_drinks then v_qr_bar else v_qr_table end, v_device, true, v_at);
      end if;
      insert into public.analytics_events (restaurant_id, type, menu_id, qr_code_id, device, referrer_host, is_demo, occurred_at)
      values (
        v_restaurant, 'menu_view', v_menu,
        case when v_from_qr then (case when v_is_drinks then v_qr_bar else v_qr_table end) end,
        v_device,
        case when v_from_qr then null when random() < 0.5 then 'instagram.com' else 'google.com' end,
        true, v_at
      );

      if random() < 0.6 then
        -- Skew item popularity toward the first items so rankings are meaningful.
        select i.id into v_item
        from public.menu_items i
        where i.menu_id = v_menu
          and i.archived = false
        order by random() * (1 + i.position)
        limit 1;
        insert into public.analytics_events (restaurant_id, type, menu_id, item_id, device, is_demo, occurred_at)
        values (v_restaurant, 'item_view', v_menu, v_item, v_device, true, v_at);
      end if;
    end loop;
  end loop;

  insert into public.activity_log (restaurant_id, user_id, kind, message, created_at) values
    (v_restaurant, v_user, 'restaurant_created', 'Created Saffron & Sage', now() - interval '40 days'),
    (v_restaurant, v_user, 'menu_published', 'Published “Dinner”', now() - interval '30 hours'),
    (v_restaurant, v_user, 'qr_created', 'Created QR code “Bar — drinks list”', now() - interval '20 hours'),
    (v_restaurant, v_user, 'menu_published', 'Published “Drinks”', now() - interval '6 hours'),
    (v_restaurant, v_user, 'menu_created', 'Started a draft: “Weekend Brunch”', now() - interval '2 hours');

  raise notice 'MenuMint seed: created Saffron & Sage (%) for demo@menumint.app', v_restaurant;
end;
$$;
