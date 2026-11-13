---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "2.3. Thành phần bên thứ ba"
path: "2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC > 2.3. Thành phần bên thứ ba"
chunk: 2-3-thanh-phan-ben-thu-ba.md
source_lines: 197-211
source_sha1: 0b10d2a1a5
ids: [ARC-01, D-04, D-23, D-34, D-36, OI-05, OI-07, REQ-STORAGE-01, REQ-WIDGET-06]
---
### 2.3. Thành phần bên thứ ba

| Thành phần | Vai trò | Ghi chú |
| :--- | :--- | :--- |
| @dawviz/parser-* | Đọc `.als/.alp/.rpp/.dawproject/.mid` và binary theo schema; zero-dependency; bản bundle một file cho Worker | Tự giải nén bằng `DecompressionStream` (D-23, mục 2.5). |
| Mediabunny | Ghép luồng MP4/WebM | Thay `mp4-muxer` đã deprecated (D-04); bọc sau `MuxerAdapter` (R-07). |
| WebCodecs API | Mã hóa video/audio | Phụ thuộc trình duyệt và hệ điều hành (R-06). |
| React, Vite, Tailwind CSS, Framer Motion | Giao diện ứng dụng (D-34) | Chỉ ở `apps/web`; khung hình xuất không dùng React hay Framer Motion. |
| @dawviz/render-core | Bố cục + vẽ khung hình thuần theo `t` (ARC-01) | Hàm thuần, TypeScript, không phụ thuộc DOM (D-36). |
| fflate | Nén/giải nén ZIP | Cho Project Pack; parser file dự án không dùng fflate. |
| Dexie.js | Bao bọc IndexedDB | Tự động lưu phiên (REQ-STORAGE-01). |
| @tonaljs/chord-detect | Nhận diện hợp âm | Động cơ cốt lõi cho REQ-WIDGET-06 (OI-05). |

Giấy phép thư viện và font đóng gói kèm phải được rà soát (OI-07).
