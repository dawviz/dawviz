// Công cụ một lần: viết lại import tương đối giữa các package khi tách monorepo.
import fs from 'node:fs';
const CORE = new Set(['errors','limits','bytes','zip','xml','tempo','ast']);
const MAP = { midi: '@dawviz/parser-midi' };
const files = process.argv.slice(2);
for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const names = new Map(); // spec -> Set of specifiers
  src = src.replace(/^import \{([^}]*)\} from '\.\/([a-z]+)\.js';\n/gm, (m, list, mod) => {
    const spec = CORE.has(mod) ? '@dawviz/parser-core' : MAP[mod];
    if (!spec) return m;                       // import nội bộ trong package (als <- alp)
    if (!names.has(spec)) names.set(spec, new Set());
    list.split(',').map(s => s.trim()).filter(Boolean).forEach(s => names.get(spec).add(s));
    return '';
  });
  const header = [...names].map(([spec, set]) => `import { ${[...set].join(', ')} } from '${spec}';`).join('\n');
  // chèn sau dòng chú thích đầu file
  const lines = src.split('\n'); let i = 0; while (lines[i] && lines[i].startsWith('//')) i++;
  lines.splice(i, 0, header);
  fs.writeFileSync(f, lines.join('\n'));
}
