/** Legacy-style config, loaded by src.css via @config. Build: node mobile-shell/build-css.mjs */
module.exports = {
  content: ['./index.html', './app.js'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#7c3aed', dark: '#6d28d9', soft: '#f5f0ff' }, // = site theme-color
        sale: '#e11d48',   // price + discount badge
        star: '#f59e0b',   // rating stars
        ink: '#1f2937',    // primary text
        mute: '#6b7280',   // secondary text
        line: '#e5e7eb',   // hairlines
        page: '#f4f4f5'    // page background behind cards
      },
      fontSize: { '2xs': ['10px', '12px'], xs: ['11px', '14px'], sm: ['13px', '18px'] },
      height: { bar: '48px', nav: '56px' },
      boxShadow: { card: '0 1px 2px rgba(0,0,0,.06)', sheet: '0 -8px 24px rgba(0,0,0,.18)' },
      transitionTimingFunction: { out: 'cubic-bezier(.2,.8,.2,1)' }
    }
  }
};
