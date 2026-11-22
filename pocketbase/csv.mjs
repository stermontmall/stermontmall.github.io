// RFC-4180-compatible CSV parser for UTF-8 exports, including multiline quoted cells.
export function parseCSV(input){
 input=String(input).replace(/^\uFEFF/,"");const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<input.length;i++){const ch=input[i],next=input[i+1];
  if(quoted){if(ch==='"'&&next==='"'){cell+='"';i++;}else if(ch==='"')quoted=false;else cell+=ch;}
  else if(ch==='"')quoted=true;
  else if(ch===","){row.push(cell);cell="";}
  else if(ch==="\n"){row.push(cell.replace(/\r$/,""));rows.push(row);row=[];cell="";}
  else cell+=ch;
 }
 if(quoted)throw new Error("CSV ends inside a quoted field.");
 if(cell.length||row.length){row.push(cell.replace(/\r$/,""));rows.push(row);}
 if(!rows.length)return [];
 const headers=rows.shift().map(x=>x.trim());
 return rows.filter(r=>r.some(v=>v!=="")).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])));
}
