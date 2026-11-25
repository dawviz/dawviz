// Test của bộ lọc spam (antispam.mjs) và kiểm DCO (dco-check.mjs), T-39.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, squash, extractHosts } from './antispam.mjs';
import { missingSignoff } from './dco-check.mjs';

const base = { association: 'NONE', accountAgeDays: 400, publicRepos: 12 };

test('thành viên và người đã đóng góp được bỏ qua dù có từ khoá', () => {
  for (const a of ['OWNER', 'MEMBER', 'COLLABORATOR', 'CONTRIBUTOR']) assert.equal(classify({ ...base, association: a, body: 'crypto airdrop t.me/x' }).action, 'none');
});
test('báo lỗi bình thường không bị đụng tới', () => {
  assert.equal(classify({ ...base, title: 'Xuất video lỗi trên Firefox', body: 'Mở Xuất video rồi bấm Huỷ thì treo. Xem https://github.com/dawviz/dawviz/issues/3' }).action, 'none');
});
test('người dùng tài khoản mới viết bình thường vẫn được qua', () => {
  assert.equal(classify({ association: 'FIRST_TIME_CONTRIBUTOR', accountAgeDays: 1, publicRepos: 0, title: 'Không nạp được tệp .als', body: 'Ableton Live 12, tệp 3 MB, báo ERR_NO_NOTES khi mở.' }).action, 'none');
});
test('từ khoá viết lách luật vẫn bắt được', () => {
  assert.equal(classify({ ...base, body: 'join b.i.t.c.o.i.n group' }).action, 'spam');
  assert.equal(classify({ ...base, body: 'T-e-l-e-g-r-a-m me' }).action, 'spam');
  assert.equal(classify({ ...base, body: 'ｂｉｔｃｏｉｎ' }).action, 'spam');
});
test('liên kết rút gọn hoặc tệp thực thi là tín hiệu mạnh', () => {
  assert.equal(classify({ ...base, body: 'fix here https://bit.ly/abc' }).action, 'spam');
  assert.equal(classify({ ...base, body: 'tải https://example.org/patch.exe' }).action, 'spam');
});
test('liên kết lạ chỉ gắn needs-triage, không đóng', () => {
  assert.equal(classify({ ...base, body: 'Tôi gặp lỗi tương tự, xem https://blog.example.org/post' }).action, 'triage');
});
test('tài khoản mới + nội dung quá ngắn: needs-triage', () => {
  assert.equal(classify({ association: 'NONE', accountAgeDays: 0.1, publicRepos: 0, title: 'help', body: '.' }).action, 'triage');
});
test('không báo oan: "for example", "unit rolling", tên tệp .exe trong báo lỗi, cracked/discord', () => {
  for (const body of ['for example the export fails', 'the unit rolling buffer is full', 'ffmpeg.exe not found on Windows', 'audio sounds cracked at 0:10', 'chat at https://discord.gg/abc', 'crypto.subtle is undefined in this browser', 'abetting is a word']) {
    const v = classify({ ...base, body });
    assert.notEqual(v.action, 'spam', body);
  }
});
test('tải .exe từ nơi lạ là tín hiệu mạnh, nhưng từ github.com thì không', () => {
  assert.equal(classify({ ...base, body: 'get https://evil.example/fix/patch.exe now' }).action, 'spam');
  assert.notEqual(classify({ ...base, body: 'https://github.com/dawviz/dawviz/releases/download/v1/setup.exe' }).action, 'spam');
});
test('viết lách có khoảng trắng và ký tự toàn rộng', () => {
  assert.equal(classify({ ...base, body: 'dm me on t e l e g r a m' }).action, 'spam');
  assert.equal(classify({ ...base, body: 'ｔｅｌｅｇｒａｍ' }).action, 'spam');
});
test('squash và extractHosts', () => {
  assert.equal(squash('C.R-Y p_t.o'), 'crypto');
  assert.deepEqual(extractHosts('a https://WWW.Example.org:8080/x b http://t.me/y'), ['example.org', 't.me']);
});

const ok = 'feat: x\n\nSigned-off-by: An Nguyen <an@example.com>';
test('DCO: thiếu sign-off bị báo, merge và bot được bỏ qua', () => {
  const cs = [
    { sha: 'a', parents: 1, author: 'An', message: ok },
    { sha: 'b', parents: 1, author: 'An', message: 'fix: y' },
    { sha: 'c', parents: 2, author: 'An', message: 'Merge branch main' },
    { sha: 'd', parents: 1, author: 'dependabot[bot]', message: 'bump' },
    { sha: 'e', parents: 1, author: 'An', message: 'Signed-off-by: thiếu email' },
  ];
  assert.deepEqual(missingSignoff(cs), ['b', 'e']);
});
