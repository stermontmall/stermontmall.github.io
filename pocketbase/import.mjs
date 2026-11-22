#!/usr/bin/env node
// Import Supabase CSV exports into PocketBase. Node 20+, no dependencies.
// Usage: PB_URL=... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... node pocketbase/import.mjs [--active-with-images] [--state .pocketbase-import-state.json]
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseCSV } from "./csv.mjs";
const arg=(name,def)=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:def;};
const onlyActive=process.argv.includes("--active-with-images");
const statePath=path.resolve(arg("--state",".pocketbase-import-state.json"));
const base=(process.env.PB_URL||"").trim().replace(/\/+$/,"");
const email=(process.env.PB_ADMIN_EMAIL||"").trim(), password=process.env.PB_ADMIN_PASSWORD||"";
if(!base||!email||!password){console.error("Set PB_URL, PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD. Never put these in the CSV or source files.");process.exit(2);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function pgArray(s){
 if(Array.isArray(s))return s;if(s==null||s==="")return [];
 const t=String(s).trim();if(!t.startsWith("{")||!t.endsWith("}"))return [t];
 const out=[];let v="",q=false,esc=false,wasQuoted=false;
 for(let i=1;i<t.length-1;i++){const c=t[i];if(esc){v+=c;esc=false;}else if(c.charCodeAt(0)===92)esc=true;else if(c==='"'){q=!q;wasQuoted=true;}else if(c===","&&!q){out.push(!wasQuoted&&v==="NULL"?null:v);v="";wasQuoted=false;}else v+=c;}
 if(v.length||t.length>2)out.push(!wasQuoted&&v==="NULL"?null:v);return out;
}
function val(v,type="text"){
 if(v===undefined||v===null||v==="")return null;
 const s=String(v);
 if(type==="bool")return ["true","t","1","yes"].includes(s.toLowerCase());
 if(type==="number"){const n=Number(s);if(!Number.isFinite(n))throw new Error("Invalid number: "+s);return n;}
 if(type==="array")return pgArray(s);
 if(type==="json"){try{return JSON.parse(s);}catch(e){throw new Error("Invalid JSON/JSONB value: "+s.slice(0,120));}}
 if(type==="date")return s;
 return s;
}
const boolFields=new Set(["is_promo","featured","active","public_offer","first_order_only","pay_verified"]);
const numberFields=new Set(["parent_id","sort_order","top_sort","category_id","price","stock","low_at","min_order","max_uses","used_count","value","subtotal","pay_amount","discount","rating","cost"]);
const arrayFields=new Set(["images","keywords"]);
const jsonFields=new Set(["items"]);
function normalize(row,collection){
 const out={};
 for(const [k,v] of Object.entries(row)){
  if((v===undefined||v===null||v==="")&&arrayFields.has(k)){out[k]=[];continue;}
  if(v===undefined||v===null||v==="")continue;
  if(k==="id"){out.supabase_id=String(v);continue;}
  if(k==="cost"&&collection==="products")continue;
  if(collection==="products"&&(k==="price"||k==="old_price")&&v!==""&&v!=null){
   const n=Number(v);if(!Number.isFinite(n)||Math.abs(n-Math.round(n))>0.000001||![0,50,99].includes(Math.round(n)%100))throw new Error("Product "+(row.slug||row.id)+" field "+k+" must be a whole KES amount ending 00, 50 or 99: "+v);
  }
  if(boolFields.has(k))out[k]=val(v,"bool");
  else if(numberFields.has(k))out[k]=val(v,"number");
  else if(arrayFields.has(k))out[k]=val(v,"array");
  else if(jsonFields.has(k))out[k]=val(v,"json");
  else out[k]=val(v);
 }
 if(collection==="products"&&!out.slug&&row.id)out.slug=String(row.id);
 return out;
}
let token="";
async function request(url,options={},attempt=0){
 const res=await fetch(base+url,{...options,headers:{"Content-Type":"application/json",...(token?{Authorization:token}:{}),...(options.headers||{})}});
 const body=await res.json().catch(()=>({}));
 if(res.status===429&&attempt<7){const wait=Math.min(60000,1000*2**attempt);console.warn("PocketHost rate limit; waiting "+wait+"ms");await sleep(wait);return request(url,options,attempt+1);}
 if(!res.ok)throw new Error(url+" -> "+res.status+": "+(body.message||JSON.stringify(body)));
 return body;
}
async function readCSV(file){try{return parseCSV(await fs.readFile(file,"utf8"));}catch(e){if(e.code==="ENOENT"){console.warn("Skipping missing "+file);return [];}throw e;}}
async function loadState(){try{return JSON.parse(await fs.readFile(statePath,"utf8"));}catch{return {completed:{}};}}
async function saveState(s){await fs.writeFile(statePath,JSON.stringify(s,null,2)+"\n",{mode:0o600});}
async function existingMap(collection){
 const map=new Map();let page=1;
 const selectFields=collection==="users"?"id,supabase_user_id":collection==="product_costs"?"id,pid":"id,supabase_id";
 for(;;){const r=await request("/api/collections/"+collection+"/records?perPage=500&page="+page+"&fields="+selectFields);for(const x of r.items||[]){const key=x.supabase_id??x.supabase_user_id??x.pid;if(key!=null)map.set(String(key),x.id);}if(page>=r.totalPages)break;page++;}
 return map;
}
async function sequential(collection,ops,onDone){
 for(const op of ops){let tries=0;for(;;){try{const r=await request(op.url,{method:op.method,body:JSON.stringify(op.body)});await onDone(op,r);break;}catch(e){if(/-> 429/.test(e.message)&&tries++<7){await sleep(Math.min(60000,1000*2**tries));continue;}throw e;}}}
}
async function writeBatch(collection,records,existing,state){
 const ops=records.map(rec=>{const key=String(rec.supabase_id??rec.pid??"");const id=existing.get(key);return {key,method:id?"PATCH":"POST",url:"/api/collections/"+collection+"/records"+(id?"/"+encodeURIComponent(id):""),body:rec};});
 const groups=[];for(let i=0;i<ops.length;i+=50)groups.push(ops.slice(i,i+50));
 for(const group of groups){
  try{
   const result=await request("/api/batch",{method:"POST",body:JSON.stringify({requests:group.map(o=>({method:o.method,url:o.url,body:o.body}))})});
   if(!Array.isArray(result)||result.some(x=>!x||x.status>=400))throw new Error("Batch returned one or more failed subrequests.");
   for(let i=0;i<group.length;i++){const body=result[i]?.body||{};if(body.id)existing.set(group[i].key,body.id);state.completed[collection]=(state.completed[collection]||0)+1;}
   await saveState(state);
  }catch(batchError){
   console.warn("Batch failed for "+collection+"; retrying this batch sequentially: "+batchError.message);
   await sequential(collection,group,async(op,result)=>{if(result.id)existing.set(op.key,result.id);state.completed[collection]=(state.completed[collection]||0)+1;await saveState(state);});
  }
 }
}
async function main(){
 const ar=await fetch(base+"/api/collections/_superusers/auth-with-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identity:email,password})});const ab=await ar.json().catch(()=>({}));if(!ar.ok)throw new Error("PocketBase login failed ("+ar.status+"): "+(ab.message||"check credentials"));token=ab.token;
 const state=await loadState();
 const tasks=[["categories","categories.csv"],["products","products.csv"],["vouchers","vouchers.csv"],["orders","orders.csv"]];
 for(const [collection,file] of tasks){
  const rows=await readCSV(file);if(!rows.length)continue;
  let clean=rows.map(r=>normalize(r,collection));
  if(collection==="orders"){
   const users=await existingMap("users");
   clean=clean.map((record,index)=>{const legacy=rows[index].user_id||"";record.supabase_user_id=legacy||"";record.user_id=legacy?(users.get(String(legacy))||""):"";return record;});
  }
  let costRows=[];
  if(collection==="products"){const eligible=onlyActive?rows.filter(r=>["true","t","1","yes"].includes(String(r.active).toLowerCase())&&pgArray(r.images).length>0):rows;costRows=eligible.filter(r=>r.cost!==""&&r.cost!=null).map(r=>({pid:String(r.id||r.slug),cost:val(r.cost,"number")}));if(onlyActive)clean=clean.filter(r=>r.active===true&&Array.isArray(r.images)&&r.images.length>0);}
  if(!clean.length){console.log(collection+": no rows to import");continue;}
  const existing=await existingMap(collection);
  console.log(collection+": importing "+clean.length+" rows (existing records will be updated safely)");
  await writeBatch(collection,clean,existing,state);
  if(costRows.length){const costMap=await existingMap("product_costs");await writeBatch("product_costs",costRows,costMap,state);}
  console.log(collection+": complete");
 }
 console.log("Import finished. Progress checkpoint: "+statePath);
}
main().catch(e=>{console.error("Import stopped safely: "+e.message);console.error("Fix the reported row/API issue and rerun; completed rows are upserted by original Supabase ID.");process.exit(1);});
