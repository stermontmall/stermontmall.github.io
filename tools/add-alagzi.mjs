import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// 1. Copy photo 1 (48).jpg to product-photos/alagzi-turquoise-cream-urban-casual-sneakers.jpg
const imgData = readFileSync('product-photos/1 (48).jpg');
writeFileSync('product-photos/alagzi-turquoise-cream-urban-casual-sneakers.jpg', imgData);
console.log('Copied Alagzi photo successfully.');
