// Bộ chuyển Markdown → HTML tối giản, không phụ thuộc thư viện. Hỗ trợ đúng phần tài liệu của dự án dùng:
// tiêu đề (có id), đoạn, danh sách lồng nhau, bảng, khối code, trích dẫn, đường kẻ, in đậm/nghiêng/gạch ngang, code inline, liên kết. HTML thô bị escape (trừ <br>).
import { uniqueSlugger } from './slug.mjs';

export const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ESC = /\\([\\`*_{}[\]()#+\-.!|~<>])/g;

/** Inline: code, escape, liên kết, đậm, nghiêng. `link(href)` có thể đổi href (hoặc trả null để chỉ hiện chữ). */
export function renderInline(src, link = (h) => h) {
  const stash = [];
  const keep = (html) => `\u0000${stash.push(html) - 1}\u0000`;
  let s = src.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, __, code) => keep(`<code>${escapeHtml(code.replace(/^ (.*) $/, '$1'))}</code>`));
  s = s.replace(ESC, (_, ch) => keep(escapeHtml(ch)));
  s = s.replace(/<br\s*\/?>/gi, () => keep('<br>'));
  s = escapeHtml(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, alt, href) => keep(`<img alt="${alt}" src="${escapeHtml(link(href, true) ?? href)}">`));
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, text, href) => {
    const h = link(href.replace(/&amp;/g, '&'), false);
    const t = renderInlineRest(text);
    return keep(h == null ? `<span class="dead-link">${t}</span>` : `<a href="${escapeHtml(h)}">${t}</a>`);
  });
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:])/g, (_, pre, url) => `${pre}${keep(`<a href="${url}">${url}</a>`)}`);
  s = renderInlineRest(s);
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[+i]).replace(/\u0000(\d+)\u0000/g, (_, i) => stash[+i]);
}
function renderInlineRest(s) {
  return s
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
}

const isBlank = (l) => !l.trim();
const FENCE = /^\s{0,3}(```+|~~~+)\s*([\w+-]*)/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const BULLET = /^(\s*)([-*+])\s+(.*)$/;
const ORDERED = /^(\s*)(\d+)[.)]\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line) {
  let s = line.trim(); if (s.startsWith('|')) s = s.slice(1); if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const cells = []; let cur = '', tick = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '\\' && s[i + 1] === '|') { cur += '\\|'; i++; continue; }
    if (c === '`') { let n = 1; while (s[i + n] === '`') n++; tick = tick ? 0 : n; cur += s.slice(i, i + n); i += n - 1; continue; }
    if (c === '|' && !tick) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells.map((c) => c.replace(/\\\|/g, '|'));
}
const startsBlock = (l) => FENCE.test(l) || HEADING.test(l) || HR.test(l) || /^\s{0,3}>/.test(l) || BULLET.test(l) || ORDERED.test(l);

/**
 * Render markdown → { html, headings:[{level,text,id}], text }.
 * options: link(href, isImage) → href mới | null; slugger (mặc định mới cho mỗi tài liệu).
 */
export function renderMarkdown(src, options = {}) {
  const link = options.link ?? ((h) => h);
  const slugger = options.slugger ?? uniqueSlugger();
  const headings = [];
  let text = src.replace(/\r\n?/g, '\n');
  text = text.replace(/^---\n[\s\S]*?\n---\n/, '');             // front matter
  text = text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, '')); // chú thích HTML (giữ số dòng)
  const inline = (t) => renderInline(t, link);

  function blocks(lines) {
    const out = []; let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) { i++; continue; }
      let m;
      if ((m = line.match(FENCE))) { // khối code
        const fence = m[1], lang = m[2]; const buf = []; i++;
        while (i < lines.length && !new RegExp(`^\\s{0,3}${fence[0]}{${fence.length},}\\s*$`).test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push(`<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(buf.join('\n'))}</code></pre>`); continue;
      }
      if ((m = line.match(HEADING))) {
        const level = m[1].length, raw = m[2], id = slugger(raw);
        headings.push({ level, text: raw.replace(/[`*~]/g, ''), id });
        out.push(`<h${level} id="${escapeHtml(id)}">${inline(raw)}<a class="anchor" href="#${escapeHtml(id)}" aria-label="Liên kết tới mục này">#</a></h${level}>`); i++; continue;
      }
      if (HR.test(line)) { out.push('<hr>'); i++; continue; }
      if (/^\s{0,3}>/.test(line)) {
        const buf = []; while (i < lines.length && /^\s{0,3}>/.test(lines[i])) buf.push(lines[i++].replace(/^\s{0,3}> ?/, ''));
        out.push(`<blockquote>${blocks(buf)}</blockquote>`); continue;
      }
      if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]) && splitRow(line).length === splitRow(lines[i + 1]).length) {
        const head = splitRow(line), align = splitRow(lines[i + 1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : c.startsWith(':') ? 'left' : ''));
        i += 2; const rows = [];
        while (i < lines.length && !isBlank(lines[i]) && lines[i].includes('|')) rows.push(splitRow(lines[i++]));
        const cell = (tag, c, k) => `<${tag}${align[k] ? ` style="text-align:${align[k]}"` : ''}>${inline(c)}</${tag}>`;
        out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c, k) => cell('th', c, k)).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${head.map((_, k) => cell('td', r[k] ?? '', k)).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
      }
      if (BULLET.test(line) || ORDERED.test(line)) { const r = list(lines, i); out.push(r.html); i = r.next; continue; }
      // đoạn văn
      const buf = [line]; i++;
      while (i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i]) && !(lines[i].includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]))) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.map((l) => l.trim()).join('\n'))}</p>`);
    }
    return out.join('\n');
  }

  function list(lines, start) {
    const first = lines[start].match(BULLET) || lines[start].match(ORDERED);
    const ordered = !!lines[start].match(ORDERED) && !lines[start].match(BULLET);
    const baseIndent = first[1].length; const items = []; let i = start;
    const markerRe = ordered ? ORDERED : BULLET;
    while (i < lines.length) {
      const m = lines[i].match(markerRe);
      if (!m || m[1].length !== baseIndent) break;
      const contentIndent = baseIndent + lines[i].slice(baseIndent).match(/^(\S+\s+)/)[1].length;
      const body = [m[3]]; i++;
      while (i < lines.length) {
        const l = lines[i];
        if (isBlank(l)) { // dòng trống: thuộc mục nếu dòng kế tiếp còn thụt vào sâu hơn mục
          let j = i; while (j < lines.length && isBlank(lines[j])) j++;
          if (j < lines.length && lines[j].search(/\S/) >= contentIndent) { body.push(''); i++; continue; }
          break;
        }
        const ind = l.search(/\S/);
        if (ind >= contentIndent) { body.push(l.slice(contentIndent)); i++; continue; }
        if (ind > baseIndent && (BULLET.test(l) || ORDERED.test(l))) { body.push(l.slice(Math.min(ind, contentIndent))); i++; continue; } // lồng nông hơn nội dung
        if (ind > baseIndent || (!BULLET.test(l) && !ORDERED.test(l) && !isBlank(body[body.length - 1] ?? '') && !startsBlock(l))) { body.push(l.trim()); i++; continue; } // dòng tiếp của đoạn
        break;
      }
      items.push(body);
      let j = i; while (j < lines.length && isBlank(lines[j])) j++;
      if (j < lines.length && lines[j].match(markerRe) && lines[j].match(markerRe)[1].length === baseIndent) i = j; else break;
    }
    const tag = ordered ? 'ol' : 'ul';
    const html = items.map((b) => {
      let inner = blocks(b);
      if (!b.some(isBlank)) inner = inner.replace(/^<p>([\s\S]*?)<\/p>/, '$1'); // danh sách "chặt": bỏ <p> của đoạn đầu
      return `<li>${inner}</li>`;
    }).join('\n');
    return { html: `<${tag}>\n${html}\n</${tag}>`, next: i };
  }

  const html = blocks(text.split('\n'));
  const plain = html.replace(/<a class="anchor"[^>]*>#<\/a>/g, '').replace(/<pre[\s\S]*?<\/pre>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  return { html, headings, text: plain };
}
