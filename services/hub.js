/* Stermont Arcade services hub: look-and-feel layer. Runs after app.js and shell-chrome.js (both deferred).
   1) puts an illustrated icon in front of every service in the accordion,
   2) on phones, turns the shell bottom nav's Deals slot into Services (this page) and un-highlights Account,
   3) adds a floating "Book a service" button that opens the existing booking sheet.
   To undo: remove the hub.js line from services/index.html. */
(() => {
'use strict';
const ICON = {
  'bed-bugs': 'pest', 'cockroaches': 'pest', 'termites': 'pest', 'rodents': 'pest',
  'upholstery': 'clean', 'move-in-out': 'clean', 'post-construction': 'clean', 'airbnb': 'clean', 'office-janitorial': 'clean',
  'cctv': 'cctv', '4g-antenna': 'antenna', 'electric-fence': 'fence', 'inverter': 'power',
  'plumbing': 'drop', 'electrical': 'elec'
};
const HUE = {
  pest: ['#6d28d9', '#a855f7'], clean: ['#0891b2', '#22d3ee'], cctv: ['#1d4ed8', '#60a5fa'], antenna: ['#4338ca', '#818cf8'],
  fence: ['#b45309', '#fbbf24'], power: ['#a16207', '#facc15'], drop: ['#0e7490', '#2dd4bf'], elec: ['#c2410c', '#fb923c']
};
try {
  document.querySelectorAll('details.svc[id^="svc-"] > summary').forEach(s => {
    const k = ICON[s.parentElement.id.slice(4)], h = k && HUE[k];
    if (!h || s.querySelector('.ico')) return;
    s.insertAdjacentHTML('afterbegin', '<svg class="ico" viewBox="0 0 48 48" style="--g1:' + h[0] + ';--g2:' + h[1] + '" aria-hidden="true"><use href="#i-' + k + '"/></svg>');
  });
} catch (e) {}
try {
  const nav = document.getElementById('stm-nav');
  if (nav) {
    const deals = nav.querySelector('a[href="/?tab=deals"]'), acct = nav.querySelector('a[href="/account.html"]');
    if (deals) {
      deals.setAttribute('href', '/services/'); deals.setAttribute('aria-current', 'page');
      deals.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>Services';
    }
    if (acct) acct.removeAttribute('aria-current');
  }
} catch (e) {}
try {
  const fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'btn primary fab'; fab.setAttribute('data-book', ''); fab.textContent = 'Book a service';
  document.body.appendChild(fab);
} catch (e) {}
})();
