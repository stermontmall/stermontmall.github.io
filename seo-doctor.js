/* Stermont Arcade SEO Doctor — technical + Masterpiece Content Studio. */
(function () {
  'use strict';
  var SITE='https://stermontarcade.co.ke';
  function n(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
  function esc(s){return String(s||'').replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function words(s){return (String(s||'').match(/\S+/g)||[]).length;}
  function plain(d){var x=(d.body&&d.body.innerText)||'';return x.replace(/\s+/g,' ').trim();}
  function scan(html,url){
    var d=new DOMParser().parseFromString(html,'text/html'), text=plain(d), low=text.toLowerCase(), issues=[];
    var title=(d.querySelector('title')?.textContent||'').trim(), desc=(d.querySelector('meta[name="description"]')?.getAttribute('content')||'').trim();
    var h1=d.querySelectorAll('h1').length, h2=d.querySelectorAll('h2').length, imgs=d.images.length;
    if(!title)issues.push('Missing title'); else if(title.length<25||title.length>65)issues.push('Title length '+title.length+' chars');
    if(!desc)issues.push('Missing meta description'); else if(desc.length<70||desc.length>165)issues.push('Meta description length '+desc.length+' chars');
    if(h1!==1)issues.push('Expected one H1; found '+h1);
    if(!d.querySelector('link[rel~="canonical"]'))issues.push('Missing canonical URL');
    if(!d.querySelector('meta[property="og:title"]'))issues.push('Missing Open Graph title');
    if(!d.querySelector('meta[property="og:image"]'))issues.push('Missing Open Graph image');
    if(!d.querySelector('script[type="application/ld+json"]'))issues.push('Missing structured data');
    if(!imgs)issues.push('No images');
    if(words(text)<350)issues.push('Thin visible content: '+words(text)+' words');
    return {doc:d,url:url,title:title,desc:desc,text:text,low:low,issues:issues,h2:h2,words:words(text)};
  }
  function contentModel(r){
    var service=/\/services\//.test(new URL(r.url).pathname), p=r.low, missing=[], score=100;
    var tests=[
      ['Clear promise and audience',/home|office|business|restaurant|hotel|airbnb|school|farm|shop|property|premises/.test(p)&&r.words>=350],
      ['Specific problem or use case',/problem|pest|bed bug|cockroach|rodent|termite|repair|installation|cleaning|inspection|treatment|maintenance|solar|cctv/.test(p)],
      ['Process explained',/inspect|inspection|assess|assessment|prepare|preparation|treat|treatment|process|step|follow.?up|aftercare|book|booking/.test(p)],
      ['Pricing or quote logic',/ksh|price|pricing|cost|quote|quotation|rate|budget|depends on|inspection first/.test(p)],
      ['Local relevance',/nairobi|kenya|mombasa|nakuru|eldoret|kiambu|thika|naivasha|machakos|limuru|ruiru|county|estate|area/.test(p)],
      ['Safety, trust or limitations',/safe|safety|trained|licensed|guarantee|warranty|inspection|protect|children|pets|limitations|not suitable/.test(p)],
      ['FAQ / objections',/faq|frequently asked|common questions|how long|how much|is it safe|what should i/.test(p)],
      ['Clear next step',/whatsapp|book now|request|call|contact|schedule|quote|enquir|message|add to cart/.test(p)],
      ['Useful internal connections',Array.from(r.doc.querySelectorAll('a[href]')).filter(function(a){var u=a.getAttribute('href')||'';return u.startsWith('/')||u.indexOf(SITE)===0;}).length>=3],
      ['Useful depth',r.words>=650&&r.h2>=4]
    ];
    tests.forEach(function(x){if(!x[1]){missing.push(x[0]);score-=10;}});
    if(score<0)score=0;
    var sections=service?[
      ['1. The problem and who we help','Open with the customer problem in plain language. State genuine property types and genuine service areas only.'],
      ['2. Problems covered','Name the specific pests/issues customers recognise. Explain signs, impact and when professional help is appropriate.'],
      ['3. How the service works','Explain inspection, preparation, treatment, access, re-entry and follow-up using only the real operating process.'],
      ['4. Pricing and what changes the quote','Show a verified starting/range price or explain the real factors: property size, severity, treatment type, location and follow-up.'],
      ['5. Safety and preparation','Give practical preparation and safety information supported by the actual service. Never invent chemical, dosage or guarantee claims.'],
      ['6. Evidence and trust','Add genuine photos, case studies, reviews, qualifications or approvals only when evidence exists.'],
      ['7. FAQs that remove hesitation','Answer preparation, timing, safety, price, follow-up, service area and prevention questions.'],
      ['8. Strong booking path','Make the next action obvious: WhatsApp, call, quote request or booking, with the information needed for a useful quote.'],
      ['9. Related resources','Link to the most relevant guide, related service and useful product/category page.']
    ]:[
      ['1. Search intent first','Answer the main question immediately, then build depth around the reader’s decision.'],
      ['2. What this product/service is for','Explain the exact job, buyer and suitability. Avoid empty “premium/best quality” language.'],
      ['3. Verified details','Use confirmed specifications, inclusions, compatibility, sizes, prices and availability. Unknown facts become [VERIFY] rather than guesses.'],
      ['4. How to choose','Give decision criteria, trade-offs and who should choose each option.'],
      ['5. Safety and limitations','Explain relevant precautions and boundaries using verified information.'],
      ['6. FAQs and objections','Answer the questions that would otherwise make the customer search again.'],
      ['7. Next step','Give one clear action and connect to a relevant page.']
    ];
    return {service:service,score:score,missing:missing,sections:sections};
  }
  function draft(r,m){
    var name=r.title||'this service';
    var intro='## '+name+'\n\n'+(r.desc||'Start with a direct explanation of what the customer can get and who it is for.')+'\n\n';
    var out=intro;
    m.sections.forEach(function(s){out+='### '+s[0].replace(/^\d+\. /,'')+'\n\n'+s[1]+'\n\n';});
    out+='### Facts to verify before publishing\n\n'+(m.missing.length?m.missing.map(function(x){return '- [VERIFY] '+x;}).join('\n'):'- Confirm current price, service areas, process, safety details and proof before publication.')+'\n\n';
    out+='### Editorial standard\n\nWrite for a real customer first. Be specific, useful and locally relevant. Remove repetition. Do not invent prices, locations, reviews, guarantees, qualifications, chemical claims or results.';
    return out;
  }
  function styles(){if(document.getElementById('sd-master-css'))return;var s=n('style');s.id='sd-master-css';s.textContent='.sdm-head{display:flex;justify-content:space-between;gap:.7rem;flex-wrap:wrap}.sdm-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.55rem;margin:.8rem 0}@media(min-width:760px){.sdm-grid{grid-template-columns:repeat(4,1fr)}}.sdm-k,.sdm-panel{background:#fff;border:1px solid var(--ln);border-radius:13px;padding:.8rem;margin:.55rem 0}.sdm-k small{display:block;color:var(--mu);font-size:.7rem;font-weight:800;text-transform:uppercase}.sdm-k b{font-size:1.3rem}.sdm-btn{border:0;border-radius:9px;background:#5b21b6;color:#fff;padding:.62rem .85rem;font:inherit;font-weight:800;cursor:pointer}.sdm-btn.alt{background:#eeeaf7;color:#30264a}.sdm-btn.ok{background:#15803d}.sdm-actions{display:flex;gap:.45rem;flex-wrap:wrap}.sdm-row{border-top:1px solid var(--ln);padding:.75rem 0}.sdm-row:first-child{border-top:0}.sdm-muted{color:var(--mu);font-size:.85rem}.sdm-bad{color:#b45309}.sdm-good{color:#15803d}.sdm-tag{display:inline-block;padding:.15rem .5rem;border-radius:999px;background:#fff7ed;color:#9a3412;font-size:.72rem;font-weight:800;margin:.15rem}.sdm-text{width:100%;min-height:300px;padding:.8rem;border:1px solid var(--ln);border-radius:10px;font:inherit;line-height:1.55}.sdm-select{width:100%;padding:.65rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff}';document.head.appendChild(s);}
  function mount(host){
    styles();host.textContent='';var panel=n('section','sdm-panel'),head=n('div','sdm-head'),title=n('div');title.appendChild(n('h3',null,'SEO Doctor · Masterpiece Content Studio'));title.appendChild(n('p','sdm-muted','Technical SEO is only the floor. This mode measures whether the page is genuinely useful, commercially clear and locally relevant, then builds an editorial blueprint and draft without inventing facts.'));var actions=n('div','sdm-actions'),scanBtn=n('button','sdm-btn','Scan site content');scanBtn.type='button';actions.appendChild(scanBtn);head.append(title,actions);panel.appendChild(head);
    var grid=n('div','sdm-grid');panel.appendChild(grid);var status=n('p','sdm-muted','Ready. Scan service and blog pages to find the weakest content first.');panel.appendChild(status);var results=n('div','sdm-panel');results.appendChild(n('p','sdm-muted','No scan yet.'));panel.appendChild(results);host.appendChild(panel);
    var rows=[];
    function k(label,value){var x=n('div','sdm-k');x.appendChild(n('small',null,label));x.appendChild(n('b',null,String(value)));grid.appendChild(x);}
    function show(r){
      results.textContent='';var m=contentModel(r),box=n('div','sdm-panel');box.appendChild(n('h3',null,r.title||r.url));box.appendChild(n('p','sdm-muted',r.url+' · '+r.words+' words · '+m.score+'/100 content score'));
      r.issues.forEach(function(x){box.appendChild(n('div','sdm-bad','Technical: '+x));});if(!r.issues.length)box.appendChild(n('div','sdm-good','✓ Technical baseline passed in this scan'));
      if(m.missing.length){box.appendChild(n('p','sdm-muted','Masterpiece gaps:'));m.missing.forEach(function(x){box.appendChild(n('span','sdm-tag',x));});}else box.appendChild(n('div','sdm-good','✓ Strong content coverage detected'));
      var d=n('details');d.appendChild(n('summary',null,'Open Masterpiece blueprint'));m.sections.forEach(function(s){var q=n('div','sdm-row');q.appendChild(n('b',null,s[0]));q.appendChild(n('p','sdm-muted',s[1]));d.appendChild(q);});
      var build=n('button','sdm-btn ok','Build masterpiece draft');build.type='button';build.onclick=function(){editor.value=draft(r,m);editor.scrollIntoView({behavior:'smooth',block:'center'});};d.appendChild(build);box.appendChild(d);results.appendChild(box);
    }
    var editorPanel=n('div','sdm-panel'),sel=n('select','sdm-select');sel.appendChild(n('option',null,'Choose a scanned page'));editorPanel.appendChild(n('h3',null,'Draft editor'));editorPanel.appendChild(n('p','sdm-muted','This is an editorial draft. It deliberately marks unknown facts as VERIFY instead of making them up. Review before publishing.'));editorPanel.appendChild(sel);var editor=document.createElement('textarea');editor.className='sdm-text';editor.placeholder='Your Masterpiece draft will appear here…';editorPanel.appendChild(editor);var ea=n('div','sdm-actions');var copy=n('button','sdm-btn alt','Copy draft');copy.type='button';copy.onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(editor.value).then(function(){copy.textContent='Copied ✓';setTimeout(function(){copy.textContent='Copy draft';},1200);});};ea.appendChild(copy);editorPanel.appendChild(ea);panel.appendChild(editorPanel);
    sel.onchange=function(){var r=rows[Number(sel.value)];if(r){var m=contentModel(r);editor.value=draft(r,m);show(r);}};
    scanBtn.onclick=async function(){scanBtn.disabled=true;status.textContent='Discovering service and blog pages…';results.textContent='';grid.textContent='';rows=[];try{var urls=[];for(var path of ['/services/','/blog/']){var res=await fetch(path,{cache:'no-store'});if(!res.ok)continue;var d=new DOMParser().parseFromString(await res.text(),'text/html');Array.from(d.querySelectorAll('a[href]')).forEach(function(a){try{var u=new URL(a.getAttribute('href'),SITE);if(u.origin===SITE&&(/\/services\/[^/]+\.html$/.test(u.pathname)||/\/blog\/[^/]+\.html$/.test(u.pathname)))urls.push(u.href);}catch(_){}});}urls=[...new Set(urls)];status.textContent='Scanning '+urls.length+' pages…';for(var i=0;i<urls.length;i++){try{var rres=await fetch(urls[i],{cache:'no-store'});if(!rres.ok)continue;var r=scan(await rres.text(),urls[i]);rows.push(r);}catch(_){}status.textContent='Scanned '+(i+1)+' of '+urls.length+' pages…';}rows.sort(function(a,b){return contentModel(a).score-contentModel(b).score;});k('Pages',rows.length);k('Needs improvement',rows.filter(function(r){return contentModel(r).score<80;}).length);k('Technical issues',rows.reduce(function(x,r){return x+r.issues.length;},0));k('Average content',rows.length?Math.round(rows.reduce(function(x,r){return x+contentModel(r).score;},0)/rows.length):0);results.textContent='';if(!rows.length){results.appendChild(n('p','sdm-muted','No service/blog pages found.'));return;}rows.forEach(function(r,i){var row=n('div','sdm-row'),m=contentModel(r),b=n('button','sdm-btn alt',(m.score<80?'Improve':'Review')+' · '+m.score+'/100 · '+r.title);b.type='button';b.onclick=function(){show(r);sel.value=String(i);editor.value=draft(r,m);};row.appendChild(b);row.appendChild(n('p','sdm-muted',r.url+' · '+r.words+' words · '+(r.issues.length?'technical issues: '+r.issues.length:'technical baseline OK')));results.appendChild(row);});}catch(e){results.appendChild(n('p','sdm-bad','Scan failed: '+e.message));}finally{scanBtn.disabled=false;status.textContent='Scan complete. Start with the lowest content scores.';}};
  }
  window.STMSeoDoctor={mount:mount};
})();