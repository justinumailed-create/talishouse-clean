-- Link lrg1 MapSite to a root account so it follows the same ownership model as registered MapSites
DO $$
DECLARE
  acct_id UUID;
  ms_id UUID;
BEGIN
  SELECT id INTO ms_id FROM mapsites WHERE lower(fast_code) = 'lrg1';
  IF ms_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO acct_id FROM accounts WHERE lower(fast_code) = 'lrg1';

  IF acct_id IS NULL THEN
    INSERT INTO accounts (
      first_name,
      last_name,
      fast_code,
      email,
      account_type
    ) VALUES (
      'Rahul',
      'Chakraborty',
      'lrg1',
      'rahulc@talispros.com',
      'root'
    )
    RETURNING id INTO acct_id;
  END IF;

  UPDATE mapsites
  SET account_id = acct_id
  WHERE id = ms_id
    AND account_id IS NULL;
END $$;
