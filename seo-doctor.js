/* Staff-only live product SEO scanner. Read-only: never edits or republishes product data. */
(function () {
  'use strict';
  var SITE = 'https://stermontarcade.co.ke';
  function node(tag, cls, value) { var n=document.createElement(tag); if(cls)n.className=cls; if(value!=null)n.textContent=value; return n; }
  function styles() {
    if(document.getElementById('seo-doc-css')) return;
    var s=node('style'); s.id='seo-doc-css'; s.textContent=[
      '.sd-head{display:flex;justify-content:space-between;gap:.7rem;align-items:center;flex-wrap:wrap}',
      '.sd-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin:.8rem 0}',
      '@media(min-width:760px){.sd-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}',
      '.sd-k{background:#fff;border:1px solid var(--ln);border-radius:12px;padding:.7rem}.sd-k small{display:block;color:var(--mu);font-size:.72rem;font-weight:700;text-transform:uppercase}.sd-k b{font-size:1.25rem}',
      '.sd-panel{background:#fff;border:1px solid var(--ln);border-radius:13px;padding:.85rem;margin:.65rem 0}',
      '.sd-actions{display:flex;gap:.5rem;flex-wrap:wrap}.sd-btn{border:0;border-radius:9px;background:#5b21b6;color:#fff;padding:.65rem .9rem;font:inherit;font-weight:700}.sd-btn.alt{background:#eeeaf7;color:#30264a}.sd-btn:disabled{opacity:.5}',
      '.sd-progress{height:9px;background:#eeeaf7;border-radius:9px;overflow:hidden}.sd-progress span{display:block;height:100%;width:0;background:#7c3aed;transition:width .15s}',
      '.sd-item{border-top:1px solid var(--ln);padding:.7rem 0}.sd-item:first-child{border:0}.sd-item a{overflow-wrap:anywhere}.sd-issue{font-size:.84rem;color:#9a3412;margin:.2rem 0}.sd-ok{color:#15803d}.sd-muted{color:var(--mu);font-size:.85rem}',
      '.sd-tag{display:inline-block;border-radius:999px;padding:.12rem .5rem;background:#fff7ed;color:#9a3412;font-size:.72rem;font-weight:700;margin:.1rem .2rem .1rem 0}',
      '.sd-filter{padding:.55rem .7rem;border:1px solid var(--ln);border-radius:9px;font:inherit;max-width:100%;width:100%}'
    ].join(''); document.head.appendChild(s);
  }
  function extract(html, url) {
    var d=new DOMParser().parseFromString(html,'text/html'), issues=[];
    var title=(d.querySelector('title')?.textContent||'').trim();
    var desc=(d.querySelector('meta[name="description"]')?.getAttribute('content')||'').trim();
    var canon=d.querySelector('link[rel~="canonical"]')?.getAttribute('href')||'';
    var h1=d.querySelectorAll('h1'), imgs=Array.from(d.images), descNode=d.querySelector('.desc');
    var plain=(descNode?.textContent||'').replace(/\s+/g,' ').trim();
    if(!title)issues.push('Missing title'); else if(title.length<25||title.length>65)issues.push('Title length '+title.length+' chars (target 25–65)');
    if(!desc)issues.push('Missing meta description'); else if(desc.length<70||desc.length>165)issues.push('Meta description length '+desc.length+' chars (target 70–165)');
    if(!canon)issues.push('Missing canonical URL'); else {try{var c=new URL(canon,SITE);if(c.origin!==SITE||c.pathname!==new URL(url).pathname)issues.push('Canonical does not match this product URL');}catch(_){issues.push('Invalid canonical URL');}}
    if(h1.length!==1)issues.push('Expected one H1; found '+h1.length);
    if(!d.querySelector('meta[property="og:title"]'))issues.push('Missing Open Graph title');
    if(!d.querySelector('meta[property="og:image"]'))issues.push('Missing Open Graph image');
    if(!d.querySelector('script[type="application/ld+json"]'))issues.push('Missing structured data');
    else Array.from(d.querySelectorAll('script[type="application/ld+json"]')).forEach(function(sc){try{JSON.parse(sc.textContent);}catch(_){issues.push('Invalid JSON-LD');}});
    if(!imgs.length)issues.push('No product image'); else if(imgs.every(function(im){return !im.getAttribute('alt')||!im.getAttribute('alt').trim();}))issues.push('Product images have no descriptive alt text');
    if(plain.length<100)issues.push('Product description is missing or very short');
    if(plain.length>0&&plain.split(/\s+/).length<35)issues.push('Product description has fewer than 35 words');
    return {url:url,title:title,desc:desc,issues:issues};
  }
  function intentBrief(r) {
    var d=r.doc, product=r.kind==='product', text=(d.body?.innerText||'').toLowerCase();
    var title=r.title||'this product or service';
    var pest=/termite|cockroach|bed.?bug|fumig|rodent|rat|mosquito|insect|pest|spray|poison|bait/.test((title+' '+r.url).toLowerCase());
    var sections=[];
    if(product){
      sections=[
        ['Match the product to the buyer’s need','Explain the problem or job this exact model/product is designed for. State who it suits and who should choose another option. Avoid generic “best quality” claims.'],
        ['Verified specifications and what is included','List only confirmed active ingredient/model, pack size, dimensions, material, compatibility, included accessories and manufacturer details that are present in the catalogue or authoritative source. Mark unknown details “confirm before ordering”.'],
        ['How to choose the right size or variant','Compare available pack sizes/variants and explain the decision factors. Do not invent coverage, dosage, performance or suitability.'],
        ['Use, safety and limitations','For regulated pest-control products, summarise label-led use, PPE, storage, restrictions and when to use a qualified professional. Never provide unverified dosage or application claims.'],
        ['Price, availability and delivery in Kenya','Show current listed price, stock status, payment options and delivery terms exactly as the store currently supports them.'],
        ['Purchase confidence and next step','Answer the main pre-purchase objection, link to a relevant guide/category and provide a clear Add to cart / WhatsApp product question CTA.'],
        ['Buyer FAQs','Add 3–5 genuine questions about compatibility, pack size, delivery, authenticity/registration where verified, returns and safe use.']
      ];
    } else {
      sections=[
        ['Name the service and location clearly','Use a specific service + town/neighbourhood phrase only where the business genuinely accepts bookings. Example pattern: “Bed Bug Control in [Town]”.'],
        ['Describe the buyer’s situation','Address the urgent problem and property type: homes, apartments, hotels, schools, offices, restaurants or warehouses only where the team can serve them.'],
        ['Explain the assessment and treatment process','Describe inspection, treatment options, preparation, access requirements, re-entry guidance and follow-up. Confirm operational details with the owner before publishing.'],
        ['Show safety, scope and limitations','Explain what is and is not included, precautions for children/pets/food premises, and when a site assessment is needed. Do not promise total or permanent elimination.'],
        ['Make commercial intent easy to act on','Add a prominent call/WhatsApp/request-a-quote CTA, the information needed for a quote (pest, property type, town, approximate size, urgency) and response expectations only if confirmed.'],
        ['Build trust with verifiable evidence','Use real project photos, dated case studies, genuine reviews, team qualifications and applicable approvals only when evidence exists. Never fabricate these.'],
        ['Answer service-specific FAQs','Cover preparation, treatment duration, re-entry, follow-up, pricing factors, service area and prevention. Keep answers accurate to the actual service.']
      ];
    }
    var missing=[];
    var checks=[
      ['Problem-led explanation',/problem|sign|infestation|symptom|use case|suitable for/.test(text)],
      ['Specific audience or suitability',/home|household|hotel|school|office|warehouse|farm|property|buyer|model|size/.test(text)],
      ['How it works / what is included',/how to|includes|included|process|treatment|application|feature|specification/.test(text)],
      ['Safety, limitations or compatibility',/safety|warning|precaution|ppe|label|compatible|limitation|not suitable/.test(text)],
      ['Price, delivery or booking details',/ksh|price|delivery|m-pesa|whatsapp|book|quote|availability/.test(text)],
      ['Useful FAQs',/frequently asked|faq|<h[23][^>]*>.*\?/.test(r.html.toLowerCase())],
      ['Relevant internal next step',Array.from(d.querySelectorAll('a[href]')).some(function(a){return /cart|whatsapp|contact|quote|category|guide|product/i.test((a.href||'')+' '+(a.textContent||''));})]
    ];
    checks.forEach(function(c){if(!c[1])missing.push(c[0]);});
    if(pest&&product)missing.push('Pest-product-specific guidance: verified label/registration information and when a professional applicator is appropriate');
    return {sections:sections,missing:missing,score:Math.round((checks.length-missing.filter(function(x){return checks.some(function(c){return c[0]===x;});}).length)/checks.length*100)};
  }
  function mount(host) {
    styles(); host.textContent='';
    var panel=node('section','sd-panel'), head=node('div','sd-head');
    var intro=node('div'); intro.appendChild(node('h3','','Live SEO & high-intent content Doctor'));intro.appendChild(node('p','sd-muted','Audits product pages and service landing pages. Content briefs are inspired by strong competitor page structures—not copied—and are based on buyer intent. Read-only: nothing is edited or published.'));
    var actions=node('div','sd-actions'), run=node('button','sd-btn','Scan products & services'), catalog=node('a','sd-btn alt','Open product catalog');run.type='button';catalog.href='/admin.html#catalog';actions.append(run,catalog);head.append(intro,actions);panel.appendChild(head);
    var note=node('p','sd-muted','A technical SEO pass is not enough. The Doctor also checks whether a page answers the buyer’s real questions, explains suitability, reduces purchase risk and gives a clear next step. It will flag facts that need your confirmation rather than making them up.');panel.appendChild(note);
    var status=node('p','sd-muted','Ready. Start a scan to inspect your live product pages and linked service pages.');panel.appendChild(status);
    var bar=node('div','sd-progress');bar.appendChild(node('span'));panel.appendChild(bar);
    var grid=node('div','sd-grid');panel.appendChild(grid);
    var controls=node('div','sd-panel');var filter=node('select','sd-filter');[['all','All pages'],['issues','Pages needing work'],['clean','No detected issues']].forEach(function(x){var o=node('option','',x[1]);o.value=x[0];filter.appendChild(o);});controls.appendChild(filter);panel.appendChild(controls);
    var results=node('div','sd-panel');results.appendChild(node('p','sd-muted','Scan results will appear here.'));panel.appendChild(results);host.appendChild(panel);
    var rows=[],busy=false;
    function draw(){
      var shown=rows.filter(function(r){return filter.value==='all'||(filter.value==='issues'?(r.issues.length||r.brief.missing.length):(!r.issues.length&&!r.brief.missing.length));});
      results.textContent='';
      if(!shown.length){results.appendChild(node('p','sd-muted',rows.length?'No pages match this filter.':'No scan results yet.'));return;}
      shown.forEach(function(r){
        var item=node('div','sd-item'),a=node('a','',r.title||r.url);a.href=r.url;a.target='_blank';a.rel='noopener';item.appendChild(a);
        item.appendChild(node('div','sd-muted',(r.kind==='product'?'PRODUCT':'SERVICE')+' · '+r.url));
        r.issues.forEach(function(x){item.appendChild(node('div','sd-issue','Technical: '+x));});
        if(!r.issues.length)item.appendChild(node('div','sd-ok','✓ No technical issue detected by these checks'));
        var summary=node('p','sd-muted','High-intent content coverage: '+r.brief.score+'% · '+r.brief.missing.length+' content gaps');item.appendChild(summary);
        r.brief.missing.forEach(function(x){var tag=node('span','sd-tag','Needs content: '+x);item.appendChild(tag);});
        var details=node('details');var summary2=node('summary','','Open content brief for this page');details.appendChild(summary2);
        details.appendChild(node('p','sd-muted','Use these as an editorial brief. Verify every product specification, treatment method, service area, price, guarantee and regulatory claim before publishing.'));
        r.brief.sections.forEach(function(sec){var block=node('div','sd-item');block.appendChild(node('b','',sec[0]));block.appendChild(node('p','sd-muted',sec[1]));details.appendChild(block);});
        var copy=node('button','sd-btn alt','Copy content brief');copy.type='button';copy.onclick=function(){var out=[r.title,r.url,'CONTENT GAPS: '+r.brief.missing.join(', '),''].concat(r.brief.sections.map(function(x){return x[0]+'\n'+x[1];})).join('\n\n');if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(out).then(function(){copy.textContent='Copied';}).catch(function(){copy.textContent='Copy unavailable';});}else copy.textContent='Copy unavailable';};details.appendChild(copy);item.appendChild(details);results.appendChild(item);
      });
    }
    filter.onchange=draw;
    run.onclick=async function(){
      if(busy)return;busy=true;run.disabled=true;rows=[];grid.textContent='';results.textContent='';status.textContent='Loading product sitemap…';bar.firstChild.style.width='0%';
      try{
        var urls=[],sm=await fetch('/sitemap-products.xml',{cache:'no-store'});if(!sm.ok)throw Error('Could not load product sitemap ('+sm.status+').');
        var xml=new DOMParser().parseFromString(await sm.text(),'application/xml');if(xml.querySelector('parsererror'))throw Error('Product sitemap is not valid XML.');
        urls=Array.from(xml.querySelectorAll('loc')).map(function(n){return n.textContent.trim();}).filter(function(u){try{return new URL(u).origin===SITE&&new URL(u).pathname.startsWith('/p/');}catch(_){return false;}}).map(function(u){return {url:u,kind:'product'};});
        try{var hub=await fetch('/services/',{cache:'no-store'});if(hub.ok){var hd=new DOMParser().parseFromString(await hub.text(),'text/html');Array.from(hd.querySelectorAll('a[href]')).forEach(function(a){try{var u=new URL(a.getAttribute('href'),SITE);if(u.origin===SITE&&u.pathname.startsWith('/services/')&&u.pathname.endsWith('.html'))urls.push({url:u.href,kind:'service'});}catch(_){}});}}catch(_){}
        var seen={};urls=urls.filter(function(x){if(seen[x.url])return false;seen[x.url]=true;return true;});if(!urls.length)throw Error('No product or service URLs found.');
        status.textContent='Scanning '+urls.length+' pages…';var done=0,failed=0,dupes={};
        for(var i=0;i<urls.length;i+=4){
          var batch=urls.slice(i,i+4);
          var got=await Promise.all(batch.map(async function(entry){try{var res=await fetch(entry.url,{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);var html=await res.text(),doc=new DOMParser().parseFromString(html,'text/html');var r=extract(html,entry.url);r.kind=entry.kind;r.html=html;r.doc=doc;r.brief=intentBrief(r);return r;}catch(e){failed++;var x={url:entry.url,title:'Could not scan page',desc:'',issues:['Scan failed: '+e.message],kind:entry.kind,html:'',doc:document,brief:{score:0,missing:['Page could not be inspected'],sections:[]}};return x;}}));
          rows.push.apply(rows,got);got.forEach(function(r){if(r.title){var k=r.title.toLowerCase();dupes[k]=(dupes[k]||[]).concat(r.url);}});
          done=Math.min(i+batch.length,urls.length);bar.firstChild.style.width=(done/urls.length*100)+'%';status.textContent='Scanned '+done+' of '+urls.length+' pages…';
        }
        Object.keys(dupes).forEach(function(k){if(dupes[k].length>1)dupes[k].forEach(function(url){var r=rows.find(function(x){return x.url===url;});if(r)r.issues.push('Duplicate page title shared by '+dupes[k].length+' pages');});});
        var issueCount=rows.filter(function(r){return r.issues.length||r.brief.missing.length;}).length,productCount=rows.filter(function(r){return r.kind==='product';}).length,serviceCount=rows.filter(function(r){return r.kind==='service';}).length;
        [['Pages scanned',rows.length],['Products',productCount],['Service pages',serviceCount],['Pages needing work',issueCount]].forEach(function(x){var k=node('div','sd-k');k.appendChild(node('small','',x[0]));k.appendChild(node('b','',String(x[1])));grid.appendChild(k);});
        status.textContent='Scan complete: '+productCount+' products and '+serviceCount+' linked service pages checked. '+issueCount+' pages have technical or content gaps. '+failed+' scan failures.';
        draw();
      }catch(e){status.textContent=e.message||'SEO scan failed.';}
      finally{busy=false;run.disabled=false;}
    };
  }
  window.STMSeoDoctor={mount:mount};
})();
