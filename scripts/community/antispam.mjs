// Phân loại issue/comment nghi spam. Hàm thuần, không gọi mạng (workflow tự lấy dữ liệu tài khoản rồi truyền vào).
// Lưu ý: KHÔNG đưa "crypto" trơn vào từ khoá, vì ứng dụng dùng crypto.subtle (SHA-256) nên báo lỗi hợp lệ có thể nhắc tới nó.
// Nguyên tắc: chỉ ĐÓNG + KHOÁ khi có tín hiệu mạnh; tín hiệu yếu (tài khoản mới, link lạ) chỉ gắn nhãn needs-triage,
// vì người dùng thật hay có tài khoản mới và hay dán liên kết. Thành viên/cộng tác viên/người đã có đóng góp thì bỏ qua.

export const TRUSTED = new Set(['OWNER', 'MEMBER', 'COLLABORATOR', 'CONTRIBUTOR']);
export const SPAM_KEYWORDS = ['cryptocurrency', 'airdrop', 'giveaway', 'whatsapp', 'telegram', 'bitcoin', 'casino', 'betting', 'forex', 'keygen', 'freemoney'];
export const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'rb.gy', 'shorturl.at', 'goo.gl', 't.me', 'wa.me', 'telegram.me'];
export const ALLOWED_HOSTS = ['github.com', 'githubusercontent.com', 'dawviz.github.io', 'ableton.com', 'reaper.fm', 'cockos.com', 'image-line.com', 'bitwig.com', 'imgur.com', 'youtube.com', 'youtu.be', 'developer.mozilla.org', 'caniuse.com', 'w3.org', 'wikipedia.org'];
// Chỉ tính khi là ĐƯỜNG DẪN tải về từ nơi lạ; nhắc tên tệp trong báo lỗi ("ffmpeg.exe not found") không bị coi là spam.
const RISKY_URL = /https?:\/\/([^\s/)\]>"'<]+)[^\s)\]>"'<]*\.(exe|msi|scr|bat|cmd|apk|dmg|pkg|jar|ps1|vbs|lnk)(\?[^\s]*)?(?=[\s)\]>"'<]|$)/gi;

const ZW = /[\u200b-\u200f\u2060\ufeff]/g;
const LETTER = '[^\\p{L}\\p{N}]';   // ký tự không phải chữ/số
/** NFKC (ｃｒｙｐｔｏ → crypto), chữ thường, bỏ ký tự zero-width. */
export function normalize(text) { return String(text ?? '').normalize('NFKC').toLowerCase().replace(ZW, ''); }
/** Bỏ mọi ký tự không phải chữ/số: chỉ để so sánh/kiểm tra, KHÔNG dùng để tìm từ khoá (dính chữ qua ranh giới từ gây báo oan: "for example" → "forexample"). */
export function squash(text) { return normalize(text).replace(new RegExp(LETTER + '+', 'gu'), ''); }

const KEYWORD_RES = SPAM_KEYWORDS.map((k) => {
  const ch = [...k];
  // (1) viết liền, đứng đầu từ: crypto, cryptocurrency (không dính chữ phía trước: "abetting" không khớp betting)
  const plain = '(?<![\\p{L}\\p{N}])' + ch.join('');
  // (2) viết lách bằng ký tự phân cách GIỮA MỌI chữ: c.r.y.p.t.o, t-e-l-e-g-r-a-m, c r y p t o (mỗi khe 1–2 ký tự)
  const spaced = '(?<![\\p{L}\\p{N}])' + ch.join(LETTER + '{1,2}') + '(?![\\p{L}\\p{N}])';
  return { k, re: new RegExp('(?:' + plain + ')|(?:' + spaced + ')', 'u') };
});
export function findKeywords(text) { const n = normalize(text); return KEYWORD_RES.filter(({ re }) => re.test(n)).map(({ k }) => k); }

export function extractHosts(text) {
  const hosts = [];
  for (const m of String(text ?? '').matchAll(/https?:\/\/([^\s/)\]>"'<]+)/gi)) hosts.push(m[1].toLowerCase().replace(/:\d+$/, '').replace(/^www\./, ''));
  return hosts;
}
const hostIn = (h, list) => list.some((d) => h === d || h.endsWith('.' + d));

/**
 * @param {{ association: string, accountAgeDays: number, publicRepos: number, title?: string, body?: string }} i
 * @returns {{ action: 'none'|'triage'|'spam', reasons: string[] }}
 */
export function classify(i) {
  if (TRUSTED.has(i.association)) return { action: 'none', reasons: [] };
  const text = (i.title ?? '') + '\n' + (i.body ?? '');
  const strong = [], weak = [];
  const flat = squash(text);
  for (const k of findKeywords(text)) strong.push('từ khoá: ' + k);
  const hosts = extractHosts(text);
  for (const h of hosts) if (hostIn(h, SHORTENERS)) strong.push('liên kết rút gọn/nhắn tin: ' + h);
  for (const m of text.matchAll(RISKY_URL)) { const h = m[1].toLowerCase().replace(/^www\./, '').replace(/:\d+$/, ''); if (!hostIn(h, ALLOWED_HOSTS)) { strong.push('liên kết tải tệp thực thi: ' + h); break; } }
  for (const h of hosts) if (!hostIn(h, SHORTENERS) && !hostIn(h, ALLOWED_HOSTS)) { weak.push('liên kết ngoài danh sách: ' + h); break; }
  if (i.accountAgeDays < 7 && i.publicRepos === 0) weak.push('tài khoản dưới 7 ngày, chưa có repo công khai');
  if (strong.length) return { action: 'spam', reasons: strong.concat(weak) };
  // Chỉ cần xem khi có liên kết lạ HOẶC (tài khoản mới và nội dung quá ngắn).
  const tooShort = flat.length < 12;
  if (weak.some((w) => w.startsWith('liên kết')) || (weak.length && tooShort)) return { action: 'triage', reasons: weak };
  return { action: 'none', reasons: weak };
}
