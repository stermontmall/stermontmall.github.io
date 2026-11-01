/* SterMont private admin overview. Read-only; requires the existing authenticated staff session and RLS policies. */
(function () {
  'use strict';
  var D = document, TZ = 'Africa/Nairobi', root = null, busy = false;
  function el(tag, cls, txt) { var n = D.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function money(n) { return 'KSh ' + Math.round(Number(n || 0)).toLocaleString('en-KE'); }
  function date(d) { try { return new Date(d).toLocaleString('en-KE', {timeZone:TZ,day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); } catch (_) { return ''; } }
  function card(label, value, note, tone) {
    var c=el('div','ov-kp'+(tone?' '+tone:'')); c.appendChild(el('small','',label)); c.appendChild(el('b','',String(value))); if(note)c.appendChild(el('span','',note)); return c;
  }
  function link(label, hash, desc) {
    var a=el('a','ov-link'); a.href='/admin.html#'+hash; a.appendChild(el('b','',label)); a.appendChild(el('span','',desc)); return a;
  }
  function styles() {
    if(D.getElementById('ov-css'))return;
    var s=el('style');s.id='ov-css';s.textContent=[
      '.ov-head{display:flex;justify-content:space-between;align-items:center;gap:.7rem;flex-wrap:wrap;margin-bottom:.8rem}',
      '.ov-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;margin:.7rem 0 1rem}',
      '@media(min-width:760px){.ov-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}',
      '.ov-kp{background:#fff;border:1px solid var(--ln);border-radius:13px;padding:.75rem;min-width:0}',
      '.ov-kp small{display:block;color:var(--mu);font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}',
      '.ov-kp b{display:block;font-size:1.2rem;overflow-wrap:anywhere}.ov-kp span{display:block;color:var(--mu);font-size:.75rem;margin-top:.1rem}',
      '.ov-kp.hot{background:#5b21b6;color:#fff;border-color:#5b21b6}.ov-kp.hot small,.ov-kp.hot span{color:#e9ddff}',
      '.ov-cols{display:grid;grid-template-columns:1fr;gap:.7rem}@media(min-width:760px){.ov-cols{grid-template-columns:1fr 1fr}}',
      '.ov-panel{background:#fff;border:1px solid var(--ln);border-radius:14px;padding:.9rem;min-width:0}',
      '.ov-panel h3{font-size:1rem;margin:0 0 .65rem}.ov-row{display:flex;justify-content:space-between;gap:.5rem;padding:.45rem 0;border-bottom:1px solid var(--ln);font-size:.9rem}.ov-row:last-child{border:0}',
      '.ov-links{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}.ov-link{display:block;text-decoration:none;color:var(--tx);border:1px solid var(--ln);border-radius:12px;padding:.7rem;background:#fff}.ov-link b,.ov-link span{display:block}.ov-link span{font-size:.78rem;color:var(--mu);margin-top:.2rem}.ov-link:focus,.ov-link:hover{outline:2px solid #c4b5fd}',
      '.ov-muted{color:var(--mu);font-size:.84rem}.ov-refresh{border:0;border-radius:9px;padding:.55rem .85rem;background:#5b21b6;color:#fff;font:inherit;font-weight:600}'
    ].join('');D.head.appendChild(s);
  }
  function api(path) { return STMAdmin.ready().then(function(){return STMAdmin.api(path);}).then(function(r){if(r.status===401)throw Error('Your session expired. Sign in again.');if(!r.ok)throw Error('Could not load dashboard data ('+r.status+'). Check staff access and table policies.');return r.json();}); }
  function mount(host) {
    root=host;styles();host.textContent='';
    var head=el('div','ov-head');head.appendChild(el('div','','Private business overview'));
    var refresh=el('button','ov-refresh','Refresh data');refresh.type='button';head.appendChild(refresh);host.appendChild(head);
    var status=el('p','ov-muted','Loading private business totals…');host.appendChild(status);
    var grid=el('div','ov-grid');host.appendChild(grid);
    var cols=el('div','ov-cols');host.appendChild(cols);
    function draw() {
      if(busy)return;busy=true;refresh.disabled=true;status.textContent='Loading secure staff-only data…';
      var since=new Date(Date.now()-30*86400000).toISOString();
      Promise.all([
        api('/rest/v1/orders?select=status,subtotal,created_at&created_at=gte.'+encodeURIComponent(since)+'&order=created_at.desc&limit=5000'),
        api('/rest/v1/service_quotes?select=status,quote_amount,created_at&created_at=gte.'+encodeURIComponent(since)+'&order=created_at.desc&limit=5000')
      ]).then(function(data){
        if(root!==host)return;
        var orders=data[0],quotes=data[1], paid=orders.filter(x=>x.status==='paid'), pending=orders.filter(x=>x.status==='pending'), won=quotes.filter(x=>x.status==='won');
        var rev=paid.reduce((n,x)=>n+(Number(x.subtotal)||0),0), wonValue=won.reduce((n,x)=>n+(Number(x.quote_amount)||0),0);
        var now=new Date(), today=now.toLocaleDateString('en-CA',{timeZone:TZ});
        var todayOrders=orders.filter(x=>new Date(x.created_at).toLocaleDateString('en-CA',{timeZone:TZ})===today).length;
        var todayQuotes=quotes.filter(x=>new Date(x.created_at).toLocaleDateString('en-CA',{timeZone:TZ})===today).length;
        grid.textContent='';
        [[ 'Orders · 30 days',orders.length,'Received in the last 30 days',''],['Awaiting payment',pending.length,'Orders needing review',pending.length?'hot':''],['Confirmed sales',money(rev),paid.length+' confirmed orders',''],['Service enquiries',quotes.length,'New today: '+todayQuotes,''],['Won service quotes',won.length,money(wonValue)+' quoted value',''],['New orders today',todayOrders,'Kenya local date','']].forEach(x=>grid.appendChild(card(x[0],x[1],x[2],x[3])));
        cols.textContent='';
        var p=el('section','ov-panel');p.appendChild(el('h3','','Order pipeline'));
        [['Awaiting payment',pending.length],['Paid / confirmed',paid.length],['Declined',orders.filter(x=>x.status==='declined').length],['Other statuses',orders.filter(x=>!['pending','paid','declined'].includes(x.status)).length]].forEach(x=>{var r=el('div','ov-row');r.appendChild(el('span','',x[0]));r.appendChild(el('b','',String(x[1])));p.appendChild(r);});
        p.appendChild(el('p','ov-muted','Sales total counts paid orders only and uses stored order subtotals. Service quote value counts records marked won.'));cols.appendChild(p);
        var q=el('section','ov-panel');q.appendChild(el('h3','','Service enquiry pipeline'));
        ['new','contacted','quoted','won','lost'].forEach(st=>{var n=quotes.filter(x=>x.status===st).length,r=el('div','ov-row');r.appendChild(el('span','',st.charAt(0).toUpperCase()+st.slice(1)));r.appendChild(el('b','',String(n)));q.appendChild(r);});cols.appendChild(q);
        var quick=el('section','ov-panel');quick.style.marginTop='.7rem';quick.appendChild(el('h3','','Quick access'));var links=el('div','ov-links');
        [['Pending orders','pending','Review payments'],['All orders','all','Search and manage orders'],['Service enquiries','quotes','Contact and quote customers'],['Sales dashboard','sales','Sales trends and products'],['M-Pesa payments','mpesa','Match received payments'],['Stock','stock','Manage availability']].forEach(x=>links.appendChild(link(x[0],x[1],x[2])));quick.appendChild(links);host.appendChild(quick);
        status.textContent='Updated '+date(new Date())+' · Last 30 days · Private staff view';
      }).catch(function(e){if(root===host)status.textContent=e.message||'Could not load dashboard.';}).finally(function(){busy=false;refresh.disabled=false;});
    }
    refresh.onclick=draw;draw();
  }
  window.STMOverview={mount:mount};
})();