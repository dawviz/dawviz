# Kiểm soát issue, bình luận và đóng góp (T-39)

> Cách dự án chặn spam và bot trên GitHub mà không làm phiền người dùng thật. Mã: `scripts/community/`, workflow: `.github/workflows/`.

## 1. Các lớp phòng thủ (đã có trong repo)

| Lớp | Ở đâu | Làm gì |
|---|---|---|
| Không có issue trống | `.github/ISSUE_TEMPLATE/config.yml` | `blank_issues_enabled: false`; câu hỏi chung đi sang Discussions |
| Issue Form có trường bắt buộc | `feedback.yml`, `test-result.yml`, `sample-file.yml`, `preset-report.yml`, `nominate-moderator.yml` | Có hộp xác nhận bắt buộc; bot gọi API tạo issue thô không qua form |
| Lọc spam tự động | `anti-spam.yml` + `scripts/community/antispam.mjs` | Tín hiệu **mạnh** (từ khoá spam kể cả viết lách như `c.r.y.p.t.o`, liên kết rút gọn/nhắn tin, tệp thực thi): nhãn `spam`, đóng, khoá (bình luận: ẩn dạng spam). Tín hiệu **yếu** (tài khoản dưới 7 ngày chưa có repo, liên kết ngoài danh sách): chỉ nhãn `needs-triage` |
| Người đã tin cậy được bỏ qua | `antispam.mjs` | `OWNER`, `MEMBER`, `COLLABORATOR`, `CONTRIBUTOR` không bao giờ bị lọc |
| DCO | `dco.yml` + `scripts/community/dco-check.mjs` | PR có commit thiếu `Signed-off-by` thì CI đỏ (bỏ qua commit merge và bot) |
| Người duyệt | `.github/CODEOWNERS` | PR đụng `presets/`, `assets/`, `packages/expr/`, `.github/` cần chủ sở hữu duyệt |
| Nội dung cộng đồng | `community.yml` + `build-index.mjs` | Mọi preset qua `preset-check --community`; tài nguyên cần `meta.json` (giấy phép SPDX cho phép, tác giả, nguồn), ≤ 2 MB; `presets/index.json` có băm SHA-256 |

**Tránh báo oan:** từ khoá được khớp theo ranh giới từ ("for example" không thành "forex"), chỉ coi liên kết tải `.exe`… là spam khi nằm ngoài danh sách tên miền tin cậy, và không dùng từ khoá `crypto` trơn vì ứng dụng dùng `crypto.subtle`. Mọi thay đổi bộ lọc phải kèm test ở `scripts/community/community.test.mjs`. Chưa lọc PR của người lạ (chỉ issue và bình luận).

**Vì sao không đóng mọi tài khoản mới:** ứng dụng là bản demo công khai, người thử đầu tiên rất hay có tài khoản GitHub mới. Đóng oan họ tệ hơn để lọt một vài spam. Nên chỉ đóng khi có dấu hiệu rõ.

## 2. Khi bị tấn công dồn dập ("nút đỏ")

Dấu hiệu: hàng chục issue trong vài phút; hàng loạt tài khoản tên ngẫu nhiên, avatar mặc định cùng Star/Fork; issue thăm dò chỉ có "." hoặc "help"; bình luận khen kèm liên kết lạ vào issue cũ.

1. **Settings → Moderation options → Interaction limits** → *Limit to existing users* (chặn tài khoản dưới 24 giờ) hoặc *Limit to prior contributors*, đặt 24 giờ rồi gia hạn nếu cần. Nên bật chủ động 24–48 giờ khi dự án vừa lên Trending, Reddit hoặc Hacker News.
2. **Đừng Close hàng loạt**: mỗi lần đóng gửi một email tới mọi người đang Watch. Xoá hẳn bằng GraphQL `deleteIssue` (cần quyền admin), hoặc nhờ GitHub Support gỡ tài khoản.
3. **Block user** (Settings → Moderation options → Blocked users) và **Report content** để GitHub xử lý tài khoản.
4. Nếu bot lách được bộ lọc: thêm từ khoá hoặc tên miền vào `antispam.mjs` kèm test ở `scripts/community/community.test.mjs`.

## 3. Việc chỉ làm được trên giao diện GitHub (không nằm trong mã)

- Bật **Discussions** cho repo (`config.yml` trỏ tới đó).
- Tạo nhãn: `spam`, `needs-triage`, `feedback`, `test-result`, `sample-file`, `preset-report`, `moderator-nomination`.
- Đội `reviewers` đã tạo (2026-11-25), hiện chỉ có chủ dự án. **Việc để sau:** khi có người thứ hai, thêm họ vào đội rồi thêm `@dawviz/reviewers` vào `.github/CODEOWNERS`.
- Bảo vệ nhánh `main`: bắt buộc PR, bắt buộc các kiểm `CI` và `DCO` đạt (chỉ chọn được sau khi hai workflow đã chạy ít nhất một lần).
- Khi cần: Interaction limits (mục 2). **Không** bật thường trực: sẽ chặn cả người dùng thật gửi góp ý.
