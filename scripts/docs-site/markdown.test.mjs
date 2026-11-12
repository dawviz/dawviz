// Test của bộ chuyển Markdown → HTML (tiêu đề/id, inline, bảng, danh sách lồng nhau, khối code, trích dẫn, văn bản tìm kiếm).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, renderInline } from './markdown.mjs';
import { slug } from './slug.mjs';

const R = (s, o) => renderMarkdown(s, o);

test('tiêu đề có id kiểu GitHub, trùng thì thêm -1; heading được thu thập', () => {
  const r = R('# A b\n## Mô hình 🟢\n## Mô hình 🟢\n');
  assert.deepEqual(r.headings.map((h) => h.id), ['a-b', 'mô-hình-', 'mô-hình--1']);
  assert.match(r.html, /<h2 id="mô-hình-">/);
  assert.equal(slug('3. Yêu cầu chức năng › 3.1'), '3-yêu-cầu-chức-năng--31');
});
test('inline: code, đậm, nghiêng, escape HTML, backslash, liên kết có đổi href', () => {
  assert.equal(renderInline('a **b** *c* `x<y` \\* <script>'), 'a <strong>b</strong> <em>c</em> <code>x&lt;y</code> * &lt;script&gt;');
  assert.equal(renderInline('[t](a.md#h)', (h) => h.replace('.md', '.html')), '<a href="a.html#h">t</a>');
  assert.match(renderInline('[t](x)', () => null), /dead-link/);
  assert.equal(renderInline('snake_case_name và 2*3*4'), 'snake_case_name và 2*3*4');
});
test('bảng: căn lề, dấu | trong code và \\|, ô thiếu', () => {
  const r = R('| A | B |\n|:--|--:|\n| `a|b` | x \\| y |\n| z |\n');
  assert.match(r.html, /<th style="text-align:left">A<\/th><th style="text-align:right">B<\/th>/);
  assert.match(r.html, /<code>a\|b<\/code>/); assert.match(r.html, /x \| y/); assert.match(r.html, /<td style="text-align:left">z<\/td><td style="text-align:right"><\/td>/);
});
test('danh sách lồng nhau, có thứ tự, đoạn nối dòng, khối code trong mục', () => {
  const r = R('- một\n  - con 1\n  - con 2\n- hai\n  tiếp dòng\n\n1. a\n2. b\n\n- x\n\n  ```js\n  let a = 1;\n  ```\n');
  assert.match(r.html, /<li>một\n<ul>\n<li>con 1<\/li>\n<li>con 2<\/li>\n<\/ul><\/li>/);
  assert.match(r.html, /<li>hai\ntiếp dòng<\/li>/);
  assert.match(r.html, /<ol>\n<li>a<\/li>\n<li>b<\/li>\n<\/ol>/);
  assert.match(r.html, /<pre><code class="language-js">let a = 1;<\/code><\/pre>/);
});
test('khối code không bị hiểu là markdown; trích dẫn; hr; front matter và chú thích bị bỏ', () => {
  const r = R('---\nk: v\n---\n<!-- ẩn -->\n> **Lưu ý** x\n\n---\n\n```text\n# không phải heading\n| a | b |\n```\n');
  assert.ok(!r.html.includes('k: v') && !r.html.includes('ẩn'));
  assert.match(r.html, /<blockquote><p><strong>Lưu ý<\/strong> x<\/p><\/blockquote>/);
  assert.match(r.html, /<hr>/); assert.equal(r.headings.length, 0);
  assert.match(r.html, /# không phải heading\n\| a \| b \|/);
});
test('text thuần cho tìm kiếm không chứa thẻ và không chứa code', () => {
  const r = R('# T\nxin **chào** `x`\n\n```\nsecret\n```\n');
  assert.equal(r.text, 'T xin chào x');
});
