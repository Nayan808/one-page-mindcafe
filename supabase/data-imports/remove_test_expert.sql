-- Removes leftover test/placeholder expert rows that were live on the
-- public /experts directory with is_bookable = true.
delete from public.experts where name = 'Test Expert' and id = '4ae7ae77-6a6f-4ccd-aa6b-37e55aa0ba54';
delete from public.experts where name = 'subhash' and id = '7e773fa6-8adc-4530-8c9a-7ae3bbe8468d';
