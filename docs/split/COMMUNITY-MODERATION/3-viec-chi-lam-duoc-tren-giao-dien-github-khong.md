---
doc: COMMUNITY-MODERATION.md
doc_title: "Kiểm soát issue, bình luận và đóng góp (T-39)"
section: "3. Việc chỉ làm được trên giao diện GitHub (không nằm trong mã)"
path: "3. Việc chỉ làm được trên giao diện GitHub (không nằm trong mã)"
chunk: 3-viec-chi-lam-duoc-tren-giao-dien-github-khong.md
source_lines: 30-36
source_sha1: 3851679b18
ids: []
---
## 3. Việc chỉ làm được trên giao diện GitHub (không nằm trong mã)

- Bật **Discussions** cho repo (`config.yml` trỏ tới đó).
- Tạo nhãn: `spam`, `needs-triage`, `feedback`, `test-result`, `sample-file`, `preset-report`, `moderator-nomination`.
- Đội `reviewers` đã tạo (2026-11-25), hiện chỉ có chủ dự án. **Việc để sau:** khi có người thứ hai, thêm họ vào đội rồi thêm `@dawviz/reviewers` vào `.github/CODEOWNERS`.
- Bảo vệ nhánh `main`: bắt buộc PR, bắt buộc các kiểm `CI` và `DCO` đạt (chỉ chọn được sau khi hai workflow đã chạy ít nhất một lần).
- Khi cần: Interaction limits (mục 2). **Không** bật thường trực: sẽ chặn cả người dùng thật gửi góp ý.
