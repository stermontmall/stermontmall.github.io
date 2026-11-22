// Real-HTTP photo check: a photo counts as live only with HTTP 200, an image/* content type and real image bytes (magic numbers).
export function sniff(buf) {
  const b = Buffer.from(buf);
  if (b.length < 12) return '';
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
  if (b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
  if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (b.subarray(0, 3).toString() === 'GIF') return 'image/gif';
  if (b.subarray(4, 12).toString().startsWith('ftypavif')) return 'image/avif';
  if (/^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(b.subarray(0, 300).toString())) return 'image/svg+xml';
  return '';
}
export async function probePhoto(url, { timeout = 20000 } = {}) {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeout) });
    const ct = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const buf = r.ok ? Buffer.from(await r.arrayBuffer()) : Buffer.alloc(0);
    const real = sniff(buf);
    const ok = r.status === 200 && ct.startsWith('image/') && !!real && buf.length > 200;
    return { url, status: r.status, contentType: ct, bytes: buf.length, sniffed: real, ok, reason: ok ? '' : r.status !== 200 ? 'HTTP ' + r.status : !ct.startsWith('image/') ? 'content-type ' + (ct || 'none') : !real ? 'bytes are not an image' : 'too small' };
  } catch (e) { return { url, status: 0, contentType: '', bytes: 0, sniffed: '', ok: false, reason: String(e.message || e) }; }
}
