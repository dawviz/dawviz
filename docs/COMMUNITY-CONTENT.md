# Tài nguyên (assets) và bộ kiểu (presets) do cộng đồng đóng góp

> Cách tổ chức thư mục `presets/` và `assets/`, định dạng tệp, quy tắc giấy phép và kế hoạch tách thành **repo riêng** để cộng đồng đóng góp mà không cần đụng vào mã ứng dụng.

## 1. Hiện trạng và mục tiêu

* **Hiện tại** (trong repo chính): thư mục `presets/` có vài bộ kiểu nốt mẫu (kiểm bằng test) và `assets/` có chỗ cho phông chữ và ảnh nền (đang trống, chỉ có hướng dẫn).
* **Mục tiêu:** tách `presets/` và `assets/` thành repo riêng (tên dự kiến `dawviz-community`) để cộng đồng đóng góp bằng pull request; ứng dụng đọc danh mục từ repo đó khi chạy. Repo chính chỉ giữ một bộ nhỏ dựng sẵn.

## 2. Cấu trúc

```text
presets/
  schema/note-style.schema.json   JSON Schema cho preset kiểu nốt
  note-style/<slug>.json          một preset một tệp
assets/
  fonts/<slug>/                   phông + LICENSE + meta.json
  backgrounds/<slug>/             ảnh nền + LICENSE + meta.json
```

Sau khi tách repo, thêm `index.json` (danh mục sinh tự động, có băm SHA-256 từng tệp) ở gốc repo cộng đồng.

## 3. Định dạng preset kiểu nốt

```json
{
  "schemaVersion": "0.1.0",
  "kind": "note-style",
  "name": "Neon",
  "author": "DAW Visualizer team",
  "license": "Apache-2.0",
  "description": "Nốt mảnh, phát sáng mạnh, sáng cả khi chờ.",
  "style": { "cornerRadius": 4, "heightScale": 0.7, "glow": 0.9 }
}
```

* `style` là một phần của `NoteStyle` (REQ-GRAPHICS-07): chỉ ghi trường khác mặc định; trường lạ bị bỏ qua, giá trị ngoài miền bị kẹp khi nạp (REQ-STORAGE-02).
* Tệp phải là JSON hợp lệ, dưới 16 KB, tên tệp là slug chữ thường `a-z0-9-`.
* Trường `license` bắt buộc, giá trị SPDX (ví dụ `CC0-1.0`, `Apache-2.0`, `CC-BY-4.0`).

## 4. Quy tắc cho assets

* Chỉ nhận tệp **bạn có quyền phân phối**: tự tạo, hoặc giấy phép cho phép phân phối lại (CC0, CC-BY, OFL cho phông, MIT/Apache). **Không nhận** tệp không rõ nguồn.
* Mỗi tài nguyên nằm trong thư mục riêng có `LICENSE` (hoặc dòng SPDX trong `meta.json`), `meta.json` ghi tên, tác giả, nguồn, giấy phép, và (với CC-BY) dòng ghi công cần hiển thị.
* Ưu tiên tệp nhỏ (ảnh nền ≤ 2 MB, phông WOFF2).
* Phông chữ ngoài repo (người dùng tự nạp) vẫn dùng được; xem REQ-GRAPHICS cho việc nạp phông trước khi xuất.

## 5. Cách đóng góp

1. Fork, thêm tệp vào đúng thư mục, chạy `npm test` (kiểm schema và giá trị). Commit bằng `git commit -s` để có dòng `Signed-off-by` (DCO, D-42).
2. Mở pull request, ghi nguồn và giấy phép; kiểm duyệt viên cộng đồng duyệt theo D-43 ([design/EXPRESSIONS.md](design/EXPRESSIONS.md) §6.4).
3. Gỡ tài nguyên khi chủ sở hữu yêu cầu hợp lệ.

## 6. Kế hoạch tách repo (T-16)

1. Tạo repo `dawviz-community` (giấy phép theo từng tài nguyên; mã công cụ Apache-2.0).
2. Chuyển `presets/` và `assets/`, thêm CI: kiểm schema, kích thước, có `LICENSE`, sinh `index.json` và băm.
3. Ứng dụng: màn hình "Thư viện" nạp `index.json` qua HTTPS, kiểm schema và băm trước khi dùng, hoạt động được khi ngoại tuyến (chỉ dùng bộ dựng sẵn).
4. Repo chính giữ lại `presets/` mẫu nhỏ để test chạy không cần mạng.

Quy trình kiểm duyệt (CI tự động, 2 người duyệt, phát hành theo băm, thu hồi) và mô hình bảo mật: xem [design/EXPRESSIONS.md](design/EXPRESSIONS.md) mục 5–6.

Các loại preset mới (`note-transition`, `easing`, `particle`, `theme`, `scene`), luồng "Chia sẻ thành preset" trong ứng dụng và tài nguyên của phiên: xem [design/CUSTOMIZATION.md](design/CUSTOMIZATION.md) mục 6.
