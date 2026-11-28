import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./order-emails.js', import.meta.url), 'utf8');
const calls = [];
const context = {
  URL,
  Promise,
  AbortController,
  Number,
  String,
  Math,
  JSON,
  encodeURIComponent,
  console: { warn() {} },
  window: {
    fetch(url, options) {
      calls.push({ url, options });
      return Promise.reject(new Error('simulated offline network'));
    },
    console: { warn() {} },
    setTimeout,
    clearTimeout
  }
};
vm.runInNewContext(source, context, { filename: 'order-emails.js' });
const api = context.window.STMOrderEmails;
assert.ok(api, 'public API is exposed');

const sample = {
  ref: 'SA-TEST-1001',
  customer_name: '<img src=x onerror=alert(1)> Amina',
  phone: '+254 712 345 678',
  email: 'amina@example.com',
  method: 'delivery',
  county: 'Nairobi',
  address: '<script>alert("x")</script> Westlands',
  notes: 'Leave with <b>security</b> & call',
  items: [
    { name: '<svg onload=alert(1)> Product', qty: 2, total: 1234567, image_url: 'javascript:alert(1)' },
    { name: 'Safe product', qty: 1, total: 250 }
  ],
  subtotal: 1234817,
  discount: 817,
  voucher_code: 'SAVE817',
  pay_code: 'QWX7K2P9LM',
  pay_amount: 1234000,
  pay_verified: false,
  status: 'pending',
  stage: ''
};

const placed = api.render(sample, 'placed', 'customer');
assert.match(placed.html, /&lt;img src=x onerror=alert\(1\)&gt;/, 'customer name is HTML-escaped');
assert.match(placed.html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/, 'address is HTML-escaped');
assert.match(placed.html, /&lt;svg onload=alert\(1\)&gt; Product/, 'item name is HTML-escaped');
assert.doesNotMatch(placed.html, /javascript:alert/, 'unsafe item image URLs are rejected');
assert.match(placed.html, /SA<\/td>/, 'missing or unsafe product image gets a safe visual fallback');
assert.match(placed.html, /KSh 1,234,817/, 'subtotal uses KSh formatting with thousands separators');
assert.match(placed.html, /KSh 1,234,000/, 'payment amount uses KSh formatting');
assert.match(placed.html, /KSh 1,234,000/, 'total is formatted after discount');
assert.match(placed.html, /AWAITING VERIFICATION/, 'unverified M-Pesa payment is labelled');
assert.match(placed.html, /track\.html\?ref=SA-TEST-1001/, 'track CTA includes encoded order reference');
assert.match(placed.html, /wa\.me\/254789514060/, 'WhatsApp CTA targets the support number');
assert.match(placed.html, /returns\.html/, 'returns link is present');
assert.match(placed.html, /shipping\.html/, 'shipping link is present');
assert.match(placed.html, /name="viewport"/, 'mobile viewport is configured');
assert.match(placed.html, /color-scheme/, 'dark-mode metadata is present');
assert.match(placed.html, /bgcolor="#ffffff"/, 'email-client bgcolor fallback is present');
assert.match(placed.text, /ORDER ITEMS/, 'plain-text fallback is generated');
assert.match(placed.params.text_body, /SA-TEST-1001/, 'plain text is passed to EmailJS');

const imageSample = api.render({
  ...sample,
  items: [{ name: 'Photo item', qty: 1, total: 500, image_url: 'https://cdn.example.test/item.png' }]
}, 'placed', 'customer').html;
assert.match(imageSample, /src="https:\/\/cdn\.example\.test\/item\.png"/, 'HTTPS item image is rendered');
assert.match(imageSample, /alt="Photo item"/, 'item image has alt text');
assert.match(imageSample, /width="52" height="52"/, 'item image has explicit dimensions');

const expected = {
  placed: 'Order received',
  confirmed: 'Your order is confirmed',
  packed: 'Your order is packed',
  delivered: 'Your order is complete',
  declined: 'Let’s sort out your order'
};
for (const [state, headline] of Object.entries(expected)) {
  const rendered = api.render(sample, state, 'customer');
  assert.ok(rendered.html.includes(headline), state + ' has its own headline');
  assert.ok(rendered.html.includes('Order progress'), state + ' has progress tracker');
  assert.ok(rendered.html.includes('Track your order'), state + ' has tracking CTA');
  assert.ok(rendered.html.includes('Chat on WhatsApp'), state + ' has WhatsApp CTA');
  assert.doesNotMatch(rendered.html, /\{\{[^}]+\}\}/, state + ' has no unreplaced placeholders');
}
const staff = api.render(sample, 'placed', 'staff');
assert.match(staff.html, /tel:\+254712345678/, 'staff phone is tap-to-call');
assert.match(staff.html, /Open admin orders/, 'staff alert links to admin');
assert.match(staff.html, /WhatsApp customer/, 'staff alert has WhatsApp action');
assert.match(staff.params.to_email, /^support@stermontarcade\.co\.ke$/);
assert.doesNotMatch(staff.html, /\{\{[^}]+\}\}/, 'staff alert has no unreplaced placeholders');

const total = await api.send({ p_ref: sample.ref, p_customer_name: sample.customer_name, p_phone: sample.phone, p_email: sample.email, p_method: 'delivery', p_county: sample.county, p_address: sample.address, p_notes: sample.notes, p_pay_code: sample.pay_code, p_pay_amount: sample.pay_amount }, sample);
assert.equal(total, false, 'send() resolves false when network fails');
assert.equal(calls.length, 2, 'send() attempts both staff and customer messages');
const status = await api.status(sample, 'confirmed');
assert.equal(status, false, 'status() resolves false when network fails');
assert.equal(await api.status(sample, 'unknown'), false, 'unknown status resolves false');

const hangingContext = {
  URL, Promise, Number, String, Math, JSON, encodeURIComponent, AbortController,
  console: { warn() {} },
  window: {
    fetch() { return new Promise(() => {}); },
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    AbortController,
    console: { warn() {} }
  }
};
vm.runInNewContext(source, hangingContext, { filename: 'order-emails-timeout.test.js' });
assert.equal(await hangingContext.window.STMOrderEmails.send({}, sample), false,
  'send() resolves false when EmailJS never responds');
console.log('order-emails.test.mjs: all assertions passed');
