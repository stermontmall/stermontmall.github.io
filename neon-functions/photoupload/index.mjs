import pg from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const s3 = new S3Client({ forcePathStyle: true, region: process.env.AWS_REGION });
const jwks = createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL));
const bucket = "product-photos", maxBytes = 12 * 1024 * 1024;
const types = new Map([["image/jpeg",".jpg"],["image/png",".png"],["image/webp",".webp"],["image/gif",".gif"],["image/avif",".avif"],["image/svg+xml",".svg"]]);

function reply(data,status=200,origin="") {
  const h={"content-type":"application/json; charset=utf-8","cache-control":"no-store","vary":"Origin"};
  if(["https://stermontarcade.co.ke","https://www.stermontarcade.co.ke"].includes(origin)){
    h["access-control-allow-origin"]=origin;h["access-control-allow-headers"]="authorization, content-type";h["access-control-allow-methods"]="POST, OPTIONS";
  }
  return new Response(JSON.stringify(data),{status,headers:h});
}
function valid(bytes,type) {
  if(type==="image/jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(type==="image/png")return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(type==="image/webp")return bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP";
  if(type==="image/gif")return ["GIF87a","GIF89a"].includes(bytes.toString("ascii",0,6));
  if(type==="image/avif")return bytes.toString("ascii",4,12).includes("ftypavif");
  if(type==="image/svg+xml"){const x=bytes.toString("utf8").slice(0,4096).trim();return /^<\?xml[\s\S]*?<svg\b|^<svg\b/i.test(x)&&!/<script\b|on\w+\s*=|javascript:/i.test(x);}
  return false;
}
async function adminFrom(req) {
  const token=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token||token.length>8192)return null;
  const {payload}=await jwtVerify(token,jwks);
  if(typeof payload.sub!=="string")return null;
  const r=await pool.query(`SELECT u.email FROM neon_auth."user" u JOIN public.admin_profiles a ON a.user_id=u.id::text WHERE u.id::text=$1 AND a.active AND a.role IN ('owner','admin','editor') AND COALESCE(u.banned,false)=false LIMIT 1`,[payload.sub]);
  return r.rows[0]||null;
}
export default { async fetch(req) {
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS")return reply({},204,origin);
  const url=new URL(req.url);
  if(req.method==="GET"&&url.pathname==="/health")return reply({ok:true,service:"stermont-photo-upload"},200,origin);
  if(req.method!=="POST"||url.pathname!=="/upload")return reply({error:"Not found"},404,origin);
  if(origin&&!["https://stermontarcade.co.ke","https://www.stermontarcade.co.ke"].includes(origin))return reply({error:"Origin not allowed"},403,origin);
  let admin;try{admin=await adminFrom(req)}catch(e){console.error("auth",e);return reply({error:"Authentication failed"},401,origin)}
  if(!admin)return reply({error:"Active Stermont admin session required"},401,origin);
  let form;try{form=await req.formData()}catch{return reply({error:"Use multipart/form-data"},400,origin)}
  const code=String(form.get("product_code")||"").trim(),file=form.get("file"),imageUrl=String(form.get("image_url")||"").trim();
  const sourceUrl=String(form.get("source_url")||"").trim(),sourceName=String(form.get("source_name")||"").trim().slice(0,200);
  if(!code||(!(file instanceof File)&&!imageUrl))return reply({error:"product_code and file or image_url are required"},400,origin);
  if(sourceUrl){try{const u=new URL(sourceUrl);if(u.protocol!=="https:"||u.username||u.password)throw Error()}catch{return reply({error:"source_url must be HTTPS"},400,origin)}}
  let bytes,type;
  if(file instanceof File){if(!file.size||file.size>maxBytes)return reply({error:"Image limit is 12 MB"},413,origin);type=(file.type||"").split(";")[0].toLowerCase();bytes=Buffer.from(await file.arrayBuffer())}
  else{
    let u;try{u=new URL(imageUrl);if(u.protocol!=="https:"||u.username||u.password||!u.hostname.includes(".")||/^(localhost|.*\.localhost|.*\.local)$/i.test(u.hostname)||/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname))throw Error()}catch{return reply({error:"image_url must be a public HTTPS URL"},400,origin)}
    let res;try{res=await fetch(u,{redirect:"manual",signal:AbortSignal.timeout(12000),headers:{Accept:"image/*"}})}catch{return reply({error:"Could not download vendor image"},502,origin)}
    if(!res.ok||res.status>=300)return reply({error:"Image download failed or redirected; upload the file instead"},502,origin);
    type=(res.headers.get("content-type")||"").split(";")[0].toLowerCase();if(Number(res.headers.get("content-length")||0)>maxBytes)return reply({error:"Image exceeds 12 MB"},413,origin);
    bytes=Buffer.from(await res.arrayBuffer());if(!bytes.length||bytes.length>maxBytes)return reply({error:"Image limit is 12 MB"},413,origin);
  }
  if(!types.has(type)||!valid(bytes,type))return reply({error:"Unsupported format or invalid image bytes"},415,origin);
  const p=await pool.query("SELECT id,name,images FROM public.products WHERE product_code=$1 LIMIT 1",[code]);
  if(!p.rows[0])return reply({error:"Product code not found"},404,origin);
  const key=`products/${code.toUpperCase()}/${randomUUID()}${types.get(type)}`;
  try{
    await s3.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:bytes,ContentLength:bytes.length,ContentType:type,CacheControl:"public, max-age=31536000, immutable"}));
    const base=process.env.AWS_ENDPOINT_URL_S3;if(!base)throw Error("Storage endpoint missing");
    const image=`${base.replace(/\/$/,"")}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const images=[...new Set([...(p.rows[0].images||[]),image])];
    await pool.query("UPDATE public.products SET images=$1,updated_at=now() WHERE id=$2",[images,p.rows[0].id]);
    await pool.query(`INSERT INTO public.admin_audit_log(actor_email,action,details,created_at) VALUES($1,'product_photo_uploaded',$2::jsonb,now())`,[admin.email,JSON.stringify({product_code:code,object_key:key,mime_type:type,bytes:bytes.length,source_url:sourceUrl||null,source_name:sourceName||null})]).catch(e=>console.warn("audit log skipped",e.message));
    return reply({ok:true,product_code:code,product_name:p.rows[0].name,image_url:image,object_key:key,mime_type:type,bytes:bytes.length,uploaded_by:admin.email},201,origin);
  }catch(e){console.error("upload",e);return reply({error:"Storage upload or product update failed"},502,origin)}
}};
