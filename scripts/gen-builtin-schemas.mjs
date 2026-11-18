// Sinh packages/binary/src/builtin-schemas.js từ schemas/*.schema.json dựng sẵn (hiện: flp).
// Nguồn chuẩn là tệp JSON; module JS chỉ để bundler/worker nạp được mà không cần import JSON.
// Chạy: node scripts/gen-builtin-schemas.mjs   (test/flp.test.js kiểm hai bên luôn khớp)
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const BUILTIN = ['flp'];
let out = '// GENERATED bởi scripts/gen-builtin-schemas.mjs từ schemas/*.schema.json — không sửa tay.\n// Schema nhị phân dựng sẵn; schema do người dùng nạp (options.schemas) được ưu tiên hơn.\n';
const names = [];
for (const id of BUILTIN) {
  const json = JSON.parse(fs.readFileSync(path.join(root, 'schemas', `${id}.schema.json`), 'utf8'));
  const name = `SCHEMA_${id.toUpperCase()}`;
  names.push(name);
  out += `export const ${name} = ${JSON.stringify(json)};\n`;
}
out += `export const BUILTIN_SCHEMAS = Object.freeze([${names.join(', ')}]);\n`;
fs.writeFileSync(path.join(root, 'packages/binary/src/builtin-schemas.js'), out);
console.log(`builtin-schemas: ${BUILTIN.join(', ')} (${(out.length / 1024).toFixed(1)} KB)`);
