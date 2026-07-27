-- Pickup location address corrections, sourced from the client's updated
-- address sheet (screenshots shared 2026-07-27). Run the SELECT first to
-- confirm each UPDATE will match exactly one existing row before running
-- the UPDATE block. Wrapped in a transaction so you can inspect row counts
-- and roll back if anything looks off before committing.

-- 1) Sanity check: confirm these names exist exactly once each in the
--    live table before updating. If any row is missing or the name is
--    spelled differently in your data, fix the name in this script to
--    match before running the UPDATEs below.
select name, address, city
from pickup_locations
where name in (
  'Zostel Mcleodganj',
  'Zostel Varkala',
  'Zo House Bangalore',
  'Zostel Mumbai',
  'Zostel Gokarna',
  'Zostel Plus Poombarai',
  'Zostel Goa (Morjim)',
  'Zostel Plus Bir',
  'Zostel Bhagsu'
)
or name ilike 'Zostel HQ%';

begin;

-- Address-only corrections (name/city unchanged)

update pickup_locations
set address = 'Hotel Imperial 9, Magic Forest Area, Club House Road, McLeod Ganj, Dharamshala, Himachal Pradesh 176215'
where name = 'Zostel Mcleodganj';

update pickup_locations
set address = 'Cliff Beach Hospitality, Sea Breeze Building, North Cliff, Zostel Varkala Rd, Varkala, Kerala 695141'
where name = 'Zostel Varkala';

update pickup_locations
set address = 'S-1, P-2, Anaa Infra''s Signature Towers, Nirguna Mandir Layout, Cauvery Colony, 1st Block Koramangala, Bengaluru, Karnataka 560095'
where name = 'Zo House Bangalore';

update pickup_locations
set address = 'Karotra Niwas School, off Military Road, near Prime Academy, Bhavani Nagar, Marol, Andheri East, Mumbai, Maharashtra 400059'
where name = 'Zostel Mumbai';

update pickup_locations
set address = 'Kudle Beach Rd, Dandebagh, Gokarna, Karnataka 581326'
where name = 'Zostel Gokarna';

update pickup_locations
set address = '146/1A, Poombarai, Kodaikanal, Tamil Nadu 624103'
where name = 'Zostel Plus Poombarai';

update pickup_locations
set address = 'H.No. 1088/1, Pushkin House, Madhlavado, Morjim, Goa 403512'
where name = 'Zostel Goa (Morjim)';

-- NOTE: source address for Bir reads "2.0 216, Tehsil Baijnath, VPO Bir,
-- Bir Khas, Himachal Pradesh 176077" in the client's sheet — the "2.0"
-- house-number prefix looked unusual when transcribing from the
-- screenshot, worth a quick double-check against the original before
-- running this one.
update pickup_locations
set address = '2.0 216, Tehsil Baijnath, VPO Bir, Bir Khas, Himachal Pradesh 176077'
where name = 'Zostel Plus Bir';

-- Renamed from "Zostel Bhagsu" to "Zostel Dharamkot" per client instruction
-- (the address itself is in the Dharamkot area) — name, address, and city
-- all change, same treatment as the HQ rename below.
update pickup_locations
set
  name = 'Zostel Dharamkot',
  address = 'Upper Bhagsu Nag, Dharamkot, Dharamshala, Himachal Pradesh 176216',
  city = 'Dharamkot'
where name = 'Zostel Bhagsu';

-- HQ: location moved from Delhi to Gurgaon — name, address, and city all
-- change. Matches any existing "Zostel HQ%" name (adjust the WHERE clause
-- above/below if your current row is named differently, e.g. "Zostel HQ
-- (Delhi)" vs just "Zostel HQ").
update pickup_locations
set
  name = 'Zostel HQ (Gurgaon)',
  address = '5th Floor, The Circle, Millennium City Centre, Sector 29, Gurugram, Haryana 122009',
  city = 'Gurugram'
where name ilike 'Zostel HQ%';

-- Review the output of each UPDATE above (row count affected) before
-- committing. If anything shows 0 rows or more than 1 row updated,
-- ROLLBACK and fix the WHERE clause first.
commit;
