-- Migration 025: Seed 11 Kigali restaurants
-- Only inserts if table is empty so re-running is safe.

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM restaurants) > 0 THEN
    RAISE NOTICE 'restaurants already seeded, skipping';
    RETURN;
  END IF;

  INSERT INTO restaurants (id, name, description, location, district, phone, cuisines, foods, occasion, price, atmosphere, dietary, seating, features, rating, lat, lng, open_status)
  VALUES
    ('r1','Sakae Restaurant','Authentic Japanese and Korean dining with conveyor-belt sushi and private booths. Seats ~60 guests in a stylish setting.','KG 334 St, Kigali','Gasabo','+250 796 602 988',
     ARRAY['japanese','korean'],ARRAY['Sushi','Sashimi','Ramen','Bibimbap','Bulgogi','Pajeon','Yakitori','Korean BBQ','Teppanyaki'],
     ARRAY['date','friends','business'],3,ARRAY['elegant','modern','cozy'],ARRAY['vegetarian'],ARRAY['standard','bar','private'],ARRAY['wifi','aircon'],
     4.6,-1.941,30.092,'Open now'),

    ('r2','Japanda Restaurant','A local chef with Japanese mastery. Pork broth ramen simmered 12 hours, housemade tofu and yakitori. Small, soulful and delicious.','Kacyiru, Kigali','Gasabo','+250 786 257 259',
     ARRAY['japanese'],ARRAY['Ramen','Mazemen','Sushi','Teriyaki Chicken','Karaage Donburi','Yakitori','Homemade Tofu'],
     ARRAY['date','friends','business','special'],3,ARRAY['elegant','modern','quiet'],ARRAY['vegetarian','glutenfree'],ARRAY['standard','private','bar'],ARRAY['wifi','aircon','parking'],
     4.5,-1.935,30.089,'Open now'),

    ('r3','Tung Chinese Cuisine','Authentic Cantonese cuisine in a beautiful garden setting. Generous portions, dim sum and a favourite for family gatherings.','KG 13 Ave, Kigali','Gasabo','+250 738 858 888',
     ARRAY['chinese'],ARRAY['Dumplings','Fried Rice','Noodles','Dim Sum','Hot Pot','Spring Rolls'],
     ARRAY['family','friends','groups','business'],2,ARRAY['casual','lively','traditional'],ARRAY['vegetarian','vegan'],ARRAY['standard','private','group'],ARRAY['wifi','aircon','parking','familyfriendly'],
     4.3,-1.952,30.095,'Open now'),

    ('r4','Khana Khazana Kiyovu','Rich flavours from the Indian subcontinent. The butter chicken and biryani are legendary in Kigali.','9 KN 31 St, Kiyovu, Kigali','Nyarugenge','+250 788 499 600',
     ARRAY['indian'],ARRAY['Biryani','Chicken Tikka Masala','Butter Chicken','Korma','Vindaloo','Tandoori','Naan','Seafood Curry'],
     ARRAY['date','family','friends','business'],2,ARRAY['casual','cozy','traditional'],ARRAY['vegetarian','vegan','halal'],ARRAY['standard','outdoor'],ARRAY['wifi','aircon'],
     4.4,-1.957,30.058,'Open now'),

    ('r5','Khana Khazana Nyarutarama','The Nyarutarama branch of Kigali''s top Indian restaurant. Beautiful boutique hotel property with a spacious garden dining room.','KG 9 Ave & KG 13 Ave, Nyarutarama, Kigali','Gasabo','+250 781 849 797',
     ARRAY['indian'],ARRAY['Biryani','Chicken Tikka Masala','Butter Chicken','Korma','Tandoori','Naan','Masala Dosa','Prawn Curry'],
     ARRAY['date','family','friends','business'],2,ARRAY['casual','cozy','modern'],ARRAY['vegetarian','vegan','halal'],ARRAY['standard','outdoor','private'],ARRAY['wifi','aircon','parking'],
     4.5,-1.939,30.104,'Open now'),

    ('r6','Habesha Ethiopian Restaurant','Communal Ethiopian dining on injera. Pine wood terrace, Ethiopian artwork and the famous Tibs stew. Vegetarian section available.','10 KG 617 St, Kigali','Gasabo','+250 782 638 043',
     ARRAY['ethiopian'],ARRAY['Injera','Tibs','Doro Wat','Kitfo','Shiro','Sambusa','Vegetarian Platter','Ethiopian Coffee'],
     ARRAY['date','friends','groups','special'],2,ARRAY['casual','cozy','traditional','rustic'],ARRAY['vegetarian','vegan','halal'],ARRAY['standard','outdoor'],ARRAY['wifi'],
     4.4,-1.944,30.087,'Open now'),

    ('r7','Pasta & Basta','Casual Italian trattoria inside Wines & More, Kacyiru. Homemade pasta, excellent service and great value in a pleasant setting.','Kigali, Rwanda','Gasabo','+250 795 298 624',
     ARRAY['italian'],ARRAY['Pasta','Risotto','Lasagna','Bruschetta','Gnocchi','Tiramisu','Calzone'],
     ARRAY['date','friends','family','birthday','anniversary'],2,ARRAY['casual','cozy','relaxed','charming'],ARRAY['vegetarian'],ARRAY['standard','outdoor'],ARRAY['wifi'],
     4.3,-1.948,30.080,'Open now'),

    ('r8','Poivre Noir','Belgian-French fine dining by Chef-Patron John Goffin. Outdoor terrace with panoramic city views, creative seasonal menus, and Kigali''s most celebrated dining experience since 2015.','KG 637 Street No. 5, Kimihurura, Kigali','Gasabo','+250 787 686 753',
     ARRAY['french'],ARRAY['Pork Filet Mignon','Duck Breast','Pulled Rabbit Ravioli','Rwandan Beef Burger','Jerk Chicken','Stuffed Chicken','Fresh Seafood'],
     ARRAY['date','anniversary','business','special'],4,ARRAY['elegant','fine','romantic','upscale'],ARRAY['vegetarian','glutenfree'],ARRAY['standard','private','outdoor'],ARRAY['wifi','aircon','parking','livemusic','scenicview'],
     4.8,-1.932,30.091,'Open now'),

    ('r9','Sole Luna','A slice of Italy in Kigali. Secret garden with flowering vine canopy, 100+ pizza varieties, outdoor seating and quiz nights on Mondays.','KG 599 Street, Kigali','Gasabo','+250 788 859 593',
     ARRAY['italian'],ARRAY['Margherita Pizza','Specialty Pizzas','Calzone','Spaghetti Bolognaise','Beef Lasagne','Steak','Tiramisu','Nutella Dessert'],
     ARRAY['date','friends','family','birthday'],3,ARRAY['casual','elegant','romantic','charming'],ARRAY['vegetarian'],ARRAY['standard','outdoor','private'],ARRAY['wifi','aircon','parking'],
     4.5,-1.937,30.086,'Open now'),

    ('r10','Kurry Kingdom','Makuti-thatched roof, vaulted ceilings and the best biryani in Kigali. Rated 4.6/5 on TripAdvisor — a North Indian gem.','House No. 24, KG 5 Ave, Kigali','Gasabo','+250 787 605 789',
     ARRAY['indian'],ARRAY['Chicken Biryani','Chicken Tikka Masala','Butter Chicken','Butter Naan','North Indian Curry','Tandoori Specialties'],
     ARRAY['date','friends','family','groups'],2,ARRAY['casual','cozy','traditional'],ARRAY['vegetarian','vegan','halal'],ARRAY['standard','private','outdoor'],ARRAY['wifi','aircon','parking'],
     4.6,-1.950,30.098,'Open now'),

    ('r11','14th Avenue Wine Bar','Dimly lit and intimate wine bar inside the Soy Asian Restaurant space. Premium steaks, fresh seafood and an extensive wine list.','39 KN 14 Ave, Kigali','Nyarugenge','+250 788 333 130',
     ARRAY['mediterranean','international'],ARRAY['Premium Steak','Fresh Seafood','Mediterranean Mains','Decadent Desserts','Wine Pairings'],
     ARRAY['date','anniversary','business','friends','special'],3,ARRAY['elegant','relaxed','romantic','upscale'],ARRAY['vegetarian','glutenfree'],ARRAY['standard','bar','outdoor','private'],ARRAY['wifi','aircon','parking','livemusic'],
     4.7,-1.962,30.061,'Open now');

  -- Photos for each restaurant
  INSERT INTO restaurant_photos (restaurant_id, url, label, sort_order) VALUES
    ('r1','https://videos-b.atmosfy.io/9d8d4abd-642e-47af-8578-4ad063950757/thumbnail.jpg','Sakae exterior',0),
    ('r1','https://itin-dev.wanderlogstatic.com/freeImage/5XxhttaEnt0RudUEyDN7iPH4X0wN1nc4','Interior',1),
    ('r1','https://itin-dev.wanderlogstatic.com/freeImage/DuRSUBgUavtwtVi3sorp5xN4fiHRHCKU','Sushi conveyor',2),
    ('r1','https://itin-dev.wanderlogstatic.com/freeImage/veX9xfbLJPqFAsk0BwAlrvtyy4oBdn7g','Dining area',3),

    ('r2','https://www.ktpress.rw/wp-content/uploads/2022/08/D8.jpg','Interior',0),
    ('r2','https://www.ktpress.rw/wp-content/uploads/2022/08/DD5-1.jpg','Ramen bowl',1),
    ('r2','https://www.ktpress.rw/wp-content/uploads/2022/08/D14.jpg','Yakitori',2),
    ('r2','https://www.ktpress.rw/wp-content/uploads/2022/08/D12.jpg','Sushi',3),
    ('r2','https://www.ktpress.rw/wp-content/uploads/2022/08/D6.jpg','Dining space',4),
    ('r2','https://www.ktpress.rw/wp-content/uploads/2022/08/DD3.jpg','Japanese dishes',5),

    ('r3','https://itin-dev.wanderlogstatic.com/freeImage/nCyVvYZbzJuGHcCdO8oEICQYYfjdyVzE','Restaurant',0),
    ('r3','https://itin-dev.wanderlogstatic.com/freeImage/SPrufqLr1oXyPw3OESSMRnXeip8e69NX','Interior',1),
    ('r3','https://itin-dev.wanderlogstatic.com/freeImage/lYkXAK52Du6LcbxSLklnKY3fsRrWObWh','Dining area',2),
    ('r3','https://cdn.top-rated.online/places/ChIJS8Jd9eim3BkRpt1ECVVegJE/3fb6428fce94f8e4980b32c2183b561875d57976f7f94de1c4d7c5481159e5c1.webp','Garden view',3),

    ('r4','https://livinginkigali.com/wp-content/uploads/2020/05/khana-khazana-kigali-6.jpg','Restaurant',0),
    ('r4','https://itin-dev.wanderlogstatic.com/freeImage/CxAmlmSeUhdETQD91wlAxsoO6ZBh8VfH','Interior',1),
    ('r4','https://itin-dev.wanderlogstatic.com/freeImage/gJ7EHLaCrF8A6pxhgs3UAccKEC92WfHo','Dining area',2),
    ('r4','https://itin-dev.wanderlogstatic.com/freeImage/S7AetVWbDyfLLNMKyenFwsYtvkc9yVMT','Food',3),

    ('r5','https://www.kayak.com/rimg/himg/7b/40/38/agoda-3853155-94565738-301717.jpg','Property',0),
    ('r5','https://www.kayak.com/rimg/himg/39/22/ff/agoda-3853155-94565755-555219.jpg','Garden',1),
    ('r5','https://www.kayak.com/rimg/himg/94/66/2e/ostrovok-3853155-974b10-138491.jpg','Dining area',2),
    ('r5','https://www.kayak.com/rimg/himg/82/3c/0c/ostrovok-3853155-e66ad5-158461.jpg','Interior',3),
    ('r5','https://www.kayak.com/rimg/himg/20/42/f3/ostrovok-3853155-c93a4e-665532.jpg','Exterior',4),

    ('r6','https://itin-dev.wanderlogstatic.com/freeImage/vjgqS69GmvsUzNzuB544K7ewIl30eE10','Restaurant',0),
    ('r6','https://livinginkigali.com/wp-content/uploads/2017/10/habesha-kigali-03.jpg','Interior',1),

    ('r7','https://jdnyolfagefxsphynzem.supabase.co/storage/v1/object/public/eatery-images/eateries/e641fd82-3a08-4359-87fa-9febb880549a/main.jpg','Restaurant',0),
    ('r7','https://jdnyolfagefxsphynzem.supabase.co/storage/v1/object/public/eatery-images/eateries/e641fd82-3a08-4359-87fa-9febb880549a/gallery-1.jpg','Interior',1),
    ('r7','https://jdnyolfagefxsphynzem.supabase.co/storage/v1/object/public/eatery-images/eateries/e641fd82-3a08-4359-87fa-9febb880549a/gallery-2.jpg','Dining area',2),
    ('r7','https://jdnyolfagefxsphynzem.supabase.co/storage/v1/object/public/eatery-images/eateries/e641fd82-3a08-4359-87fa-9febb880549a/gallery-3.jpg','Pasta',3),
    ('r7','https://jdnyolfagefxsphynzem.supabase.co/storage/v1/object/public/eatery-images/eateries/e641fd82-3a08-4359-87fa-9febb880549a/gallery-4.jpg','Food',4),
    ('r7','https://itin-dev.wanderlogstatic.com/freeImage/zwpmCaJ9ltcy4qcuq96TiqomJiJz6mum','Ambiance',5),

    ('r8','https://www.foodandhome.co.za/wp-content/uploads/2019/05/4-1.jpg','Signature dish',0),
    ('r8','https://www.foodandhome.co.za/wp-content/uploads/2019/05/5-1.jpg','Chef''s creation',1),
    ('r8','https://www.foodandhome.co.za/wp-content/uploads/2019/05/3-1024x695.jpg','Restaurant interior',2),
    ('r8','https://cdnx.premiumread.com/?url=https://www.newtimes.co.rw/uploads/imported_images/files/main/articles/2017/03/02/14884859229171StuffedChicken800.jpg','Stuffed chicken',3),

    ('r9','https://itin-dev.wanderlogstatic.com/freeImage/r8rqL6Ir6uH2dVGz6vMjSfDMurlzF50I','Garden',0),
    ('r9','https://itin-dev.wanderlogstatic.com/freeImage/9isumxVY8uLe7ibEmZN8inq7CqXacl0w','Pizza',1),
    ('r9','https://itin-dev.wanderlogstatic.com/freeImage/CpOGzbp4rFxZTCLmC7Tfev2uNSOeUtoN','Dining area',2),
    ('r9','https://media.evendo.com/locations-resized/RestaurantImages/1440x800/126f5672-dd2e-49f9-9c7b-4148c361abbf','Terrace',3),

    ('r10','https://livinginkigali.com/wp-content/uploads/2026/02/SaveClip.App_298042868_395140652687213_1807220266936407220_n.jpg','Kurry Kingdom',0),
    ('r10','https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80','Curry spread',1),
    ('r10','https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&q=80','Biryani',2),

    ('r11','https://livinginkigali.com/wp-content/uploads/2026/02/SaveClip.App_504381479_17975162333853664_7244108326004518792_n.jpg','14th Avenue interior',0),
    ('r11','https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80','Wine bar',1),
    ('r11','https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80','Grilled seafood',2);

END $$;
