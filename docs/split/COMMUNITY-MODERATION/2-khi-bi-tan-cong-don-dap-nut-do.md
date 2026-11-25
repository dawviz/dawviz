---
doc: COMMUNITY-MODERATION.md
doc_title: "Kiểm soát issue, bình luận và đóng góp (T-39)"
section: "2. Khi bị tấn công dồn dập (\"nút đỏ\")"
path: "2. Khi bị tấn công dồn dập (\"nút đỏ\")"
chunk: 2-khi-bi-tan-cong-don-dap-nut-do.md
source_lines: 21-29
source_sha1: 3851679b18
ids: []
---
## 2. Khi bị tấn công dồn dập ("nút đỏ")

Dấu hiệu: hàng chục issue trong vài phút; hàng loạt tài khoản tên ngẫu nhiên, avatar mặc định cùng Star/Fork; issue thăm dò chỉ có "." hoặc "help"; bình luận khen kèm liên kết lạ vào issue cũ.

1. **Settings → Moderation options → Interaction limits** → *Limit to existing users* (chặn tài khoản dưới 24 giờ) hoặc *Limit to prior contributors*, đặt 24 giờ rồi gia hạn nếu cần. Nên bật chủ động 24–48 giờ khi dự án vừa lên Trending, Reddit hoặc Hacker News.
2. **Đừng Close hàng loạt**: mỗi lần đóng gửi một email tới mọi người đang Watch. Xoá hẳn bằng GraphQL `deleteIssue` (cần quyền admin), hoặc nhờ GitHub Support gỡ tài khoản.
3. **Block user** (Settings → Moderation options → Blocked users) và **Report content** để GitHub xử lý tài khoản.
4. Nếu bot lách được bộ lọc: thêm từ khoá hoặc tên miền vào `antispam.mjs` kèm test ở `scripts/community/community.test.mjs`.
