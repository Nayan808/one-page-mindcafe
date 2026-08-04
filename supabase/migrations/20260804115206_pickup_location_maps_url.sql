-- Verified, exact Google Maps links per pickup location (client-supplied
-- MindCafe_Verified_Google_Maps_Links.docx, most using a Google Place ID
-- rather than a text search) — more precise than generating a text-search
-- URL from the address string. Nullable: a location without a verified
-- link falls back to the existing address-based search URL client-side.
alter table public.pickup_locations
  add column if not exists maps_url text;
