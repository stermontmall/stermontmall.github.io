import assert from 'node:assert/strict';
import http from 'node:http';
import { probePhoto, sniff } from './scripts/photo-probe.mjs';
const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(400, 1)]);
const JPG = Buffer.concat([Buffer.from('ffd8ffe0', 'hex'), Buffer.alloc(400, 2)]);
const srv = http.createServer((q, r) => {
  const routes = {
    '/ok.png': () => r.writeHead(200, { 'content-type': 'image/png' }).end(PNG),
    '/ok.jpg': () => r.writeHead(200, { 'content-type': 'image/jpeg' }).end(JPG),
    '/html-200.jpg': () => r.writeHead(200, { 'content-type': 'text/html' }).end('<html>' + 'x'.repeat(400)),
    '/wrong-type.jpg': () => r.writeHead(200, { 'content-type': 'image/jpeg' }).end('<html>' + 'x'.repeat(400)),
    '/quota-402.jpg': () => r.writeHead(402, { 'content-type': 'application/json' }).end('{"message":"exceed_cached_egress_quota"}'),
    '/imagekit-404.jpg': () => r.writeHead(404, { 'content-type': 'text/plain' }).end('not found'),
  };
  (routes[q.url] || routes['/imagekit-404.jpg'])();
}).listen(0);
await new Promise((res) => srv.on('listening', res));
const base = 'http://127.0.0.1:' + srv.address().port;
try {
  for (const p of ['/ok.png', '/ok.jpg']) { const x = await probePhoto(base + p); assert.equal(x.ok, true, p); assert.equal(x.status, 200); assert.match(x.contentType, /^image\//); }
  assert.equal((await probePhoto(base + '/ok.png')).sniffed, 'image/png');
  assert.equal((await probePhoto(base + '/ok.jpg')).sniffed, 'image/jpeg');
  const bad = { '/html-200.jpg': 'content-type', '/wrong-type.jpg': 'not an image', '/quota-402.jpg': 'HTTP 402', '/imagekit-404.jpg': 'HTTP 404' };
  for (const [p, why] of Object.entries(bad)) { const x = await probePhoto(base + p); assert.equal(x.ok, false, p); assert.ok(x.reason.includes(why), p + ' -> ' + x.reason); }
  assert.equal((await probePhoto('http://127.0.0.1:1/x.jpg', { timeout: 2000 })).ok, false);
  assert.equal(sniff(Buffer.from('short')), '');
} finally { srv.close(); }
console.log('Photo probe tests passed (real HTTP: 200 image, wrong content type, 402 quota, 404 broken ImageKit URL).');
