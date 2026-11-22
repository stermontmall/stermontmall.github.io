/* Stermont interim data adapter: Supabase-js-like subset over PocketBase.
 * Load after the PocketBase config and before site modules. Never expose superuser credentials.
 * Public browser code uses only PocketBase users auth tokens; staff permissions are server rules.
 */
(function(global){
"use strict";
const PB_URL=(global.STM_PB_URL||"").replace(/\/+$/,"");
const AUTH_KEY="stm_pb_auth_v1";
let auth={token:"",record:null};
try{auth=JSON.parse(localStorage.getItem(AUTH_KEY)||"{}");}catch{}
const listeners=new Set();
function persist(){try{localStorage.setItem(AUTH_KEY,JSON.stringify(auth));}catch{}}
function headers(extra={}){return {"Content-Type":"application/json",...(auth.token?{Authorization:auth.token}:{}),...extra};}
async function api(url,options={}){
 if(!PB_URL)throw new Error("STM_PB_URL is not configured");
 const res=await fetch(PB_URL+url,{...options,headers:headers(options.headers||{})});
 const body=await res.json().catch(()=>({}));
 if(!res.ok){const e=new Error(body.message||("PocketBase HTTP "+res.status));e.status=res.status;e.data=body.data;throw e;}
 return body;
}
function emit(event){for(const fn of listeners){try{fn(event,auth.record||null);}catch(e){console.error(e);}}}
function fieldName(name){return name==="id"?"supabase_id":name;}
function encodeFilter(filters){return filters.map(f=>{const k=fieldName(f.field),v=typeof f.value==="string"?JSON.stringify(f.value):String(f.value);return k+" "+f.op+" "+v;}).join(" && ");}
function toQuery(q){
 const p=new URLSearchParams();if(q.filter.length)p.set("filter",encodeFilter(q.filter));
 if(q.sort.length)p.set("sort",q.sort.map(x=>(x.desc?"-":"")+fieldName(x.field)).join(","));
 if(q.limitValue!=null)p.set("perPage",String(Math.min(500,q.limitValue)));
 if(q.page!=null)p.set("page",String(q.page));
 if(q.fields&&q.fields!=="*")p.set("fields",q.fields.split(",").map(fieldName).join(","));
 return p.toString();
}
function mapRecord(table,row){
 if(!row)return row;const x={...row};if(x.supabase_id!==undefined){x.id=table==="categories"?Number(x.supabase_id):x.supabase_id;delete x.supabase_id;}
 if(table==="products")delete x.cost;
 return x;
}
class Query{
 constructor(table){this.table=table;this.action="select";this.columns="*";this.filter=[];this.sort=[];this.limitValue=null;this.page=1;this.payload=null;this.returning=false;this.one=false;}
 select(cols="*"){this.columns=cols;this.returning=true;return this;}
 eq(k,v){this.filter.push({field:k,op:"=",value:v});return this;}
 neq(k,v){this.filter.push({field:k,op:"!=",value:v});return this;}
 gt(k,v){this.filter.push({field:k,op:">",value:v});return this;}
 gte(k,v){this.filter.push({field:k,op:">=",value:v});return this;}
 lt(k,v){this.filter.push({field:k,op:"<",value:v});return this;}
 lte(k,v){this.filter.push({field:k,op:"<=",value:v});return this;}
 like(k,v){this.filter.push({field:k,op:"~",value:v});return this;}
 ilike(k,v){this.filter.push({field:k,op:"~",value:v});return this;}
 in(k,values){this.filter.push({field:k,op:"?=",value:values});return this;}
 is(k,v){this.filter.push({field:k,op:v===null?"=":"=",value:v});return this;}
 order(k,{ascending=true}={}){this.sort.push({field:k,desc:!ascending});return this;}
 limit(n){this.limitValue=n;return this;}
 range(a,b){this.page=Math.floor(a/Math.max(1,b-a+1))+1;this.limitValue=b-a+1;return this;}
 single(){this.one=true;return this;}
 maybeSingle(){this.one=true;return this;}
 insert(rows){this.action="insert";this.payload=Array.isArray(rows)?rows:[rows];return this;}
 update(values){this.action="update";this.payload=values;return this;}
 delete(){this.action="delete";return this;}
 async execute(){
  try{
   let rows=[];
   if(this.action==="select"){
    const qs=toQuery(this);const result=await api("/api/collections/"+encodeURIComponent(this.table)+"/records"+(qs?"?"+qs:""));
    rows=(result.items||[]).map(r=>mapRecord(this.table,r));
    if(this.one){if(rows.length>1)throw new Error("Expected one record but received multiple");return {data:rows[0]||null,error:null,count:result.totalItems??null};}
    return {data:rows,error:null,count:result.totalItems??null};
   }
   if(this.action==="insert"){
    rows=[];for(const input of this.payload){const body={...input};if(body.id!==undefined){body.supabase_id=String(body.id);delete body.id;}const r=await api("/api/collections/"+encodeURIComponent(this.table)+"/records",{method:"POST",body:JSON.stringify(body)});rows.push(mapRecord(this.table,r));}
   }else{
    const qs=toQuery(this);const found=await api("/api/collections/"+encodeURIComponent(this.table)+"/records"+(qs?"?"+qs:""));
    if(this.action==="update"){for(const r of found.items||[]){const patch={...this.payload};if(patch.id!==undefined){patch.supabase_id=String(patch.id);delete patch.id;}const u=await api("/api/collections/"+encodeURIComponent(this.table)+"/records/"+r.id,{method:"PATCH",body:JSON.stringify(patch)});rows.push(mapRecord(this.table,u));}}
    if(this.action==="delete"){for(const r of found.items||[])await api("/api/collections/"+encodeURIComponent(this.table)+"/records/"+r.id,{method:"DELETE"});}
   }
   return {data:this.returning?rows:null,error:null,count:rows.length};
  }catch(error){return {data:null,error,count:null};}
 }
 then(resolve,reject){return this.execute().then(resolve,reject);}
}
const authApi={
 getSession:async()=>({data:{session:auth.token?{access_token:auth.token,user:auth.record}:null},error:null}),
 getUser:async()=>({data:{user:auth.record||null},error:null}),
 signInWithPassword:async({email,password})=>{try{const r=await api("/api/collections/users/auth-with-password",{method:"POST",body:JSON.stringify({identity:email,password})});auth={token:r.token,record:r.record};persist();emit("SIGNED_IN");return {data:{user:r.record,session:{access_token:r.token,user:r.record}},error:null};}catch(error){return {data:{user:null,session:null},error};}},
 signOut:async()=>{auth={token:"",record:null};persist();emit("SIGNED_OUT");return {error:null};},
 onAuthStateChange:callback=>{listeners.add(callback);return {data:{subscription:{unsubscribe:()=>listeners.delete(callback)}}};}
};
const client={from:table=>new Query(table),auth:authApi,
 rpc:async()=>({data:null,error:new Error("RPCs are not implemented in the interim PocketBase adapter; use a server-side PocketBase hook for privileged operations.")}),
 storage:{from:()=>({getPublicUrl:key=>({data:{publicUrl:key}})})}};
global.STM_DB=client;
})(window);
