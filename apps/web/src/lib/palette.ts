// Bảng màu (palette) cho track (T-49, REQ-UI-11): đọc bảng màu từ chữ dán vào hoặc tệp, gán lần lượt cho track, lưu theo trình duyệt,
// và danh sách màu dùng gần đây của bộ chọn màu. Hàm thuần (đọc/ghi localStorage nằm trong load/save, luôn có try/catch qua prefs.ts).
import { normalizeColor, toHex } from './color.ts';
import { loadPref, savePref } from './prefs.ts';

export interface Palette { name: string; colors: string[] }
export type PaletteFormat = 'gpl' | 'json' | 'css' | 'list';
export interface PaletteParse { format: PaletteFormat; name?: string; colors: string[]; /** Mục không đọc được (bỏ qua). */ skipped: number }

export const MAX_PALETTE_COLORS = 256, MAX_PALETTES = 64, MAX_PALETTE_NAME = 64, RECENT_MAX = 12;

/** Tệp GIMP .gpl: "GIMP Palette", "Name: …", "Columns: …", chú thích "#", mỗi dòng "R G B [tên]" (GIMP 3: "Channels: RGBA" thì thêm A). */
function parseGpl(lines: string[]): PaletteParse {
  let name: string | undefined, rgba = false, skipped = 0;
  const colors: string[] = [];
  for (const raw of lines.slice(1)) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    const kv = /^(name|columns|channels)\s*:\s*(.*)$/i.exec(l);
    if (kv) { const k = kv[1].toLowerCase(); if (k === 'name') name = kv[2].trim() || undefined; if (k === 'channels') rgba = /rgba/i.test(kv[2]); continue; }
    const m = rgba ? /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s|$)/.exec(l) : /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})(?:\s|$)/.exec(l);
    const v = m ? m.slice(1).map(Number) : [];
    if (!m || v.some((x) => x > 255)) { skipped++; continue; }
    colors.push(toHex({ r: v[0], g: v[1], b: v[2], a: rgba ? v[3] / 255 : 1 }));
  }
  return { format: 'gpl', name, colors, skipped };
}

/** Một mục trong danh sách dán vào: không có # mà đủ 3/4/6/8 ký tự HEX thì là mã HEX (danh sách thường bỏ #). */
function listToken(tok: string): string | null {
  const t = tok.trim().replace(/^['"]|['"]$/g, '');
  if (!t) return null;
  if (/^[0-9a-f]{3,4}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(t)) return normalizeColor('#' + t);
  return normalizeColor(t);
}

function parseJson(text: string): PaletteParse | null {
  let v: unknown;
  try { v = JSON.parse(text); } catch { return null; }
  let name: string | undefined, items: unknown[] | null = null;
  if (Array.isArray(v)) items = v;
  else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.colors)) items = o.colors;
    if (typeof o.name === 'string') name = o.name;
  }
  if (!items) return null;
  let skipped = 0; const colors: string[] = [];
  for (const it of items) {
    const raw = typeof it === 'string' ? it : it && typeof it === 'object' ? (['hex', 'color', 'value'].map((k) => (it as Record<string, unknown>)[k]).find((x) => typeof x === 'string') as string | undefined) : undefined;
    const c = raw === undefined ? null : listToken(raw);
    if (c) colors.push(c); else skipped++;
  }
  return { format: 'json', name, colors, skipped };
}

/** Đọc bảng màu từ chữ: tự nhận .gpl, JSON (mảng mã hoặc {name, colors}), biến CSS (--x: #…;) hay danh sách mã (phẩy, khoảng trắng, xuống dòng). */
export function parsePalette(text: string): PaletteParse {
  const src = String(text ?? '').replace(/^\u{FEFF}/u, '');
  const lines = src.split(/\r?\n/);
  let out: PaletteParse;
  const first = lines.find((l) => l.trim())?.trim() ?? '';
  const json = /^[[{]/.test(first) ? parseJson(src) : null;
  if (/^gimp palette/i.test(first)) out = parseGpl(lines.slice(lines.findIndex((l) => l.trim())));
  else if (json) out = json;
  else if (/--[\w-]+\s*:/.test(src)) {
    let skipped = 0; const colors: string[] = [];
    for (const m of src.matchAll(/--[\w-]+\s*:\s*([^;}\n]+)/g)) { const c = normalizeColor(m[1].replace(/!important/i, '')); if (c) colors.push(c); else skipped++; }
    out = { format: 'css', colors, skipped };
  } else {
    let skipped = 0; const colors: string[] = [];
    for (const line of lines) {
      const l = line.trim(); if (!l) continue;
      // Dòng là một bộ số "255, 0, 0" (3–4 số ≤ 255) thì là một màu, không phải ba mã HEX.
      if (/^\d{1,3}(\.\d+)?%?(\s*[,\s]\s*\d{1,3}(\.\d+)?%?){2,3}$/.test(l)) { const c = normalizeColor(l); if (c) { colors.push(c); continue; } }
      // Hàm màu (rgb(…), hsl(…)…) có dấu phẩy bên trong: tách ra trước rồi mới chia theo phẩy/khoảng trắng.
      const rest = l.replace(/[a-z]+\([^)]*\)/gi, (fn) => { const c = normalizeColor(fn); if (c) colors.push(c); else skipped++; return ' '; });
      for (const tok of rest.split(/[\s,;]+/)) { if (!tok) continue; const c = listToken(tok); if (c) colors.push(c); else skipped++; }
    }
    out = { format: 'list', colors, skipped };
  }
  if (out.colors.length > MAX_PALETTE_COLORS) { out.skipped += out.colors.length - MAX_PALETTE_COLORS; out.colors = out.colors.slice(0, MAX_PALETTE_COLORS); }
  if (out.name) out.name = out.name.slice(0, MAX_PALETTE_NAME);
  return out;
}

/** Gán lần lượt: track thứ i nhận màu thứ i; ít màu hơn track thì quay vòng lại từ đầu. Không có màu → {}. */
export function assignPalette(trackIds: readonly string[], colors: readonly string[]): Record<string, string> {
  if (!colors.length) return {};
  return Object.fromEntries(trackIds.map((id, i) => [id, colors[i % colors.length]]));
}

/** Đưa màu vừa dùng lên đầu danh sách gần đây (bỏ trùng, tối đa `max`). Mã sai thì giữ nguyên danh sách. */
export function pushRecent(list: readonly string[], color: string, max = RECENT_MAX): string[] {
  const c = normalizeColor(color); if (!c) return [...list];
  return [c, ...list.filter((x) => x !== c)].slice(0, max);
}

const cleanColors = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? normalizeColor(x) : null)).filter((x): x is string => !!x).slice(0, MAX_PALETTE_COLORS) : []);
/** Bảng màu đã lưu đọc từ localStorage: bỏ mục hỏng, tên rỗng, bảng không màu; tên trùng giữ bản đầu. */
export function sanitizePalettes(raw: unknown): Palette[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>(), out: Palette[] = [];
  for (const p of raw) {
    if (!p || typeof p !== 'object') continue;
    const name = typeof (p as Palette).name === 'string' ? (p as Palette).name.trim().slice(0, MAX_PALETTE_NAME) : '';
    const colors = cleanColors((p as Palette).colors);
    if (!name || !colors.length || seen.has(name)) continue;
    seen.add(name); out.push({ name, colors });
    if (out.length >= MAX_PALETTES) break;
  }
  return out;
}
/** Thêm hoặc thay (cùng tên) một bảng màu; bảng mới lên đầu. */
export function upsertPalette(list: readonly Palette[], p: Palette): Palette[] {
  return sanitizePalettes([{ name: p.name, colors: p.colors }, ...list.filter((x) => x.name !== p.name.trim())]);
}

export const loadPalettes = (): Palette[] => sanitizePalettes(loadPref<{ list?: unknown }>('palettes', {}).list);
export const savePalettes = (list: readonly Palette[]): void => savePref('palettes', { list });
export const loadRecent = (): string[] => cleanColors(loadPref<{ colors?: unknown }>('recentColors', {}).colors).slice(0, RECENT_MAX);
export const saveRecent = (colors: readonly string[]): void => savePref('recentColors', { colors });
