---
doc: COMMUNITY-MODERATION.md
doc_title: "Kiểm soát issue, bình luận và đóng góp (T-39)"
section: "1. Các lớp phòng thủ (đã có trong repo)"
path: "1. Các lớp phòng thủ (đã có trong repo)"
chunk: 1-cac-lop-phong-thu-da-co-trong-repo.md
source_lines: 5-20
source_sha1: 3851679b18
ids: []
---
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
