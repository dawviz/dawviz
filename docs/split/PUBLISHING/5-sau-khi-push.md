---
doc: PUBLISHING.md
doc_title: "Xuất bản lần đầu lên GitHub"
section: "5. Sau khi push"
path: "5. Sau khi push"
chunk: 5-sau-khi-push.md
source_lines: 68-76
source_sha1: 02fa1bd49a
ids: []
---
## 5. Sau khi push

1. **Lockfile:** `package-lock.json` sinh ra ở bước 2 đã được commit. Sửa `.github/workflows/ci.yml`: đổi `npm install` thành `npm ci` và thêm `cache: npm` cho `actions/setup-node`.
2. **Bật trang tài liệu:** Settings → Pages → Source = **GitHub Actions**. Workflow `docs.yml` chạy khi `docs/**` đổi (hoặc Actions → Docs site → Run workflow). Địa chỉ: `https://<tên>.github.io/<repo>/`. Workflow tự đặt `repoUrl` để có nút "Chỉnh sửa trang này".
3. **Xem CI:** tab Actions → CI phải xanh. Hai workflow được viết tay và **chưa chạy thử**, lỗi ở lần đầu là bình thường; đọc log và sửa.
4. **Bảo vệ nhánh** (tùy chọn nhưng nên làm): Settings → Branches → rule cho `main`: yêu cầu pull request và CI xanh.
5. Bật Issues, Discussions (nếu muốn cộng đồng dịch/hỏi đáp); gắn nhãn `good first issue`, `translation`, `sample-needed`.
6. Tạo tag phát hành đầu: `git tag v0.1.0 && git push --tags` khi M1 chạy được.
