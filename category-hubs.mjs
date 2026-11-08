// Shared category hubs for the generated shop taxonomy.
// Parent pages aggregate products from active child categories; empty hubs are not generated.
export const HUBS = {
  'pest-control-fumigation': { name: 'Pest Control & Fumigation', label: 'Pest control by type', kids: ['bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals', 'sprayers-equipment'] },
  'agrochemicals': { name: 'Agrochemicals', label: 'Agrochemicals by type', kids: ['herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators'] },
  'agrovet': { name: 'Agrovet', label: 'Agrovet by type', kids: ['agrochemicals', 'fertilizers', 'veterinary-drugs', 'animal-feeds', 'disinfectants-hygiene'] },
  'tvs-audio': { name: 'TVs & Audio', label: 'TVs and audio by type', kids: ['televisions', 'home-theatre', 'bluetooth-speakers', 'tv-mounts-accessories'] },
  'tv-audio-video': { name: 'TV, Audio & Video', label: 'TV, audio and video by type', kids: ['tvs-audio', 'cameras-photography', 'music-audio', 'woofers'] },
  'appliances': { name: 'Appliances', label: 'Appliances by type', kids: ['washing-machines', 'fridges-freezers', 'kitchen-dining'] },
  'automotive': { name: 'Automotive', label: 'Automotive by type', kids: ['cars-for-sale', 'car-accessories-parts', 'motorcycle-accessories'] },
  'fashion': { name: 'Clothing & Fashion', label: 'Clothing by type', kids: ['mens-fashion', 'womens-fashion', 'kids-fashion'] },
  'phones-accessories': { name: 'Phones & Accessories', label: 'Phones and accessories by type', kids: ['phones-tablets', 'phone-accessories', 'refurbished-phones', 'earphones-headset'] },
  'computers-accessories': { name: 'Computers & Accessories', label: 'Computers and technology by type', kids: ['computing', 'gaming', 'networking-smart-home', 'printers-office-machines', 'security-cctv'] },
  'home-kitchen': { name: 'Home & Kitchen', label: 'Home and kitchen by type', kids: ['home-office', 'bedding-decor', 'cleaning-laundry', 'electrical-lighting', 'furniture', 'home-storage', 'kitchen-dining', 'solar-power'] },
  'baby-products': { name: 'Kids & Baby Products', label: 'Kids products by type', kids: ['toys-games'] },
  'shoes': { name: 'Shoes', label: 'Shoes by type', kids: ['mens-sneakers', 'womens-sneakers', 'ladies-sandals'] },
  'health-beauty': { name: 'Health & Beauty', label: 'Health and wellness by type', kids: ['medical-supplies'] }
};

export function applyCategoryHubs(byCat) {
  const result = { ...byCat };
  for (const [slug, hub] of Object.entries(HUBS)) {
    const items = [...(result[slug]?.items || [])];
    for (const child of hub.kids) {
      for (const product of (result[child]?.items || [])) {
        if (!items.includes(product)) items.push(product);
      }
    }
    if (items.length) result[slug] = { name: hub.name, items };
  }
  return result;
}
