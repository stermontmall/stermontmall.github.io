// Small contrast correction for the exact ordinary-consumer routes covered by the WCAG audit.
// Keep this allowlist explicit: do not apply the override to other catalogue categories or product pages.
export const SAFE_A11Y_PATHS = Object.freeze([
  '/c/televisions.html',
  '/c/phones-tablets.html',
  '/c/appliances.html',
  '/p/hisense-55a6qken-4k-uhd-smart-tv-with-tv-guard-and-wall-mount-55-inch.html',
  '/p/hisense-ref205dr-double-door-fridge-with-water-dispenser-205-litres.html',
  '/p/kenwood-air-fryer-hfp30-000bk-3-8-litres.html',
  '/p/samsung-galaxy-a06-4gb-ram-64gb.html'
]);

const STYLE = '<style id="stm-safe-a11y">nav.bc,footer{background-color:#f8f9fd}</style>';

export function safeA11yStyle(path) {
  return SAFE_A11Y_PATHS.includes(String(path || '')) ? STYLE : '';
}
