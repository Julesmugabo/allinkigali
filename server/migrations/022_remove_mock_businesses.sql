-- 022_remove_mock_businesses.sql
-- Removes the mock/seed businesses (gas, gym, kids, transport) that were
-- seeded in 005 as placeholder data. The Service Market will now show only
-- real registered sellers.

delete from businesses where name in (
  'SP Gaz', 'Safi Gaz', 'Lake Gaz',
  'Fitnesspoint', 'CorePower Gym',
  'FunLand Kids Park', 'Kigali Kids Club',
  'SwiftRide Kigali', 'MotoGo'
) and owner_id is null;
