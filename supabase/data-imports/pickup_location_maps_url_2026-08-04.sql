-- Verified Google Maps links, sourced from the client's
-- MindCafe_Verified_Google_Maps_Links.docx. Matched by each row's actual
-- current name in this table (several differ slightly from the doc's
-- naming — same reconciliation as the earlier address-correction script).
-- No verified link was supplied for Zostel Dharamkot, Zostel HQ
-- (Gurgaon), Zostel Jaipur, or Zostel Manali — those stay null and fall
-- back to the address-based search URL client-side.

begin;

update pickup_locations
set maps_url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJmycBhhDI5zsRkg0djY0KUJM'
where name = 'Zostel  Mumbai';

update pickup_locations
set maps_url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJU5_XISuCvjsRhsaE0v4-FmE'
where name = 'Zostel Gokarna';

update pickup_locations
set maps_url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJeeo1lbrpvzsRkM5bByuoKcU'
where name = 'Zostel Goa';

update pickup_locations
set maps_url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJO0uvF0K5BDkRBIHLkyHRhkU'
where name = 'Zostel Bir';

update pickup_locations
set maps_url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJsURxuYJRGzkRlNsTGrJx9n8'
where name = 'Zostel McLeodganj';

update pickup_locations
set maps_url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJJ_DaPrLvBTsReRb0TtkE5tk'
where name = 'Zostel Varkala';

update pickup_locations
set maps_url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ8eCwm1tlBzsRlpNIlIYWDsk'
where name = 'Zostel Poombarai';

-- "Zo House Bangalore" in the doc -- per the earlier user decision on the
-- address-fix task, this is the same physical location as the existing
-- "Zostel Bengaluru" row (address-only update, no rename). Not a
-- place_id-verified link like the others (the doc only gave a text
-- search query for this one), but it's still what was supplied.
update pickup_locations
set maps_url = 'https://www.google.com/maps/search/?api=1&query=Zo+House+Bangalore+Koramangala'
where name = 'Zostel Bengaluru';

commit;
