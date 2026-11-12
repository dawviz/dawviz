# Spike 2: Parser và Unified AST

> Báo cáo gốc của chủ dự án ở **giai đoạn đầu** của Spike 2, đưa vào repo ngày 2026-11-12 (đã bỏ các chú thích trích dẫn nội bộ). Sau báo cáo này, Spike 2 tiếp tục và đã vượt các hạn chế nêu bên dưới. Mục cuối ghi trạng thái hiện tại của từng điểm.

## 1. Tổng quan

* **Mục tiêu:** đọc tệp dự án DAW (`.als`, `.rpp`, `.dawproject`, `.mid`) và chuẩn hoá về `UnifiedProjectAST`, chạy hoàn toàn phía client trong Web Worker để không chặn giao diện.
* **Đã làm (tại thời điểm báo cáo):**
  * `parser-core.js` và `parser-worker.js` với lớp bảo vệ cơ bản: giới hạn kích thước tệp, chống zip-bomb, kiểm độ sâu XML.
  * Đọc ổn định **Standard MIDI File**: giải mã sự kiện, quy đổi thời gian qua TempoMap, ghép cặp Note-On/Off theo FIFO.
  * Trang thử `index.html` có Worker và hàm so sánh AST (`compareAST`) với tệp MIDI tham chiếu.

## 2. Hạn chế ghi nhận lúc đó

* **Độ hoàn thiện theo định dạng:** mới kiểm đầy đủ `.mid`; `.als`, `.rpp`, `.dawproject` mới dựng khung logic theo cấu trúc XML/văn bản dự kiến, chưa kiểm bằng nhiều tệp mẫu (OI-01).
* **Dump cây cấu trúc:** nút in cây cấu trúc trên giao diện chưa chạy trơn tru, chưa phản ánh đủ các tầng của dự án phức tạp.
* **Fallback tempo 120 BPM:** tự động về 120 BPM khi thiếu tempo là hạn chế; sản phẩm chính cần cho người dùng thêm mốc tempo hoặc offset tuỳ ý.

## 3. Bài học và đề xuất

* Thu thập bộ tệp mẫu thật đa dạng để tinh chỉnh parser cho từng DAW (OI-01).
* Tách toàn bộ logic parse thành **thư viện độc lập** để dễ bảo trì, viết unit test và tái sử dụng.
* Thêm widget **Progress Bar** vào bộ widget.

## 4. Kế hoạch hành động lúc đó

1. Thu thập tệp mẫu thật để kiểm lại parser `.als`, `.rpp`, `.dawproject`.
2. Sửa và hoàn thiện dump cây cấu trúc để debug trực quan.
3. Thiết kế giao diện thêm mốc tempo/offset thủ công thay cho fallback cứng.
4. Lên phương án tách parser thành thư viện độc lập cho v1.0.

## 5. Trạng thái hiện tại (tài liệu v1.1)

| Điểm trong báo cáo | Hiện nay | Ghi ở |
|---|---|---|
| Chỉ `.mid` được kiểm | ✅ Đã kiểm `.als` (Live 9.1, 12.4), `.alp`, `.rpp` (Reaper 7.85, đối chiếu số đo trong Reaper), `.dawproject` (ví dụ chính thức Bitwig 5.0), nhị phân theo schema; **66 test** | PARSER-TDD; PROGRESS mục 1 |
| Còn thiếu tệp mẫu đa dạng | 🔄 Chương trình tệp mẫu | BRD OI-01, D-45 |
| Dump cây cấu trúc | ✅ Thay bằng **inventory** (`alsInventory`, inventory DAWproject): liệt kê đường dẫn thật trong tệp; nút "List structure (inventory)" trong `apps/parser-lab` | PARSER-SDD; `apps/parser-lab/index.html` |
| Fallback 120 BPM ngầm | ✅ Không đoán ngầm: `WARN_TEMPO_FALLBACK` + **ghi đè tempo theo mốc** (giây, beat, `Bar.Beat`) và dấu nhịp; giao diện nhập ghi đè ở M4 | BRD D-24, D-29, D-31; SRS REQ-PARSER-07 |
| Tách thư viện riêng | ✅ Các gói `@dawviz/parser-*` zero-dependency, có bundle một tệp và CLI `dawparse` | BRD D-23; SRS §2.5; `packages/README.md` |
| Widget Progress Bar | ✅ Thuộc 8 widget cốt lõi | BRD D-27; SRS REQ-WIDGET-08 |
