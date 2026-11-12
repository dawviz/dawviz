// @dawviz/i18n — đa ngôn ngữ nhỏ, không phụ thuộc, chạy trong trình duyệt/Worker/Node. Xem docs/I18N.md.
// Danh mục: JSON phẳng { "khoá.chấm": "chuỗi", "@meta": {...} }. Cú pháp chuỗi:
//   {tên}                                  nội suy tham số
//   {n, plural, one {# tệp} other {# tệp}} số nhiều theo Intl.PluralRules (zero|one|two|few|many|other), # = số đã định dạng
// Dự phòng: locale (vi-VN) → ngôn ngữ (vi) → dự phòng (en) → chính khoá. Chuỗi thiếu được báo qua onMissing.

const RTL = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv']);

/** 'vi-VN' → ['vi-VN','vi']; 'zh_Hant_TW' → ['zh-Hant-TW','zh-Hant','zh'] */
export function localeChain(tag) {
  const parts = String(tag || '').replace(/_/g, '-').split('-').filter(Boolean);
  const out = [];
  for (let i = parts.length; i > 0; i--) out.push(parts.slice(0, i).join('-'));
  return out;
}

/** Chọn locale tốt nhất trong `available` cho danh sách ưu tiên `wanted` (vd navigator.languages); không khớp → fallback. */
export function matchLocale(wanted, available, fallback = 'en') {
  const have = new Map(available.map((a) => [a.toLowerCase(), a]));
  for (const w of [].concat(wanted || [])) for (const c of localeChain(w)) { const hit = have.get(c.toLowerCase()); if (hit) return hit; }
  return fallback;
}

export const dirOf = (locale) => (RTL.has(String(locale).split(/[-_]/)[0].toLowerCase()) ? 'rtl' : 'ltr');

/** Tách chuỗi thành các mảnh: text | {arg} | {arg, plural, ...}. Ném Error nếu ngoặc không cân. */
export function parseMessage(src) {
  let i = 0;
  const readUntilClose = () => { // đọc nội dung trong { } có lồng
    let depth = 1, j = i;
    while (j < src.length && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
    if (depth) throw new Error(`ngoặc { chưa đóng trong: ${src}`);
    const inner = src.slice(i, j - 1); i = j; return inner;
  };
  const out = []; let buf = '';
  while (i < src.length) {
    const c = src[i];
    if (c === '{') {
      if (buf) { out.push(buf); buf = ''; }
      i++; out.push(parseArg(readUntilClose()));
    } else { buf += src[i]; i++; }
  }
  if (buf) out.push(buf);
  return out;
}
function parseArg(inner) {
  const m = /^\s*([\w.]+)\s*(?:,\s*plural\s*,([\s\S]*))?$/.exec(inner);
  if (!m) throw new Error(`đối số không hợp lệ: {${inner}}`);
  if (m[2] === undefined) return { arg: m[1] };
  const cases = {}; const body = m[2]; let i = 0;
  while (i < body.length) {
    const mm = /^\s*(zero|one|two|few|many|other|=\d+)\s*\{/.exec(body.slice(i));
    if (!mm) { if (body.slice(i).trim()) throw new Error(`dạng số nhiều không hợp lệ trong: {${inner}}`); break; }
    i += mm[0].length; let depth = 1, j = i;
    while (j < body.length && depth) { if (body[j] === '{') depth++; else if (body[j] === '}') depth--; j++; }
    if (depth) throw new Error(`ngoặc { chưa đóng trong: {${inner}}`);
    cases[mm[1]] = parseMessage(body.slice(i, j - 1)); i = j;
  }
  if (!cases.other) throw new Error(`thiếu nhánh "other" trong: {${inner}}`);
  return { arg: m[1], plural: cases };
}

/** Các tên tham số và nhánh số nhiều dùng trong một chuỗi (cho bộ kiểm tra danh mục). */
export function describeMessage(src) {
  const args = new Set(); let plural = false;
  const walk = (nodes) => { for (const n of nodes) if (typeof n !== 'string') { args.add(n.arg); if (n.plural) { plural = true; for (const v of Object.values(n.plural)) walk(v); } } };
  walk(parseMessage(src));
  return { args: [...args].sort(), plural };
}

export function createI18n({ locale = 'en', fallback = 'en', catalogs = {}, onMissing } = {}) {
  let cur = locale;
  let pr, nf;
  const setFormatters = () => { try { pr = new Intl.PluralRules(cur); nf = new Intl.NumberFormat(cur); } catch { pr = new Intl.PluralRules(fallback); nf = new Intl.NumberFormat(fallback); } };
  setFormatters();
  const cache = new Map();
  const lookup = (key) => {
    for (const loc of [...localeChain(cur), ...localeChain(fallback)]) { const c = catalogs[loc]; if (c && typeof c[key] === 'string') return { text: c[key], loc }; }
    return null;
  };
  // `#` trong nhánh số nhiều = số đã định dạng
  const renderPlural = (nodes, params) => nodes.map((n) => {
    if (typeof n === 'string') return n;
    const v = params[n.arg];
    if (v === undefined) return `{${n.arg}}`;
    if (!n.plural) return typeof v === 'number' ? nf.format(v) : String(v);
    const key = n.plural[`=${v}`] ? `=${v}` : (n.plural[pr.select(Number(v))] ? pr.select(Number(v)) : 'other');
    return n.plural[key].map((p) => (typeof p === 'string' ? p.replace(/#/g, nf.format(Number(v))) : renderPlural([p], params))).join('');
  }).join('');
  return {
    get locale() { return cur; },
    get dir() { return dirOf(cur); },
    setLocale(l) { cur = l; setFormatters(); },
    has: (key) => !!lookup(key),
    t(key, params = {}) {
      const hit = lookup(key);
      if (!hit) { onMissing?.(key, cur); return key; }
      if (hit.loc !== cur && !localeChain(cur).includes(hit.loc)) onMissing?.(key, cur, hit.loc);
      const ck = `${hit.loc}\u0000${key}`;
      let nodes = cache.get(ck);
      if (!nodes) { try { nodes = parseMessage(hit.text); } catch { nodes = [hit.text]; } cache.set(ck, nodes); }
      return renderPlural(nodes, params);
    },
    number: (n, opts) => new Intl.NumberFormat(cur, opts).format(n),
    duration(sec) { const s = Math.max(0, Math.round(sec)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; },
  };
}

/** Tải danh mục từ thư mục locales/ qua fetch (trình duyệt) — manifest `index.json` liệt kê các mã ngôn ngữ. */
export async function loadLocales(baseUrl, { fetchImpl = globalThis.fetch, only } = {}) {
  const manifest = await (await fetchImpl(`${baseUrl}/index.json`)).json();
  const codes = (only || manifest.locales.map((l) => l.code));
  const catalogs = {};
  await Promise.all(codes.map(async (c) => { const r = await fetchImpl(`${baseUrl}/${c}.json`); if (r.ok) catalogs[c] = await r.json(); }));
  return { manifest, catalogs };
}
