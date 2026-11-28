// Fail closed when an in-stock catalogue item cannot safely become a crawlable product page.
// Stored SEO overrides are optional: generate-products.mjs supplies title/name/description fallbacks.
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const NEON_REST='https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/';
const NEON_AUTH='https://ep-dry-butterfly-bhytt90y.neonauth.c-10.eu-central-1.aws.neon.tech/stermont/auth';
const PAGE_SIZE=200, pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const inStock=p=>Number(p?.stock)>0, nonblank=v=>typeof v==='string'&&v.trim().length>0;
export function auditProducts(products=[]) {
 const errors=[],warnings=[],rows=Array.isArray(products)?products.filter(inStock):[],ids=new Set(),slugs=new Map();
 for(const p of rows){
  const id=nonblank(p?.id)?p.id.trim():'(missing id)',name=nonblank(p?.name)?p.name.trim():'';
  if(!nonblank(p?.id))errors.push(id+': missing stable product id');
  if(!name)errors.push(id+': missing product name');
  if(ids.has(id))errors.push(id+': duplicate product id in active catalogue'); ids.add(id);
  const price=Number(p?.price); if(!Number.isFinite(price)||price<=0)errors.push(id+': in-stock product must have a positive numeric price');
  if(!(nonblank(p?.category_id)||nonblank(p?.categories?.slug)||nonblank(p?.categories?.name)))errors.push(id+': in-stock product has no category');
  const images=Array.isArray(p?.images)?p.images.filter(nonblank):[];
  if(!images.length)warnings.push(id+': no usable product image; generated page will use its fallback image treatment');
  if(!nonblank(p?.description))warnings.push(id+': missing product description; review before requesting Google indexing');
  const slug=nonblank(p?.slug)?p.slug.trim().toLowerCase():'';
  if(!slug)warnings.push(id+': no custom slug; generator will use the stable product id');
  else if(slugs.has(slug)&&slugs.get(slug)!==id)errors.push(id+': duplicate product slug also used by '+slugs.get(slug)); else slugs.set(slug,id);
  if(!nonblank(p?.seo_name))warnings.push(id+': seo_name absent; generated H1 fallback will be used');
  if(!nonblank(p?.seo_title)&&!nonblank(p?.meta_title))warnings.push(id+': stored SEO title absent; generated title fallback will be used');
  if(!nonblank(p?.meta_description))warnings.push(id+': stored meta description absent; generated description fallback will be used');
  if(!nonblank(p?.alt_text))warnings.push(id+': image alt text absent; generated product-name fallback will be used');
 }
 return {count:rows.length,errors,warnings};
}
async function fetchActiveProducts(){
 if(process.env.PRODUCTS_JSON){const parsed=JSON.parse(readFileSync(process.env.PRODUCTS_JSON,'utf8'));if(!Array.isArray(parsed))throw new Error('PRODUCTS_JSON must contain an array of product records.');return parsed;}
 let token='',lastError='No request attempted';
 for(let attempt=1;attempt<=3;attempt++){try{const r=await fetch(NEON_AUTH+'/token/anonymous',{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('Neon Auth HTTP '+r.status+': '+(await r.text()).slice(0,250));const p=await r.json();if(!nonblank(p?.token))throw new Error('Neon Auth returned no anonymous token');token=p.token;break;}catch(e){lastError=String(e?.message||e).slice(0,350);if(attempt<3)await pause(700*attempt);}}
 if(!token)throw new Error('Could not obtain Neon Auth token: '+lastError);
 const columns='id,slug,name,category_id,description,price,stock,images,seo_name,seo_title,meta_title,meta_description,alt_text',products=[];let offset=0;
 while(true){let batch=null;for(let attempt=1;attempt<=3;attempt++){try{const url=NEON_REST+'products?active=eq.true&select='+encodeURIComponent(columns)+'&order=created_at.asc,id.asc&limit='+PAGE_SIZE+'&offset='+offset;const r=await fetch(url,{headers:{Authorization:'Bearer '+token,accept:'application/json'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('Neon products HTTP '+r.status+' at offset '+offset+': '+(await r.text()).slice(0,300));const p=await r.json();if(!Array.isArray(p))throw new Error('Neon products API returned a non-array payload at offset '+offset);batch=p;break;}catch(e){lastError=String(e?.message||e).slice(0,350);if(attempt<3)await pause(700*attempt);}}
  if(batch===null)throw new Error('Could not load complete active Neon catalogue: '+lastError);products.push(...batch);if(batch.length<PAGE_SIZE)break;offset+=batch.length;
 }
 if(!products.length)throw new Error('Neon returned zero active products; refusing to pass an empty indexing audit.');return products;
}
export function checkCatalogueVolume({inStock=0,baseline=0}={}){const current=Number(inStock)||0,prior=Number(baseline)||0;return {ok:prior<=5||current>=Math.ceil(prior/2),inStock:current,baseline:prior};}
export async function runCatalogueAudit(products){const rows=products||await fetchActiveProducts(),r=auditProducts(rows);const sitemap=existsSync('sitemap-products.xml')?readFileSync('sitemap-products.xml','utf8'):'';const baseline=[...sitemap.matchAll(/<loc>[^<]*\\/p\\/[^<]+<\\/loc>/g)].length;const volume=checkCatalogueVolume({inStock:r.count,baseline});if(!volume.ok)r.errors.push('in-stock catalogue collapsed to '+volume.inStock+' products from '+volume.baseline+' product URLs in the previous sitemap; refusing to rebuild and delete existing pages');console.log('Product indexing readiness: '+r.count+' in-stock products audited; '+r.errors.length+' blockers; '+r.warnings.length+' warnings; prior sitemap baseline '+baseline+'.');for(const x of r.warnings)console.warn('[index-readiness] '+x);for(const x of r.errors)console.error('[index-readiness] BLOCKER: '+x);if(r.errors.length)throw new Error('Product indexing readiness failed with '+r.errors.length+' blocker(s).');return r;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{await runCatalogueAudit();}catch(e){console.error(e?.stack||e);process.exitCode=1;}}
