// Builds google-product-categories.json: Stermont category slug -> official Google product taxonomy id + full path.
// Usage: node scripts/build-google-category-map.mjs /path/to/taxonomy-with-ids.en-US.txt
// Every path must exist in Google's taxonomy file; the script stops on the first one that does not.
import { readFileSync, writeFileSync } from 'node:fs';

const P = {
  pest: 'Home & Garden > Household Supplies > Pest Control',
  pesticides: 'Home & Garden > Household Supplies > Pest Control > Pesticides',
  pestTraps: 'Home & Garden > Household Supplies > Pest Control > Pest Control Traps',
  sprayers: 'Home & Garden > Lawn & Garden > Gardening > Gardening Tools > Lawn & Garden Sprayers',
  agri: 'Business & Industrial > Agriculture',
  husbandry: 'Business & Industrial > Agriculture > Animal Husbandry',
  feed: 'Business & Industrial > Agriculture > Animal Husbandry > Livestock Feed',
  seeds: 'Home & Garden > Plants > Seeds',
  fert: 'Home & Garden > Lawn & Garden > Gardening > Fertilizers',
  herb: 'Home & Garden > Lawn & Garden > Gardening > Herbicides',
  irrigation: 'Home & Garden > Lawn & Garden > Watering & Irrigation',
  disinf: 'Home & Garden > Household Supplies > Household Cleaning Supplies > Household Cleaning Products > Household Disinfectants',
  gardenTools: 'Home & Garden > Lawn & Garden > Gardening > Gardening Tools',
  electronics: 'Electronics',
  audio: 'Electronics > Audio',
  phones: 'Electronics > Communications > Telephony > Mobile Phones',
  phoneAcc: 'Electronics > Communications > Telephony > Mobile Phone Accessories',
  headsets: 'Electronics > Audio > Audio Components > Headphones & Headsets',
  tv: 'Electronics > Video > Televisions',
  theatre: 'Electronics > Audio > Audio Players & Recorders > Home Theater Systems',
  speakers: 'Electronics > Audio > Audio Components > Speakers',
  tvMounts: 'Electronics > Video > Video Accessories > Television Parts & Accessories > TV & Monitor Mounts',
  computers: 'Electronics > Computers',
  gaming: 'Electronics > Video Game Consoles',
  cameras: 'Cameras & Optics > Cameras',
  cctv: 'Cameras & Optics > Cameras > Surveillance Cameras',
  printers: 'Electronics > Print, Copy, Scan & Fax',
  network: 'Electronics > Networking',
  solar: 'Hardware > Power & Electrical Supplies',
  lighting: 'Home & Garden > Lighting',
  appliances: 'Home & Garden > Household Appliances',
  washers: 'Home & Garden > Household Appliances > Laundry Appliances > Washing Machines',
  fridges: 'Home & Garden > Kitchen & Dining > Kitchen Appliances > Refrigerators',
  home: 'Home & Garden',
  officeFurn: 'Furniture > Office Furniture',
  kitchen: 'Home & Garden > Kitchen & Dining',
  furniture: 'Furniture',
  bedding: 'Home & Garden > Linens & Bedding',
  cleaning: 'Home & Garden > Household Supplies > Household Cleaning Supplies',
  storage: 'Home & Garden > Household Supplies > Storage & Organization',
  lawn: 'Home & Garden > Lawn & Garden',
  hardware: 'Hardware',
  tools: 'Hardware > Tools',
  food: 'Food, Beverages & Tobacco',
  clothing: 'Apparel & Accessories > Clothing',
  shoes: 'Apparel & Accessories > Shoes',
  bags: 'Luggage & Bags',
  jewelry: 'Apparel & Accessories > Jewelry',
  beauty: 'Health & Beauty',
  healthcare: 'Health & Beauty > Health Care',
  baby: 'Baby & Toddler',
  toys: 'Toys & Games',
  party: 'Arts & Entertainment > Party & Celebration',
  gifts: 'Arts & Entertainment > Party & Celebration > Gift Giving',
  sports: 'Sporting Goods',
  office: 'Office Supplies',
  pets: 'Animals & Pet Supplies > Pet Supplies',
  business: 'Business & Industrial',
  safety: 'Business & Industrial > Work Safety Protective Gear',
  vehicles: 'Vehicles & Parts',
  vehicleParts: 'Vehicles & Parts > Vehicle Parts & Accessories',
  motorParts: 'Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts',
  cars: 'Vehicles & Parts > Vehicles > Motor Vehicles > Cars, Trucks & Vans'
};

// slug -> key in P. 'others' and 'kili-featured' are deliberately unmapped (mixed catch-alls); their items omit the attribute.
const MAP = {
  'pest-control-fumigation': 'pest', 'bed-bug-killers': 'pesticides', 'cockroach-ant-killers': 'pesticides', 'mosquito-fly-control': 'pesticides',
  'rodent-control': 'pesticides', 'termite-control': 'pesticides', 'fumigation-chemicals': 'pesticides', 'sprayers-equipment': 'sprayers',
  'fogging-ulv-machines': 'pest', 'insect-light-traps-uv-lamps': 'pestTraps', 'pest-monitoring-inspection-tools': 'pest',
  'agrovet': 'agri', 'animal-feeds': 'feed', 'veterinary-drugs': 'husbandry', 'seeds-seedlings': 'seeds', 'fertilizers': 'fert', 'agrochemicals': 'agri',
  'herbicides': 'herb', 'fungicides': 'agri', 'crop-insecticides': 'pesticides', 'adjuvants-growth-regulators': 'agri', 'poultry-dairy-equipment': 'husbandry',
  'water-tanks-irrigation': 'irrigation', 'beekeeping': 'husbandry', 'fish-farming': 'husbandry', 'disinfectants-hygiene': 'disinf', 'farm-garden-tools': 'gardenTools',
  'phones-accessories': 'electronics', 'phones-tablets': 'phones', 'phone-accessories': 'phoneAcc', 'refurbished-phones': 'phones', 'earphones-headset': 'headsets',
  'tv-audio-video': 'electronics', 'tvs-audio': 'electronics', 'televisions': 'tv', 'home-theatre': 'theatre', 'bluetooth-speakers': 'speakers', 'woofers': 'speakers',
  'tv-mounts-accessories': 'tvMounts', 'music-audio': 'audio', 'computers-accessories': 'computers', 'computing': 'computers', 'gaming': 'gaming',
  'cameras-photography': 'cameras', 'printers-office-machines': 'printers', 'networking-smart-home': 'network', 'security-cctv': 'cctv',
  'solar-power': 'solar', 'electrical-lighting': 'lighting', 'appliances': 'appliances', 'washing-machines': 'washers', 'fridges-freezers': 'fridges',
  'home-kitchen': 'home', 'home-office': 'officeFurn', 'kitchen-dining': 'kitchen', 'furniture': 'furniture', 'bedding-decor': 'bedding',
  'cleaning-laundry': 'cleaning', 'home-storage': 'storage', 'garden-outdoors': 'lawn', 'building-hardware': 'hardware', 'tools-machinery': 'tools', 'supermarket': 'food',
  'fashion': 'clothing', 'mens-fashion': 'clothing', 'womens-fashion': 'clothing', 'kids-fashion': 'clothing', 'shoes': 'shoes', 'mens-sneakers': 'shoes',
  'womens-sneakers': 'shoes', 'ladies-sandals': 'shoes', 'bags': 'bags', 'watches-jewellery': 'jewelry', 'health-beauty': 'beauty', 'medical-supplies': 'healthcare',
  'baby-products': 'baby', 'toys-games': 'toys', 'wedding-events': 'party', 'gifts-printing': 'gifts', 'sporting-goods-fitness': 'sports',
  'books-stationery': 'office', 'school-office-supplies': 'office', 'pet-supplies': 'pets', 'packaging-shop-supplies': 'business', 'protective-wear-safety': 'safety',
  'automotive': 'vehicles', 'car-accessories-parts': 'vehicleParts', 'motorcycle-accessories': 'motorParts', 'motorcycle-spare-parts': 'motorParts', 'stermont-cars-for-sale': 'cars'
};

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/build-google-category-map.mjs <taxonomy-with-ids.en-US.txt>'); process.exit(2); }
const byPath = new Map();
for (const line of readFileSync(file, 'utf8').split('\n')) {
  const m = /^(\d+) - (.+)$/.exec(line.trim());
  if (m) byPath.set(m[2], Number(m[1]));
}
const out = {};
for (const [slug, key] of Object.entries(MAP)) {
  const path = P[key], id = byPath.get(path);
  if (!id) { console.error(`Not in Google taxonomy: ${key} -> ${path}`); process.exit(1); }
  out[slug] = { id, path };
}
writeFileSync(new URL('../google-product-categories.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`Wrote ${Object.keys(out).length} category mappings.`);
