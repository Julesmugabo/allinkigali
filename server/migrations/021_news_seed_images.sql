-- 021_news_seed_images.sql
-- Adds Unsplash cover photos to the seeded news articles so they display
-- images immediately instead of the icon placeholder.

update news_articles set image_url = 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=900&q=80'
  where title ilike '%G7%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=900&q=80'
  where title ilike '%IMF%Afurika%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80'
  where title ilike '%Ikizamini%Gishya%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=900&q=80'
  where title ilike '%Real Madrid%Champions%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1526470498-9ae73c665de8?w=900&q=80'
  where title ilike '%Amerika%Ubushinwa%Bisubiranya%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&q=80'
  where title ilike '%Ubushinwa%Inzira Nshya%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80'
  where title ilike '%AU%Amashanyarazi%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80'
  where title ilike '%3 — 1%Bayern%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=900&q=80'
  where title ilike '%Ubushakashatsi%Ikirere%10,000%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1543674892-7d64d45df18b?w=900&q=80'
  where title ilike '%Peteroli%Ubukungu bw''Uburayi%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=80'
  where title ilike '%Itegeko%Uburezi%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=900&q=80'
  where title ilike '%Kigali%Tekinoloji%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80'
  where title ilike '%Banki Nkuru%Inyungu%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1602615576820-ea14cf3e476d?w=900&q=80'
  where title ilike '%Umuriro%Mashyamba%' and image_url is null;

update news_articles set image_url = 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&q=80'
  where title ilike '%Icyogajuru%Ibihe%' and image_url is null;
