(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const WA = '254748888230';

const S = [
{ c: 'Pest control and fumigation', items: [
{ id: 'bed-bugs', n: 'Bed bug eradication', d: 'Bed bugs hide in mattress seams, bed frames, skirting and sockets, so a single spray rarely finishes the job. We combine thermal heat with a non-staining chemical treatment that reaches adults, nymphs and eggs, then plan follow-up visits so the full egg-to-nymph cycle is covered. Every treatment carries our 90-day guarantee.', b: ['Heat and chemical treatment combined', 'Non-staining on fabric, wood and walls', 'Targets eggs, nymphs and adults', '90-day guarantee'], q: 'Will I need to throw away my mattress?', a: 'Usually not. Treatment reaches seams, frames and cracks, and we tell you honestly if an item is too badly infested to save.' },
{ id: 'cockroaches', n: 'Cockroach gel baiting and barrier sprays', d: 'A low-odour gel bait is placed in the cracks, hinges and corners where cockroaches nest: behind kitchen cabinets, around drains and inside appliance gaps. Roaches feed on it and carry it back to the colony. A barrier spray on entry points keeps new ones out. Most homes and kitchens do not need to be evacuated.', b: ['Low-odour gel, applied in cracks away from food', 'Targets kitchen nests, drains and appliances', 'No evacuation needed in most cases', 'Barrier spray on entry points'], q: 'How soon will I stop seeing cockroaches?', a: 'You may see a few more at first as the colony feeds on the bait. Numbers drop over the following days, and we advise on a follow-up visit if needed.' },
{ id: 'termites', n: 'Termite pre- and post-construction treatment', d: 'Termites damage roofs, door frames and furniture long before they are seen. For new builds we lay an anti-termite soil barrier before the slab is cast. For existing buildings we use chemical trenching, wall injection and treatment of structural timber to stop active colonies and protect the wood.', b: ['Soil barrier before construction', 'Chemical trenching and wall injection', 'Structural wood protection', 'Inspection before we quote'], q: 'Can termites be treated after the house is built?', a: 'Yes. We trench around the foundation, inject affected walls and treat timber. An inspection first shows how far the colony has spread.' },
{ id: 'rodents', n: 'Rodent control and exclusion', d: 'Killing rats is only half of the work; they return if they can still get in. We place tamper-resistant bait stations, seal gaps around pipes, roofs and doors, and audit sanitation so food and waste stop attracting them.', b: ['Tamper-resistant bait stations', 'Entry points sealed', 'Sanitation audit with advice', 'Safe placement around children and pets'], q: 'Why seal entry points as well?', a: 'Baiting removes the rodents that are there now. Sealing stops the next group from coming in.' },
{ id: 'upholstery', n: 'Sofa, carpet and mattress disinfection', d: 'Fabric traps dust mites, bacteria and odours. We use extraction cleaning to pull dirt out, steam to sanitise, and an anti-allergen deodorising finish so sofas, carpets and mattresses are fresher and healthier to use.', b: ['Extraction cleaning', 'Steam sanitisation', 'Anti-allergen deodorising', 'Suitable for homes, offices and Airbnbs'], q: 'How long until the sofa is dry?', a: 'Extraction leaves fabric damp, and drying time depends on the material and airflow. We tell you what to expect for your items.' }
] },
{ c: 'Deep cleaning and facility management', items: [
{ id: 'move-in-out', n: 'Move-in and move-out deep cleaning', d: 'We clean empty properties from top to bottom: scrubbed tile grout, deep-cleaned cabinets inside and out, descaled and sanitised sanitaryware, and wiped doors, switches and windows. Ideal before you move in or when handing a house back to a landlord.', b: ['Grout scrubbed and tiles restored', 'Cabinets cleaned inside and out', 'Sanitaryware descaled and sanitised', 'Good for deposit handovers'], q: 'Do you bring your own equipment?', a: 'Yes. Our team brings cleaning equipment and products. You only need to make sure we can get water and power.' },
{ id: 'post-construction', n: 'Post-construction cleaning', d: 'After building or renovation, cement splashes, paint stains and fine dust cover everything. We remove cement residue, scrape paint from glass and floors, wash windows, and extract dust so the property is ready for handover.', b: ['Cement residue removal', 'Paint stain scraping', 'Window washing', 'Dust extraction'], q: 'Can you clean before the final paint touch-up?', a: 'Yes, but a final pass after touch-ups gives the best finish. We can plan two visits.' },
{ id: 'airbnb', n: 'Airbnb and furnished apartment turnover', d: 'Between guests there is little time. We do express sanitisation of bathrooms, kitchens and bedrooms, replace linen, restock essentials and check every detail so the apartment is guest-ready for the next check-in.', b: ['Express turnaround between guests', 'Linen replenishment', 'Bathroom and kitchen sanitisation', 'Guest-ready detailing'], q: 'Can you work to our check-in times?', a: 'Tell us your check-out and check-in times when you book, and we schedule around them.' },
{ id: 'office-janitorial', n: 'Commercial office janitorial services', d: 'A clean office supports health and first impressions. We run scheduled maintenance for floors, washrooms, kitchenettes and workstations, with floor polishing and regular sanitisation of high-touch points such as door handles and lift buttons.', b: ['Daily, weekly or monthly schedules', 'Floor polishing', 'High-touch sanitisation', 'Washroom and kitchenette care'], q: 'Can cleaning happen after office hours?', a: 'Yes. Many clients choose early mornings or evenings so staff are not disturbed.' }
] },
{ c: 'Smart home, security and technical setup', items: [
{ id: 'cctv', n: 'CCTV camera and DVR installation', d: 'We install night-vision IP and analogue cameras, run neat conduit cabling, configure the DVR or NVR with a suitably sized hard drive, and set up remote viewing so you can watch live footage from your smartphone anywhere.', b: ['Night-vision cameras', 'Remote smartphone viewing', 'Conduit cabling', 'Hard drive storage configured for you'], q: 'Can I watch the cameras when I am away?', a: 'Yes. We set up the app on your phone and test the remote connection before we leave.' },
{ id: '4g-antenna', n: '4G and 5G router and high-gain antenna setup', d: 'Weak signal in rural and low-coverage areas is often fixed by a directional outdoor antenna. We align it to the best tower, route coaxial cable properly and tune the setup for a better signal-to-noise ratio (SINR), so speeds and stability improve.', b: ['Directional antenna alignment', 'Coaxial cable routing', 'SINR optimisation', 'Router configuration'], q: 'Will an antenna work if there is no signal at all?', a: 'An antenna improves a weak signal but cannot create one where no tower reaches. We check signal on site before installing.' },
{ id: 'electric-fence', n: 'Electric fence and solar perimeter lighting', d: 'We string high-voltage pulse wire along walls and gates, integrate an alarm, and install autonomous solar floodlights that switch on at dusk without needing grid power.', b: ['Pulse wire stringing', 'Alarm integration', 'Solar floodlights', 'Works through power outages'], q: 'Is an electric fence safe?', a: 'It is installed with warning signs and a pulsed energiser designed to deter, not harm. We explain safe use at handover.' },
{ id: 'inverter', n: 'Inverter and backup power setup', d: 'We size and install pure sine wave inverters and lithium battery banks for your load, and wire an automatic transfer switch (ATS) so power switches over the moment the grid goes down.', b: ['Pure sine wave inverters', 'Lithium battery bank sizing', 'Automatic transfer switch wiring', 'Load assessment before you buy'], q: 'How do you decide the battery size?', a: 'We add up the appliances you want to run and for how long, then size the battery and inverter to match.' }
] },
{ c: 'Home maintenance and repairs', items: [
{ id: 'plumbing', n: 'Plumbing and drainage unblocking', d: 'We clear blocked drains with high-pressure jetting, repair leaking pipes, connect instant showers and clean water tanks so water is safe and flowing again.', b: ['High-pressure drain jetting', 'Pipe leak repairs', 'Instant shower connections', 'Water tank cleaning'], q: 'Can you fix a leak inside a wall?', a: 'Often yes. We locate the pipe, repair it and tell you what finishing work the wall needs.' },
{ id: 'electrical', n: 'Electrical repairs and wiring', d: 'We troubleshoot tripping circuit breakers, rewire faulty sockets, update lighting fixtures and fit surge protection to help shield your appliances from power spikes.', b: ['Circuit breaker troubleshooting', 'Socket rewiring', 'Lighting fixture updates', 'Surge protection'], q: 'Why does my breaker keep tripping?', a: 'Common causes are an overloaded circuit, a faulty appliance or damaged wiring. We test each to find the cause.' }
] }
];

// Each hub item links to the landing page that holds the full 600+ word write-up, prices and FAQs.
// The 4G antenna item has no landing page yet, so it links to its guide on this page.
const PAGE = {
  'bed-bugs': 'pest-control-fumigation-nairobi', 'cockroaches': 'pest-control-fumigation-nairobi', 'termites': 'pest-control-fumigation-nairobi', 'rodents': 'pest-control-fumigation-nairobi',
  'upholstery': 'deep-cleaning-carpet-wash-nairobi', 'move-in-out': 'deep-cleaning-carpet-wash-nairobi', 'post-construction': 'deep-cleaning-carpet-wash-nairobi', 'airbnb': 'deep-cleaning-carpet-wash-nairobi', 'office-janitorial': 'deep-cleaning-carpet-wash-nairobi',
  'cctv': 'cctv-smart-security-installation-nairobi', 'electric-fence': 'cctv-smart-security-installation-nairobi',
  'inverter': 'solar-system-installation-kenya',
  'plumbing': 'electrical-plumbing-maintenance-nairobi', 'electrical': 'electrical-plumbing-maintenance-nairobi'
};
const more = id => PAGE[id]
  ? `<p><a href="/services/${PAGE[id]}.html">Read the full service page: prices, tenders, cities and FAQs</a></p>`
  : '<p><a href="#/blog/boost-weak-4g-5g-signal-rural-kenya">Read the full 4G and 5G signal guide</a></p>';

const A = [
{ slug: 'get-rid-of-bed-bugs-kenya', t: 'How to permanently get rid of bed bugs in Kenya: the ultimate chemical and heat treatment guide', x: 'Why one spray fails and how heat plus chemical treatment clears the whole life cycle.', h: `<h2>How to permanently get rid of bed bugs in Kenya</h2><p>Bed bugs travel in luggage, second-hand furniture and shared laundry, and they spread in flats, hostels and Airbnbs. Getting rid of them for good means treating every life stage.</p><h3>Signs you have bed bugs</h3><ul><li>Small red bites in lines on arms, neck or back</li><li>Tiny dark spots on sheets and mattress seams</li><li>A sweet, musty smell in heavy infestations</li></ul><h3>Why sprays alone fail</h3><p>Eggs are hard to reach and survive many sprays. Nymphs hatch days later and the cycle restarts.</p><h3>Heat plus chemical treatment</h3><p>Sustained heat penetrates mattresses and furniture where liquids cannot. A non-staining chemical treatment then covers cracks, frames and skirting. A follow-up visit catches nymphs that hatch afterwards.</p><h3>What you can do before we arrive</h3><ul><li>Wash bedding and clothes hot and dry them on high heat</li><li>Declutter around the bed</li><li>Do not move items to other rooms, which spreads bugs</li></ul><p>See our <a href="#svc-bed-bugs">bed bug eradication service</a> and <a href="#svc-upholstery">mattress disinfection</a>.</p><h3>Frequently asked questions</h3><h4>Can bed bugs live in a clean house?</h4><p>Yes. They feed on blood, not dirt, so cleanliness does not prevent them.</p><h4>How long before I can sleep in the room again?</h4><p>We tell you after the treatment based on the method used.</p>` },
{ slug: 'pest-control-restaurants-commercial-kitchens', t: 'Choosing the best pest control methods for restaurants and commercial kitchens', x: 'Gel baiting, exclusion and sanitation habits that keep kitchens inspection-ready.', h: `<h2>Pest control for restaurants and commercial kitchens</h2><p>Pests in a kitchen mean lost customers and possible closure by health inspectors. The best approach is prevention plus targeted treatment that does not contaminate food.</p><h3>Cockroach gel baiting</h3><p>Low-odour gel is placed in cracks, hinges and appliance gaps, away from food surfaces, so service can continue without evacuation. See <a href="#svc-cockroaches">cockroach gel baiting</a>.</p><h3>Rodent exclusion</h3><p>Tamper-resistant bait stations outside, and sealed gaps around pipes and doors, keep rats out. See <a href="#svc-rodents">rodent control</a>.</p><h3>Sanitation habits that matter</h3><ul><li>Cover and empty waste bins daily</li><li>Clear grease traps and floor drains regularly</li><li>Store dry goods off the floor in sealed containers</li><li>Fix dripping taps, since pests need water</li></ul><h3>Keep records</h3><p>Ask for a dated service report after every visit. It helps with inspections and shows what was treated.</p><h3>Frequently asked questions</h3><h4>How often should a restaurant be treated?</h4><p>Frequency depends on size and risk, and we recommend a schedule after inspecting your premises.</p><h4>Can the kitchen stay open?</h4><p>Often yes for gel baiting. We confirm before the visit.</p>` },
{ slug: 'boost-weak-4g-5g-signal-rural-kenya', t: 'How to boost weak 4G/5G internet signal in rural Kenya using outdoor antennas', x: 'Antenna choice, alignment and cable tips for better speeds where signal is weak.', h: `<h2>Boosting weak 4G and 5G signal in rural Kenya</h2><p>If your phone shows one bar, a router with an outdoor directional antenna can make a large difference by focusing on one tower.</p><h3>Check your signal first</h3><p>Look at SINR and signal strength on your router. Higher SINR means a cleaner signal and better speeds than raw bars alone.</p><h3>Choose a directional antenna</h3><p>High-gain directional antennas point at one tower. They work best when there is clear line of sight, so mount high, above roofs and trees.</p><h3>Alignment matters</h3><p>A small turn can change SINR noticeably. Adjust slowly and check the router after each change.</p><h3>Use good coaxial cable</h3><ul><li>Keep the cable run short, because long runs lose signal</li><li>Use weatherproof connectors outdoors</li><li>Avoid sharp bends</li></ul><p>Our team can handle this for you: <a href="#svc-4g-antenna">4G and 5G antenna setup</a>.</p><h3>Frequently asked questions</h3><h4>Will an antenna work with any router?</h4><p>It needs a router or modem with external antenna ports. We check this before installing.</p><h4>Can an antenna fix no signal?</h4><p>No. It improves weak signal but cannot reach where no tower covers.</p>` }
];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ALL = S.flatMap(c => c.items);

$('#catalog').innerHTML = S.map(c => `<h3>${esc(c.c)}</h3>` + c.items.map(i => `<details class="svc" id="svc-${i.id}"><summary>${esc(i.n)}</summary><p>${esc(i.d)}</p><ul>${i.b.map(x => `<li>${esc(x)}</li>`).join('')}</ul><h4>${esc(i.q)}</h4><p>${esc(i.a)}</p>${more(i.id)}<button class="btn" data-book="${i.id}">Book this service</button></details>`).join('')).join('');
$('#f-svc').innerHTML = '<option value="">Choose a service</option>' + ALL.map(i => `<option value="${i.id}">${esc(i.n)}</option>`).join('');

function route() {
  const h = location.hash, v = $('#blog-view');
  const m = h.match(/^#\/blog\/(.+)$/), post = m && A.find(a => a.slug === m[1]);
  if (post) {
    document.title = post.t + ' | Stermont Arcade';
    v.innerHTML = `<article class="post">${post.h}<p><a href="#/blog">Back to all guides</a></p></article>`;
    $('#blog').scrollIntoView();
  } else {
    document.title = 'Pest Control, Cleaning, CCTV and Repairs in Nairobi and Kitale | Stermont Arcade';
    v.innerHTML = `<ul class="post-list">${A.map(a => `<li><a href="#/blog/${a.slug}">${esc(a.t)}</a><p>${esc(a.x)}</p></li>`).join('')}</ul>`;
    if (h === '#/blog') $('#blog').scrollIntoView();
  }
  const s = h.match(/^#svc-(.+)$/);
  if (s && $('#svc-' + s[1])) { const d = $('#svc-' + s[1]); d.open = true; d.scrollIntoView(); }
}
addEventListener('hashchange', route);
route();

const sheet = $('#sheet'), scrim = $('#scrim'), form = $('#form');
let opener = null;
function openSheet(id, el) {
  opener = el; $('#f-svc').value = id || '';
  const t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
  $('#f-date').min = t.toISOString().slice(0, 10);
  sheet.hidden = scrim.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('open'));
  document.body.style.overflow = 'hidden';
  $('#f-svc').focus();
}
function closeSheet() {
  sheet.classList.remove('open'); document.body.style.overflow = '';
  setTimeout(() => { sheet.hidden = scrim.hidden = true; }, 250);
  if (opener) opener.focus();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-book]'); if (b) openSheet(b.dataset.book, b); });
$('#close').addEventListener('click', closeSheet);
scrim.addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

const RULES = {
  'f-svc': v => v ? '' : 'Choose the service you need.',
  'f-tier': v => v ? '' : 'Choose a package tier.',
  'f-town': v => v.trim().length >= 2 ? '' : 'Enter your town or estate.',
  'f-date': v => (v && v >= $('#f-date').min) ? '' : 'Pick today or a later date.',
  'f-slot': v => v ? '' : 'Choose a time slot.',
  'f-name': v => v.trim().length >= 2 ? '' : 'Enter your name.',
  'f-phone': v => /^(?:\+?254|0)[17]\d{8}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Enter a Kenyan number like 0712 345 678.'
};
function check(id) {
  const el = $('#' + id), msg = RULES[id](el.value);
  el.setAttribute('aria-invalid', String(!!msg)); $(`.err[data-for="${id}"]`).textContent = msg; return !msg;
}
Object.keys(RULES).forEach(id => $('#' + id).addEventListener('input', () => check(id)));
form.addEventListener('submit', e => {
  e.preventDefault();
  const bad = Object.keys(RULES).filter(id => !check(id));
  if (bad.length) { $('#' + bad[0]).focus(); return; }
  const svc = ALL.find(i => i.id === $('#f-svc').value).n, g = id => $('#' + id).value.trim();
  const text = `Hello Stermont Arcade, I would like to book: ${svc}\nTier: ${g('f-tier')}\nLocation: ${g('f-town')}\nDate: ${g('f-date')}, ${g('f-slot')}\nName: ${g('f-name')}\nM-Pesa number: ${g('f-phone')}`;
  window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  form.reset(); closeSheet();
});
})();
