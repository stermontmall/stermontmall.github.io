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
  function mount(host) {
    styles(); host.textContent='';
    var panel=node('section','sd-panel'), head=node('div','sd-head');
    var intro=node('div'); intro.appendChild(node('h3','','Live product SEO scan'));intro.appendChild(node('p','sd-muted','Read-only scan of product URLs in your live product sitemap. It checks page-level SEO; it does not change prices, descriptions or publish anything.'));
    var actions=node('div','sd-actions'), run=node('button','sd-btn','Scan products'), catalog=node('a','sd-btn alt','Open product catalog');run.type='button';catalog.href='/admin.html#catalog';actions.append(run,catalog);head.append(intro,actions);panel.appendChild(head);
    var status=node('p','sd-muted','Ready. Start a scan to inspect your live product pages.');panel.appendChild(status);
    var bar=node('div','sd-progress');bar.appendChild(node('span'));panel.appendChild(bar);
    var grid=node('div','sd-grid');panel.appendChild(grid);
    var controls=node('div','sd-panel');var filter=node('select','sd-filter');[['all','All products'],['issues','Only products with issues'],['clean','No detected issues']].forEach(function(x){var o=node('option','',x[1]);o.value=x[0];filter.appendChild(o);});controls.appendChild(filter);panel.appendChild(controls);
    var results=node('div','sd-panel');results.appendChild(node('p','sd-muted','Scan results will appear here.'));panel.appendChild(results);host.appendChild(panel);
    var rows=[],busy=false;
    function draw(){
      var shown=rows.filter(function(r){return filter.value==='all'||(filter.value==='issues'?r.issues.length>0:r.issues.length===0);});
      results.textContent='';
      if(!shown.length){results.appendChild(node('p','sd-muted',rows.length?'No products match this filter.':'No scan results yet.'));return;}
      shown.forEach(function(r){
        var item=node('div','sd-item'),a=node('a','',r.title||r.url);a.href=r.url;a.target='_blank';a.rel='noopener';item.appendChild(a);
        item.appendChild(node('div','sd-muted',r.url));
        if(r.issues.length){r.issues.forEach(function(x){item.appendChild(node('div','sd-issue','• '+x));});}
        else item.appendChild(node('div','sd-ok','✓ No issues detected by these checks'));
        results.appendChild(item);
      });
    }
    filter.onchange=draw;
    run.onclick=async function(){
      if(busy)return;busy=true;run.disabled=true;rows=[];grid.textContent='';results.textContent='';status.textContent='Loading product sitemap…';bar.firstChild.style.width='0%';
      try{
        var sm=await fetch('/sitemap-products.xml',{cache:'no-store'});if(!sm.ok)throw Error('Could not load sitemap-products.xml ('+sm.status+').');
        var xml=new DOMParser().parseFromString(await sm.text(),'application/xml');if(xml.querySelector('parsererror'))throw Error('Product sitemap is not valid XML.');
        var urls=Array.from(xml.querySelectorAll('loc')).map(function(n){return n.textContent.trim();}).filter(function(u){try{return new URL(u).origin===SITE&&new URL(u).pathname.startsWith('/p/');}catch(_){return false;}});
        urls=Array.from(new Set(urls));if(!urls.length)throw Error('No product URLs found in sitemap.');
        status.textContent='Scanning '+urls.length+' product pages…';var done=0,failed=0,dupes={};
        for(var i=0;i<urls.length;i+=5){
          var batch=urls.slice(i,i+5);
          var got=await Promise.all(batch.map(async function(url){try{var res=await fetch(url,{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);return extract(await res.text(),url);}catch(e){failed++;return {url:url,title:'Could not scan page',desc:'',issues:['Scan failed: '+e.message]};}}));
          rows.push.apply(rows,got);got.forEach(function(r){if(r.title){var k=r.title.toLowerCase();dupes[k]=(dupes[k]||[]).concat(r.url);}});
          done=Math.min(i+batch.length,urls.length);bar.firstChild.style.width=(done/urls.length*100)+'%';status.textContent='Scanned '+done+' of '+urls.length+' product pages…';
        }
        Object.keys(dupes).forEach(function(k){if(dupes[k].length>1)dupes[k].forEach(function(url){var r=rows.find(function(x){return x.url===url;});if(r)r.issues.push('Duplicate product title shared by '+dupes[k].length+' pages');});});
        var issueCount=rows.filter(function(r){return r.issues.length;}).length;
        [['Products scanned',rows.length],['Pages with issues',issueCount],['No detected issues',rows.length-issueCount],['Scan failures',failed]].forEach(function(x){var k=node('div','sd-k');k.appendChild(node('small','',x[0]));k.appendChild(node('b','',String(x[1])));grid.appendChild(k);});
        status.textContent='Scan complete. '+issueCount+' of '+rows.length+' pages have items to review. Duplicate-title checks are included.';
        draw();
      }catch(e){status.textContent=e.message||'SEO scan failed.';}
      finally{busy=false;run.disabled=false;}
    };
  }
  window.STMSeoDoctor={mount:mount};
})();
