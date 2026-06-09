update public.customers
set customer_type = case
  when customer_type is null then 'retail'
  when lower(trim(customer_type)) = 'regular' then 'retail'
  when lower(trim(customer_type)) = 'retail' then 'retail'
  when lower(trim(customer_type)) = 'wholesale' then 'wholesale'
  when lower(trim(customer_type)) in ('bulk', 'bulk pricing', 'bulk_pricing') then 'bulk'
  else 'retail'
end;

alter table public.customers
alter column customer_type set default 'retail';

alter table public.customers
alter column customer_type set not null;

alter table public.customers
drop constraint if exists customers_customer_type_check;

alter table public.customers
add constraint customers_customer_type_check
check (customer_type in ('retail', 'wholesale', 'bulk'));
