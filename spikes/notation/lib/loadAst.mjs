// Nạp AST thật bằng thư viện parser của repo (chỉ dùng cho spike; tệp bên thứ ba không commit).
import fs from 'node:fs';
import path from 'node:path';
import { parseProject } from '@dawviz/parser';
export async function loadAst(file) {
  const r = await parseProject(path.basename(file), fs.readFileSync(file), {});
  return r.ast;
}
