/**
 * productCatalogs.js — Fake product catalogs for the two retail-style
 * marketplaces. `layout` controls the browse screen style:
 *   'grid'  — B&H-style flat grid with search (Allingadget)
 *   'shelf' — Sephora-style category sections with horizontal card rows (Uruhu Rwiza)
 */
export const ALLINGADGET = {
  key: 'allingadget',
  name: 'Allingadget',
  tagline: 'Phones, cameras, computers and more',
  icon: 'laptop',
  layout: 'grid',
  categories: [
    { key: 'phones', label: 'Phones & Tablets', icon: 'cellphone' },
    { key: 'computers', label: 'Computers & Laptops', icon: 'laptop' },
    { key: 'cameras', label: 'Cameras', icon: 'camera-outline' },
    { key: 'tv-audio', label: 'TV & Audio', icon: 'television-classic' },
    { key: 'accessories', label: 'Accessories', icon: 'usb-flash-drive-outline' },
  ],
  products: [
    { id: 'ag-1', category: 'phones', brand: 'Samsung', name: 'Galaxy A55 5G, 128GB', price: 320000, description: '6.6" display, triple camera, all-day battery life.', icon: 'cellphone', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80' },
    { id: 'ag-2', category: 'phones', brand: 'Apple', name: 'iPhone 13, 128GB', price: 650000, description: 'A15 Bionic chip, dual-camera system, Ceramic Shield front.', icon: 'cellphone', badge: 'best_seller', image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400&q=80' },
    { id: 'ag-3', category: 'phones', brand: 'Tecno', name: 'Spark 20, 256GB', price: 150000, description: 'Large battery, fast charging, great value for everyday use.', icon: 'cellphone', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80' },
    { id: 'ag-4', category: 'computers', brand: 'HP', name: 'Pavilion 15, Core i5, 8GB RAM', price: 580000, description: '15.6" laptop for work and school, 512GB SSD.', icon: 'laptop', badge: 'best_seller', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80' },
    { id: 'ag-5', category: 'computers', brand: 'Dell', name: 'Inspiron 14, Core i3, 8GB RAM', price: 420000, description: 'Lightweight 14" laptop, 256GB SSD, good battery life.', icon: 'laptop', image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80' },
    { id: 'ag-6', category: 'computers', brand: 'Apple', name: 'MacBook Air M1, 8GB RAM', price: 950000, description: '13.3" Retina display, all-day battery, fanless design.', icon: 'laptop', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80' },
    { id: 'ag-7', category: 'cameras', brand: 'Canon', name: 'EOS 2000D DSLR + 18-55mm lens', price: 480000, description: '24.1MP, great starter camera for photography and video.', icon: 'camera-outline', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80' },
    { id: 'ag-8', category: 'cameras', brand: 'Nikon', name: 'D3500 DSLR + 18-55mm lens', price: 450000, description: 'Beginner-friendly DSLR with a Guide Mode for new photographers.', icon: 'camera-outline', image: 'https://images.unsplash.com/photo-1607462109225-6b64ae2dd3cb?w=400&q=80' },
    { id: 'ag-9', category: 'tv-audio', brand: 'LG', name: '43" Full HD Smart TV', price: 310000, description: 'Built-in WiFi, streaming apps, slim design.', icon: 'television-classic', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f4e85b?w=400&q=80' },
    { id: 'ag-10', category: 'tv-audio', brand: 'JBL', name: 'Flip 6 Bluetooth Speaker', price: 95000, description: 'Portable, waterproof, punchy bass for its size.', icon: 'speaker', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80' },
    { id: 'ag-11', category: 'accessories', brand: 'Anker', name: '20W USB-C Fast Charger', price: 18000, description: 'Compact charger, fast-charges most phones.', icon: 'power-plug-outline', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80' },
    { id: 'ag-12', category: 'accessories', brand: 'SanDisk', name: '128GB USB 3.0 Flash Drive', price: 22000, description: 'Fast transfer speeds, durable metal casing.', icon: 'usb-flash-drive-outline', image: 'https://images.unsplash.com/photo-1617997455403-41f333d44d5b?w=400&q=80' },
  ],
};

export const URUHU_RWIZA = {
  key: 'uruhu-rwiza',
  name: 'Uruhu Rwiza',
  tagline: 'Skincare, makeup and beauty essentials',
  icon: 'face-woman-outline',
  layout: 'shelf',
  categories: [
    { key: 'skincare', label: 'Skincare', icon: 'water-outline' },
    { key: 'makeup', label: 'Makeup', icon: 'lipstick' },
    { key: 'haircare', label: 'Haircare', icon: 'content-cut' },
    { key: 'fragrance', label: 'Fragrance', icon: 'spray-bottle' },
    { key: 'bath-body', label: 'Body Care', icon: 'shower' },
  ],
  products: [
    // Skincare
    { id: 'ur-1', category: 'skincare', brand: 'GlowLab', name: 'Vitamin C Glow Serum', price: 12500, description: 'Brightens skin and evens skin tone with stabilised Vitamin C.', icon: 'water-outline', badge: 'best_seller', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80' },
    { id: 'ur-2', category: 'skincare', brand: 'CeraVe', name: 'Hydrating Facial Cleanser, 236ml', price: 18000, description: 'Gentle, non-foaming cleanser for normal to dry skin.', icon: 'water-outline', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80' },
    { id: 'ur-3', category: 'skincare', brand: 'SunShield', name: 'SPF 50 Sunscreen', price: 10200, description: 'Broad-spectrum SPF 50, lightweight and non-greasy.', icon: 'water-outline', badge: 'new', image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=400&q=80' },
    { id: 'ur-4', category: 'skincare', brand: 'DermaLux', name: 'Retinol Night Cream', price: 18500, description: 'Reduces fine lines and improves texture while you sleep.', icon: 'water-outline', image: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&q=80' },
    { id: 'ur-5', category: 'skincare', brand: 'ClearSkin', name: 'Niacinamide Moisturiser', price: 9800, description: 'Minimises pores and balances oil production.', icon: 'water-outline', image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80' },
    { id: 'ur-6', category: 'skincare', brand: 'EarthGlow', name: 'Clay Purifying Mask', price: 7500, description: 'Deep-cleansing kaolin clay mask for congested skin.', icon: 'water-outline', image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80' },
    // Makeup
    { id: 'ur-7', category: 'makeup', brand: 'LuxeLip', name: 'Matte Lipstick — Ruby', price: 5500, description: 'Long-wearing matte finish in a bold red.', icon: 'lipstick', badge: 'hot', image: 'https://images.unsplash.com/photo-1586495777744-4e6232bf5f88?w=400&q=80' },
    { id: 'ur-8', category: 'makeup', brand: 'FlawlessBase', name: 'HD Foundation SPF15', price: 15000, description: 'Medium-to-full coverage, skin-like finish.', icon: 'lipstick', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80' },
    { id: 'ur-9', category: 'makeup', brand: 'LashQueen', name: 'Mascara Volume Boost', price: 7800, description: 'Plumping brush builds dramatic volume in one coat.', icon: 'lipstick', badge: 'best_seller', image: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=400&q=80' },
    { id: 'ur-10', category: 'makeup', brand: 'Filit', name: 'Setting Powder', price: 6200, description: 'Translucent powder sets makeup and controls shine all day.', icon: 'lipstick', image: 'https://images.unsplash.com/photo-1631214524020-3c69b4cd0a35?w=400&q=80' },
    { id: 'ur-11', category: 'makeup', brand: 'ColorPop', name: 'Eyeshadow Palette 12', price: 14500, description: '12 highly-pigmented shades from nude to smoky.', icon: 'lipstick', image: 'https://images.unsplash.com/photo-1583241800698-e8ab01830a66?w=400&q=80' },
    { id: 'ur-12', category: 'makeup', brand: 'LinePerfect', name: 'Liquid Eyeliner', price: 4800, description: 'Felt-tip precision liner, smudge-proof formula.', icon: 'lipstick', image: 'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=400&q=80' },
    // Fragrance
    { id: 'ur-13', category: 'fragrance', brand: 'Parfumerie', name: 'Floral Eau de Parfum', price: 28000, description: 'A fresh floral bouquet with notes of rose and jasmine.', icon: 'spray-bottle', badge: 'luxury', image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80' },
    { id: 'ur-14', category: 'fragrance', brand: 'AraboScent', name: 'Oud & Rose EDP', price: 35000, description: 'Rich oriental fragrance with oud wood and rose.', icon: 'spray-bottle', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80' },
    { id: 'ur-15', category: 'fragrance', brand: 'FreshAura', name: 'Citrus Body Mist', price: 8500, description: 'Light, refreshing citrus scent for everyday use.', icon: 'spray-bottle', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80' },
    // Haircare
    { id: 'ur-16', category: 'haircare', brand: 'Cantu', name: 'Shea Butter Leave-In Conditioner', price: 11000, description: 'For natural, curly and coily hair, deep moisture.', icon: 'content-cut', badge: 'best_seller', image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&q=80' },
    { id: 'ur-17', category: 'haircare', brand: 'Dove', name: 'Nourishing Oil Care Shampoo, 400ml', price: 6500, description: 'Repairs dry, damaged hair with a lightweight oil blend.', icon: 'content-cut', image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80' },
    { id: 'ur-18', category: 'haircare', brand: 'Garnier', name: 'Hair Food Honey Mask', price: 9200, description: 'Nourishing 3-in-1 mask for dry, unruly hair.', icon: 'content-cut', badge: 'new', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80' },
    // Body Care
    { id: 'ur-19', category: 'bath-body', brand: 'Dove', name: 'Deeply Nourishing Body Wash, 400ml', price: 7000, description: 'Creamy lather that leaves skin feeling soft.', icon: 'shower', image: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&q=80' },
    { id: 'ur-20', category: 'bath-body', brand: 'Vaseline', name: 'Cocoa Butter Body Lotion, 400ml', price: 5500, description: 'Deep moisture for dry skin, light cocoa scent.', icon: 'shower', image: 'https://images.unsplash.com/photo-1556228841-a3c527ebefe5?w=400&q=80' },
    { id: 'ur-21', category: 'bath-body', brand: 'Nivea', name: 'Soft Moisturising Cream, 200ml', price: 7500, description: 'Light, fast-absorbing cream for face, hands and body.', icon: 'shower', badge: 'best_seller', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80' },
  ],
};

export const BADGE_META = {
  best_seller: { label: 'BEST SELLER', backgroundColor: '#BA7517', color: '#fff' },
  new: { label: 'NEW', backgroundColor: '#378ADD', color: '#fff' },
  hot: { label: 'HOT', backgroundColor: '#D0342C', color: '#fff' },
  luxury: { label: 'LUXURY', backgroundColor: '#533AB7', color: '#fff' },
};

export const STORES = { allingadget: ALLINGADGET, 'uruhu-rwiza': URUHU_RWIZA };

export default { ALLINGADGET, URUHU_RWIZA, STORES, BADGE_META };
