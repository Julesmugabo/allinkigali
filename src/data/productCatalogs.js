/**
 * productCatalogs.js — Fake product catalogs for the two retail-style
 * marketplaces. Same shape for both ({ key, name, tagline, categories,
 * products }) so one screen pair (ProductMarketScreen/ProductDetailScreen)
 * can serve either store, picked by a route param.
 */
export const ALLINGADGET = {
  key: 'allingadget',
  name: 'Allingadget',
  tagline: 'Phones, cameras, computers and more',
  icon: 'laptop',
  categories: [
    { key: 'phones', label: 'Phones & Tablets', icon: 'cellphone' },
    { key: 'computers', label: 'Computers & Laptops', icon: 'laptop' },
    { key: 'cameras', label: 'Cameras', icon: 'camera-outline' },
    { key: 'tv-audio', label: 'TV & Audio', icon: 'television-classic' },
    { key: 'accessories', label: 'Accessories', icon: 'usb-flash-drive-outline' },
  ],
  products: [
    { id: 'ag-1', category: 'phones', brand: 'Samsung', name: 'Galaxy A55 5G, 128GB', price: 320000, description: '6.6" display, triple camera, all-day battery life.', icon: 'cellphone' },
    { id: 'ag-2', category: 'phones', brand: 'Apple', name: 'iPhone 13, 128GB', price: 650000, description: 'A15 Bionic chip, dual-camera system, Ceramic Shield front.', icon: 'cellphone' },
    { id: 'ag-3', category: 'phones', brand: 'Tecno', name: 'Spark 20, 256GB', price: 150000, description: 'Large battery, fast charging, great value for everyday use.', icon: 'cellphone' },
    { id: 'ag-4', category: 'computers', brand: 'HP', name: 'Pavilion 15, Core i5, 8GB RAM', price: 580000, description: '15.6" laptop for work and school, 512GB SSD.', icon: 'laptop' },
    { id: 'ag-5', category: 'computers', brand: 'Dell', name: 'Inspiron 14, Core i3, 8GB RAM', price: 420000, description: 'Lightweight 14" laptop, 256GB SSD, good battery life.', icon: 'laptop' },
    { id: 'ag-6', category: 'computers', brand: 'Apple', name: 'MacBook Air M1, 8GB RAM', price: 950000, description: '13.3" Retina display, all-day battery, fanless design.', icon: 'laptop' },
    { id: 'ag-7', category: 'cameras', brand: 'Canon', name: 'EOS 2000D DSLR + 18-55mm lens', price: 480000, description: '24.1MP, great starter camera for photography and video.', icon: 'camera-outline' },
    { id: 'ag-8', category: 'cameras', brand: 'Nikon', name: 'D3500 DSLR + 18-55mm lens', price: 450000, description: 'Beginner-friendly DSLR with a Guide Mode for new photographers.', icon: 'camera-outline' },
    { id: 'ag-9', category: 'tv-audio', brand: 'LG', name: '43" Full HD Smart TV', price: 310000, description: 'Built-in WiFi, streaming apps, slim design.', icon: 'television-classic' },
    { id: 'ag-10', category: 'tv-audio', brand: 'JBL', name: 'Flip 6 Bluetooth Speaker', price: 95000, description: 'Portable, waterproof, punchy bass for its size.', icon: 'speaker' },
    { id: 'ag-11', category: 'accessories', brand: 'Anker', name: '20W USB-C Fast Charger', price: 18000, description: 'Compact charger, fast-charges most phones.', icon: 'power-plug-outline' },
    { id: 'ag-12', category: 'accessories', brand: 'SanDisk', name: '128GB USB 3.0 Flash Drive', price: 22000, description: 'Fast transfer speeds, durable metal casing.', icon: 'usb-flash-drive-outline' },
  ],
};

export const URUHU_RWIZA = {
  key: 'uruhu-rwiza',
  name: 'Uruhu Rwiza',
  tagline: 'Skincare, makeup and beauty essentials',
  icon: 'face-woman-outline',
  categories: [
    { key: 'skincare', label: 'Skincare', icon: 'water-outline' },
    { key: 'makeup', label: 'Makeup', icon: 'lipstick' },
    { key: 'haircare', label: 'Haircare', icon: 'content-cut' },
    { key: 'fragrance', label: 'Fragrance', icon: 'spray-bottle' },
    { key: 'bath-body', label: 'Bath & Body', icon: 'shower' },
  ],
  products: [
    { id: 'ur-1', category: 'skincare', brand: 'Nivea', name: 'Soft Moisturizing Cream, 200ml', price: 7500, description: 'Light, fast-absorbing cream for face, hands and body.', icon: 'water-outline' },
    { id: 'ur-2', category: 'skincare', brand: 'CeraVe', name: 'Hydrating Facial Cleanser, 236ml', price: 18000, description: 'Gentle, non-foaming cleanser for normal to dry skin.', icon: 'water-outline' },
    { id: 'ur-3', category: 'skincare', brand: 'The Ordinary', name: 'Niacinamide 10% + Zinc 1%, 30ml', price: 14000, description: 'Reduces the look of blemishes and congestion.', icon: 'water-outline' },
    { id: 'ur-4', category: 'makeup', brand: 'Maybelline', name: 'Fit Me Matte Foundation', price: 12000, description: 'Natural matte finish, blends into skin for a flawless look.', icon: 'lipstick' },
    { id: 'ur-5', category: 'makeup', brand: 'MAC', name: 'Retro Matte Lipstick', price: 21000, description: 'Full-coverage, long-wearing matte lipstick.', icon: 'lipstick' },
    { id: 'ur-6', category: 'makeup', brand: 'L’Oréal', name: 'Paradise Mascara', price: 9500, description: 'Castor-oil-infused formula for volume and length.', icon: 'lipstick' },
    { id: 'ur-7', category: 'haircare', brand: 'Cantu', name: 'Shea Butter Leave-In Conditioner', price: 11000, description: 'For natural, curly and coily hair, deep moisture.', icon: 'content-cut' },
    { id: 'ur-8', category: 'haircare', brand: 'Dove', name: 'Nourishing Oil Care Shampoo, 400ml', price: 6500, description: 'Repairs dry, damaged hair with a lightweight oil blend.', icon: 'content-cut' },
    { id: 'ur-9', category: 'fragrance', brand: 'Davidoff', name: 'Cool Water EDT, 125ml', price: 42000, description: 'Fresh aquatic scent, a long-time classic.', icon: 'spray-bottle' },
    { id: 'ur-10', category: 'fragrance', brand: 'Victoria’s Secret', name: 'Bombshell EDP, 100ml', price: 55000, description: 'Fruity-floral signature scent.', icon: 'spray-bottle' },
    { id: 'ur-11', category: 'bath-body', brand: 'Dove', name: 'Deeply Nourishing Body Wash, 400ml', price: 7000, description: 'Creamy lather that leaves skin feeling soft.', icon: 'shower' },
    { id: 'ur-12', category: 'bath-body', brand: 'Vaseline', name: 'Cocoa Butter Body Lotion, 400ml', price: 5500, description: 'Deep moisture for dry skin, light cocoa scent.', icon: 'shower' },
  ],
};

export const STORES = { allingadget: ALLINGADGET, 'uruhu-rwiza': URUHU_RWIZA };

export default { ALLINGADGET, URUHU_RWIZA, STORES };
