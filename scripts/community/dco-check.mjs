// Kiểm DCO (D-42): mọi commit trong khoảng base..head phải có dòng "Signed-off-by: Tên <email>".
// Bỏ qua commit merge và commit của bot (dependabot, github-actions). Dùng: node dco-check.mjs <base> <head>
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SIGNOFF = /^Signed-off-by:\s+.+\s+<[^<>\s]+@[^<>\s]+>\s*$/im;
const BOTS = /\[bot\]|^dependabot|^github-actions/i;

/** commits: [{ sha, parents: number, author: string, message: string }] → danh sách commit thiếu sign-off. */
export function missingSignoff(commits) {
  return commits.filter((c) => c.parents <= 1 && !BOTS.test(c.author) && !SIGNOFF.test(c.message)).map((c) => c.sha);
}

export function readCommits(base, head) {
  const SEP = '\x01', REC = '\x02';
  const out = execFileSync('git', ['log', '--format=%H' + SEP + '%P' + SEP + '%an' + SEP + '%B' + REC, base + '..' + head], { encoding: 'utf8' });
  return out.split(REC).map((s) => s.replace(/^\n/, '')).filter(Boolean).map((rec) => {
    const [sha, parents, author, message] = rec.split(SEP);
    return { sha, parents: parents.trim() ? parents.trim().split(' ').length : 0, author, message };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [base, head] = process.argv.slice(2);
  if (!base || !head) { console.error('Dùng: dco-check.mjs <base> <head>'); process.exit(2); }
  const bad = missingSignoff(readCommits(base, head));
  if (bad.length) {
    console.error('Các commit thiếu dòng Signed-off-by (xem CONTRIBUTING.md, mục DCO):');
    for (const s of bad) console.error('  ' + s);
    console.error('Sửa: git rebase --signoff <base>  (rồi git push --force-with-lease)');
    process.exit(1);
  }
  console.log('Mọi commit đều có Signed-off-by.');
}
