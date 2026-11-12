---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "5. Khoảng trống kiểm thử (cần dữ liệu thật, xem SRS §6)"
path: "5. Khoảng trống kiểm thử (cần dữ liệu thật, xem SRS §6)"
chunk: 5-khoang-trong-kiem-thu-can-du-lieu-that-xem-srs.md
source_lines: 74-81
source_sha1: 42e0660dc8
ids: [KPI-01]
---
## 5. Khoảng trống kiểm thử (cần dữ liệu thật, xem SRS §6)
1. `.rpp`: MIDI nhúng, take, loop, pooled, SOFFS đã được kiểm bằng 2 dự án thật (đã đối chiếu oracle Python độc lập: `BigProjectDemo.rpp` 13 MB, 107 item, 96 nguồn MIDI → 7497 nốt khớp tuyệt đối; file này quá lớn nên không đưa vào repo). `.mid` ngoài thật đã kiểm (BigProject3.rpp + Oboe_MIDI_001.mid → 3147 nốt, khớp đọc trực tiếp `.mid`). Còn thiếu đối chứng độc lập cho `IGNTEMPO 1` (đã có dự án thật) và mẫu envelope tempo cong (`HASDATA` ≠ QN xử lý bằng guard clause).
2. `.dawproject` thật: tempo/nhịp automation, đơn vị giây, clip lồng nhiều tầng.
3. Clip `StartRelative ≠ 0`; nhịp ≠ 4/4; tempo automation thật (công thức enum nhịp suy từ 1 mẫu).
4. KPI-01 end-to-end (dự án + MIDI xuất từ chính DAW) — hạ tầng sẵn sàng (`--ref`, trang demo).
5. Hiệu năng/bộ nhớ với file lớn (> 50 MB) và trình duyệt di động.
6. ZIP64, mã hóa, phương thức nén lạ — chỉ kiểm mã lỗi theo thiết kế, chưa có file mẫu.
