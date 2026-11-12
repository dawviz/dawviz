---
doc: SDD.md
doc_title: "TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER"
section: "8. Tình trạng (M1 — khung đầu)"
path: "8. Tình trạng (M1 — khung đầu)"
chunk: 8-tinh-trang-m1-khung-dau.md
source_lines: 79-81
source_sha1: b1d59a382a
ids: []
---
## 8. Tình trạng (M1 — khung đầu)

Đã có và đã chạy test: Render Core (5 test), logic ứng dụng (đồng hồ, dịch lỗi: 4 test), parser (66 test). **Chưa được dựng/chạy thử:** `apps/web` (React/Vite/Tailwind/Framer Motion, kiểm thử thành phần) vì môi trường tạo gói không cho cài thư viện npm; cần `npm install` rồi `npm run build` và `npm run dev` trên máy có mạng, sau đó xử lý lỗi biên dịch nếu có. Các mục chưa làm của M1: chọn lớp phủ Track Info đầy đủ, chỉnh ngưỡng `floorDb`/`ceilDb` trong giao diện, nhập tempo ghi đè trong giao diện (M4).
