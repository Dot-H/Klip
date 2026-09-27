-- Delete duplicate/corrupted routes left over from an earlier bad import.
-- Verified none of them have any reports attached.
DELETE FROM "routes" WHERE "id" IN (
  'c411b9ea-9ca3-4e4c-aef1-507cb859fe26',
  '55e5b9ae-6a80-416d-980f-632049b71047',
  'cbc97637-4377-4c40-b8f2-12c41f7a387b',
  'e43fc51a-6833-46fd-b6aa-92c1306c33f7',
  '1f22b9a0-a630-4da7-b372-93e3a764bfa3',
  '94cd3591-fc3c-4804-ac2f-6ef47aaa58b6'
);

-- Drop the "Val d'Ablon" crag entirely: its sectors/routes were very corrupted
-- (e.g. sector name "."). Verified it has no reports attached. Re-running the
-- Excel import afterwards recreates it cleanly from the "Ablon" sheet.
DELETE FROM "crags" WHERE "name" = 'Val d''Ablon';
