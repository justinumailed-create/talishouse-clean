UPDATE mapsites
SET
  phone = '(888)-858-1273',
  email = 'rahulc@talispros.com'
WHERE lower(fast_code) = 'lrg1';

UPDATE pins
SET
  phone = '(888)-858-1273',
  email = 'rahulc@talispros.com'
WHERE mapsite_id IN (SELECT id FROM mapsites WHERE lower(fast_code) = 'lrg1');
