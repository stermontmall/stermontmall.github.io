// Small dependency-free helpers for reading Supabase dashboard CSV exports.

// RFC 4180 CSV: quoted fields, "" escapes, commas and line breaks inside quotes.
// Returns an array of objects keyed by the header row.
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (!(row.length === 1 && row[0] === '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift() || [];
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// Postgres text[] as exported by the dashboard: {a,"b c"} or a JSON array ["a","b"].
export function pgArray(value) {
  const s = String(value ?? '').trim();
  if (!s || s === '{}' || s === '[]') return [];
  if (s[0] === '[') { try { const j = JSON.parse(s); if (Array.isArray(j)) return j.map(String); } catch { /* fall through */ } }
  if (s[0] !== '{') return [s];
  const out = []; let cur = '', inQ = false;
  for (let i = 1; i < s.length - 1; i++) {
    const c = s[i];
    if (inQ) { if (c === '\\') cur += s[++i]; else if (c === '"') inQ = false; else cur += c; }
    else if (c === '"') inQ = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

export const toBool = v => ['true', 't', '1', 'yes'].includes(String(v ?? '').trim().toLowerCase());
export const toNum = v => { const s = String(v ?? '').trim(); if (s === '') return null; const n = Number(s); return Number.isFinite(n) ? n : null; };
export const toText = v => String(v ?? '');
export const toJson = v => { const s = String(v ?? '').trim(); if (!s) return null; try { return JSON.parse(s); } catch { return null; } };
// Postgres timestamps look like "2026-11-18 17:55:50.899135+00"; JavaScript needs "+00:00".
export const toDate = v => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'));
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().replace('T', ' ');
};
