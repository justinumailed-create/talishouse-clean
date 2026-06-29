-- lrg1 production gallery images from talispros.com MapSite assets
UPDATE mapsites
SET gallery_images = ARRAY[
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-394.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-408.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-396.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-401.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-404.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-403.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-407.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-406.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-405.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-415.jpg',
  'https://talispros.com/ma/lrg1-ttv/files/imgThumb-414.jpg'
]
WHERE lower(fast_code) = 'lrg1';
