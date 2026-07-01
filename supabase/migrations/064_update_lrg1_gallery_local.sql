-- lrg1 gallery: local property photos (WhatsApp uploads)
UPDATE mapsites
SET gallery_images = ARRAY[
  '/images/mapsites/lrg1-gallery/01.png',
  '/images/mapsites/lrg1-gallery/02.png',
  '/images/mapsites/lrg1-gallery/03.png',
  '/images/mapsites/lrg1-gallery/04.png',
  '/images/mapsites/lrg1-gallery/05.png',
  '/images/mapsites/lrg1-gallery/06.png',
  '/images/mapsites/lrg1-gallery/07.png',
  '/images/mapsites/lrg1-gallery/08.png',
  '/images/mapsites/lrg1-gallery/09.png',
  '/images/mapsites/lrg1-gallery/10.png',
  '/images/mapsites/lrg1-gallery/11.png',
  '/images/mapsites/lrg1-gallery/12.png'
]
WHERE lower(fast_code) = 'lrg1';
