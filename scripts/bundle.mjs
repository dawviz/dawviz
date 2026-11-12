// Bundler ESM tối giản, không phụ thuộc: gộp @dawviz/parser và mọi package con thành MỘT file ES module
// để Web Worker nạp trực tiếp (module worker không dùng được import map). Mỗi module được bọc trong hàm riêng nên không đụng tên.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const pkgEntry = (spec) => path.join(root, 'packages', spec.replace('@dawviz/parser-', '').replace('@dawviz/parser', 'parser'), 'src/index.js');
const resolveSpec = (from, spec) => (spec.startsWith('.') ? path.resolve(path.dirname(from), spec) : spec.startsWith('@dawviz/') ? pkgEntry(spec) : (() => { throw new Error(`import ngoài không hỗ trợ: ${spec} trong ${from}`); })());

const mods = new Map(); const order = [];
function load(file) {
  if (mods.has(file)) return mods.get(file);
  let src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'); // chịu được tệp CRLF (Windows) để regex import/export khớp
  const m = { file, id: `__m${mods.size}`, exports: [], own: [], body: '', head: [] };
  mods.set(file, m);
  const dep = (spec) => load(resolveSpec(file, spec));
  src = src.replace(/^import\s+\{([^}]*)\}\s+from\s+'([^']+)';?[ \t]*$/gm, (_, list, spec) => {
    const d = dep(spec); const names = list.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.replace(/\s+as\s+/, ': '));
    m.head.push(`const { ${names.join(', ')} } = ${d.id};`); return '';
  });
  src = src.replace(/^export\s+\{([^}]*)\}\s+from\s+'([^']+)';?[ \t]*$/gm, (_, list, spec) => {
    const d = dep(spec); const names = list.split(',').map((s) => s.trim()).filter(Boolean);
    for (const n of names) { const [a, b] = n.split(/\s+as\s+/); m.head.push(`const ${b || a} = ${d.id}.${a};`); m.exports.push(b || a); m.own.push(b || a); }
    return '';
  });
  src = src.replace(/^export\s+\{([^}]*)\};?[ \t]*$/gm, (_, list) => { const ns = list.split(',').map((s) => s.trim()).filter(Boolean); m.exports.push(...ns); m.own.push(...ns); return ''; });
  src = src.replace(/^export\s+\*\s+from\s+'([^']+)';?[ \t]*$/gm, (_, spec) => { const d = dep(spec); m.head.push(`Object.assign(__star, ${d.id});`); m.exports.push(...d.exports); return ''; });
  src = src.replace(/^export\s+(async\s+function|function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm, (_, kw, name) => { m.exports.push(name); m.own.push(name); return `${kw} ${name}`; });
  m.exports = [...new Set(m.exports)];
  m.body = src;
  order.push(m);
  return m;
}
const entry = load(pkgEntry('@dawviz/parser'));
let out = `// GENERATED bởi scripts/bundle.mjs — không sửa tay.\n`;
for (const m of order) {
  const rel = path.relative(root, m.file).split(path.sep).join('/'); // cùng nội dung bundle trên mọi hệ điều hành
  out += `\n// ---- ${rel}\nconst ${m.id} = (() => {\nconst __star = {};\n${m.head.join('\n')}\n${m.body}\nreturn Object.assign(__star, { ${[...new Set(m.own)].join(', ')} });\n})();\n`;
}
out += `\nconst { ${entry.exports.join(', ')} } = ${entry.id};\nexport { ${entry.exports.join(', ')} };\n`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/dawviz-parser.bundle.js'), out);
console.log(`bundle: ${order.length} module, ${entry.exports.length} export, ${(out.length / 1024).toFixed(0)} KB`);
