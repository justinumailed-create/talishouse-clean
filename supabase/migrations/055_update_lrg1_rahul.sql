-- Update lrg1 production template to match approved MapSite layout
UPDATE mapsites
SET
  agent_name = 'Rahul Chakraborty',
  owner_first_name = 'Rahul',
  owner_last_name = 'Chakraborty',
  profile_image_url = '/images/mapsites/lrg1-rahul.jpeg',
  property_title = 'Lot 8, South Head Road, Homeville, NS',
  property_address = 'Lot 8, South Head Rd., Homeville, Nova Scotia, Canada',
  property_description = 'This eBook is a great way to learn more about this property and the next steps to take if you are interested.',
  price = '$129,000',
  email = 'rahulc@talispros.com',
  phone = '(888)-858-1273',
  atlist_map_url = 'https://my.atlist.com/map/300bf957-4e2b-4834-a7ba-bc135ff8a9f3?share=true',
  logo_url = '/images/mapsites/header-fallback-logo.jpeg',
  header_image_url = COALESCE(
    header_image_url,
    gallery_images[1],
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
  ),
  meta_title = 'Lot 8, South Head Road, Homeville, NS | MapSite™',
  meta_description = 'Lot 8, South Head Road, Homeville, NS — offered by Rahul Chakraborty.',
  status = 'active'
WHERE lower(fast_code) = 'lrg1';

UPDATE pins
SET
  name = 'LRG1-TTV',
  description = 'This eBook is a great way to learn more about this property and the next steps to take if you are interested.',
  address = 'Lot 8, South Head Rd.',
  city = 'Homeville',
  province = 'NS',
  country = 'Canada',
  email = 'rahulc@talispros.com',
  phone = '(888)-858-1273'
WHERE mapsite_id IN (SELECT id FROM mapsites WHERE lower(fast_code) = 'lrg1');
