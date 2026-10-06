-- One-time backfill for the Transaction Log's Zostel gap (see the
-- /admin/inventory "gap vs log" investigation, 2026-09-19): those
-- locations had zero logged transactions ever, so "all" scope showed a
-- gap of (current Zostel remaining stock + already-sold Zostel units) per
-- product. Quantities below are exactly that sum, computed from live data
-- at the time. Logs each as a "received" transaction, split evenly across
-- every currently active Zostel location (remainder going to the first
-- few) — the same thing checking every location box in the Add
-- Transaction form and submitting once would produce, just without doing
-- it by hand per product. Purely additive (INSERT only); safe to reverse
-- with a plain DELETE on these rows' distinctive notes text if the
-- quantities ever need correcting.
do $$
declare
  backfill record;
  active_location_ids uuid[];
  loc_count int;
  base_qty int;
  remainder int;
  i int;
  qty int;
  v_id uuid;
begin
  select array_agg(id order by created_at) into active_location_ids
  from public.pickup_locations where is_active = true;
  loc_count := coalesce(array_length(active_location_ids, 1), 0);

  if loc_count = 0 then
    raise exception 'No active Zostel locations found — nothing to backfill against';
  end if;

  for backfill in
    select * from (values
      ('Extrovert', 901),
      ('Focus', 889),
      ('Joy', 897),
      ('Rest', 899)
    ) as t(product_name, total_qty)
  loop
    select pv.id into v_id
    from public.product_variants pv
    join public.products p on p.id = pv.product_id
    where p.name = backfill.product_name
    limit 1;

    if v_id is null then
      raise exception 'No product_variants row found for product %', backfill.product_name;
    end if;

    base_qty := backfill.total_qty / loc_count;
    remainder := backfill.total_qty % loc_count;

    for i in 1..loc_count loop
      qty := base_qty + case when i <= remainder then 1 else 0 end;
      if qty > 0 then
        insert into public.inventory_transactions
          (transaction_date, transaction_type, variant_id, location_id, quantity_in, notes)
        values
          (current_date, 'received', v_id, active_location_ids[i], qty,
           'Backfill 2026-09-19: reconciling untracked Zostel stock/sales (admin/inventory gap investigation)');
      end if;
    end loop;
  end loop;
end $$;
