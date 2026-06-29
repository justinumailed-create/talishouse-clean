UPDATE mapsites
SET
  agent_name = COALESCE(NULLIF(agent_name, ''), 'Rahul Chakraborty'),
  profile_image_url = COALESCE(
    NULLIF(profile_image_url, ''),
    '/images/mapsites/lrg1-rahul.jpeg'
  ),
  atlist_map_url = 'https://my.atlist.com/map/300bf957-4e2b-4834-a7ba-bc135ff8a9f3?share=true'
WHERE lower(fast_code) = 'lrg1';
