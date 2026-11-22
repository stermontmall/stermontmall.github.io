// Upload three existing, verified Stermont product photos from GitHub to ImageKit Media Library.
// This does not read Supabase, alter product records, or delete/overwrite unrelated files.
import { writeFileSync, mkdirSync, appendFileSync } from 'node:fs';

const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';
const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const DESTINATION = '/s-termont-pilot/product-images';
const items = [
  { id: '2-litre-hand-pressure-sprayer-2-litres', name: '2 Litre Hand Pressure Sprayer', file: '2-litre-hand-pressure-sprayer-2-litres.webp' },
  { id: 'jacto-hd-550-knapsack-sprayer-20-litres', name: 'Jacto HD 550 Knapsack Sprayer', file: 'jacto-hd-550-knapsack-sprayer-20-litres.jpg' },
  { id: 'total-20l-knapsack-sprayer', name: 'Total 20L Knapsack Sprayer 4.5Bar', file: 'total-20l-knapsack-sprayer.jpg' },
];

if (!PRIVATE_KEY) throw new Error('Missing GitHub Actions secret IMAGEKIT_PRIVATE_KEY.');
const auth = 'Basic ' + Buffer.from(PRIVATE_KEY + ':').toString('base64');
const results = [];

for (const item of items) {
  const source = `https://raw.githubusercontent.com/stermontmall/stermontmall.github.io/main/product-photos/${item.file}`;
  const download = await fetch(source, { signal: AbortSignal.timeout(60000) });
  if (!download.ok) throw new Error(`GitHub source download failed for ${item.file}: HTTP ${download.status}`);
  const bytes = await download.arrayBuffer();
  const mime = download.headers.get('content-type') || (item.file.endsWith('.webp') ? 'image/webp' : 'image/jpeg');

  const form = new FormData();
  form.set('file', new Blob([bytes], { type: mime }), item.file);
  form.set('fileName', item.file);
  form.set('folder', DESTINATION);
  form.set('useUniqueFileName', 'false');
  form.set('overwriteFile', 'true');

  const upload = await fetch(UPLOAD_URL, { method: 'POST', headers: { Authorization: auth }, body: form, signal: AbortSignal.timeout(120000) });
  const responseText = await upload.text();
  if (!upload.ok) throw new Error(`ImageKit upload failed for ${item.file}: HTTP ${upload.status} ${responseText.slice(0, 500)}`);
  const response = JSON.parse(responseText);
  if (!response.url || !response.fileId) throw new Error(`ImageKit returned no URL/fileId for ${item.file}`);

  results.push({ product_id: item.id, product_name: item.name, filename: item.file, imagekit_url: response.url, file_id: response.fileId, width: response.width ?? null, height: response.height ?? null, size: response.size ?? bytes.byteLength });
  console.log(`Uploaded ${item.name}: ${response.url}`);
}

mkdirSync('imagekit-upload-results', { recursive: true });
writeFileSync('imagekit-upload-results/three-products.json', JSON.stringify(results, null, 2) + '\n');
const summary = ['## ImageKit pilot upload succeeded', ...results.map((x) => `- **${x.product_name}** — [ImageKit photo](${x.imagekit_url})`), '', 'Files are in ImageKit Media Library under `/s-termont-pilot/product-images`.', 'The live catalogue has not been changed; verify the returned URLs before updating the three product image fields.'].join('\n');
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
