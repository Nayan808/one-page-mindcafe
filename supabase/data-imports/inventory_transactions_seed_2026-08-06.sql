-- Real transaction history from the client's "FEELZ by Mindcafe |
-- Transaction Log" spreadsheet (2026-07-25 batch): manufacturer receipt
-- from Peptas, shipment to Zostel, and online sales as recorded there.
insert into inventory_transactions (transaction_date, transaction_type, variant_id, quantity_in, quantity_out, notes)
select '2026-07-25', 'received', pv.id, q, null, 'Order received from Peptas'
from product_variants pv
join products p on p.id = pv.product_id
join (values ('Focus', 3300), ('Joy', 3360), ('Extrovert', 3330), ('Rest', 3060)) as v(name, q) on v.name = p.name;

insert into inventory_transactions (transaction_date, transaction_type, variant_id, quantity_in, quantity_out, notes)
select '2026-07-25', 'shipped', pv.id, null, 2500, 'Packs shipped to Zostel'
from product_variants pv
join products p on p.id = pv.product_id
where p.name in ('Focus', 'Joy', 'Extrovert', 'Rest');

insert into inventory_transactions (transaction_date, transaction_type, variant_id, quantity_in, quantity_out, notes)
select '2026-07-25', 'online_sale', pv.id, null, q, 'Website online sales — per Order details'
from product_variants pv
join products p on p.id = pv.product_id
join (values ('Focus', 800), ('Joy', 860), ('Extrovert', 830), ('Rest', 560)) as v(name, q) on v.name = p.name;
