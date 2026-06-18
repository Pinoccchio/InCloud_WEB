create or replace function public.trigger_expiration_alert()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  days_until_expiry integer;
begin
  if (tg_op = 'INSERT') or
     (tg_op = 'UPDATE' and new.expiration_date != old.expiration_date) then

    if new.expiration_date <= (current_date + interval '7 days') then
      if not exists (
        select 1 from notifications
        where related_entity_id = new.id
        and related_entity_type = 'batch'
        and type in ('expiration', 'alert')
        and is_resolved = false
      ) then
        days_until_expiry := extract(day from (new.expiration_date::timestamp - current_date::timestamp))::integer;

        insert into notifications (
          id,
          type,
          severity,
          title,
          message,
          branch_id,
          related_entity_type,
          related_entity_id,
          metadata,
          is_read,
          is_acknowledged,
          admin_is_read,
          is_resolved,
          created_at,
          updated_at
        )
        select
          gen_random_uuid(),
          'expiration'::notification_type,
          case
            when days_until_expiry < 0 then 'critical'::notification_severity
            when days_until_expiry <= 3 then 'high'::notification_severity
            else 'medium'::notification_severity
          end,
          case
            when days_until_expiry < 0 then 'Product Expired'
            else 'Product Expiring Soon'
          end,
          case
            when days_until_expiry < 0 then 'Batch ' || new.batch_number || ' of ' || p.name || ' expired ' || abs(days_until_expiry) || ' day(s) ago (' || new.quantity || ' units)'
            else 'Batch ' || new.batch_number || ' of ' || p.name || ' expires in ' || days_until_expiry || ' day(s) (' || new.quantity || ' units)'
          end,
          i.branch_id,
          'batch',
          new.id,
          jsonb_build_object(
            'batch_number', new.batch_number,
            'expiration_date', new.expiration_date,
            'days_until_expiry', days_until_expiry,
            'quantity', new.quantity,
            'product_name', p.name,
            'product_id', p.id,
            'triggered_by', 'batch_trigger',
            'auto_generated', true
          ),
          false,
          false,
          false,
          false,
          now(),
          now()
        from inventory i
        join products p on p.id = i.product_id
        where i.id = new.inventory_id;
      end if;
    end if;
  end if;

  return new;
end;
$function$;
