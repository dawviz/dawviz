# Chỉ mục TECHNICAL-DESIGN.md — THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER

nguồn: `TECHNICAL-DESIGN.md` (sha1 cda0d46b82)

| # | Mục | File | Ký tự | ID |
|---|---|---|---|---|
| 0 | THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER (mở đầu) | [thiet-ke-ky-thuat-chi-tiet-technical-design-daw.md](thiet-ke-ky-thuat-chi-tiet-technical-design-daw.md) | 720 |  |
| 1 | 1. Bức tranh tổng thể | [1-buc-tranh-tong-the.md](1-buc-tranh-tong-the.md) | 2420 | ARC-01 |
| 2 | 2. Mô hình dữ liệu và thời gian 🟢 | [2-mo-hinh-du-lieu-va-thoi-gian.md](2-mo-hinh-du-lieu-va-thoi-gian.md) | 2921 | D-50, REQ-AST-02, SOI-19, WARN_TEMPO_RAMP |
| 3 | 3. Đường ống phân tích (parser) 🟢 | [3-duong-ong-phan-tich-parser.md](3-duong-ong-phan-tich-parser.md) | 1875 | ERR_FILE_TOO_LARGE, ERR_UNSUPPORTED_FORMAT, WARN_RPP_ENVELOPES_IGNORED, WARN_RPP_EXTERNAL_MIDI, WARN_RPP_SRC_UNIT |
| 4 | 4. Dữ liệu dẫn xuất (derived) 🟢/⚪ | [4-du-lieu-dan-xuat-derived.md](4-du-lieu-dan-xuat-derived.md) | 780 | OI-05 |
| 5 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.0 Kiểu dáng nốt và bàn phím 🟢 (REQ-GRAPHICS-07) | [5-0-kieu-dang-not-va-ban-phim-req-graphics-07.md](5-0-kieu-dang-not-va-ban-phim-req-graphics-07.md) | 624 | REQ-GRAPHICS-07 |
| 6 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.1 Giao diện chính 🟢 | [5-1-giao-dien-chinh.md](5-1-giao-dien-chinh.md) | 3805 | D-54, ERR_PRESET_INVALID, REQ-STORAGE-02, WARN_PRESET_UNSUPPORTED, WARN_PRESET_VALUE, WARN_PRESET_VERSION… |
| 7 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.2 Hợp đồng widget 🟢 | [5-2-hop-dong-widget.md](5-2-hop-dong-widget.md) | 459 |  |
| 8 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.3 Hệ toạ độ và tỉ lệ 🟡 | [5-3-he-toa-do-va-ti-le.md](5-3-he-toa-do-va-ti-le.md) | 364 |  |
| 9 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.4 Piano Roll 🟢 | [5-4-piano-roll.md](5-4-piano-roll.md) | 714 | D-50 |
| 10 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.5 Quy tắc tất định (kiểm bằng test) | [5-5-quy-tac-tat-dinh-kiem-bang-test.md](5-5-quy-tac-tat-dinh-kiem-bang-test.md) | 640 | REQ-GRAPHICS-05 |
| 11 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.6 Phát sáng động khi chạm 🟢 | [5-6-phat-sang-dong-khi-cham.md](5-6-phat-sang-dong-khi-cham.md) | 1776 | D-50, REQ-GRAPHICS-06, REQ-GRAPHICS-17 |
| 12 | 6. Ứng dụng web và phát lại 🟡 | [6-ung-dung-web-va-phat-lai.md](6-ung-dung-web-va-phat-lai.md) | 4007 | D-50, REQ-UI-02, REQ-UI-14 |
| 13 | 7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) | [7-duong-ong-xuat-video-m3-spike-1-la-co-so.md](7-duong-ong-xuat-video-m3-spike-1-la-co-so.md) | 2020 | AT-03, D-01, ERR_EXPORT_FAILED, ERR_NO_SUPPORTED_ENCODER, REQ-EXPORT-00, REQ-EXPORT-02… |
| 14 | 8. Lưu trữ ⚪ (M4) | [8-luu-tru-m4.md](8-luu-tru-m4.md) | 827 | ERR_PRESET_INVALID |
| 15 | 9. Đa ngôn ngữ 🟢 | [9-da-ngon-ngu.md](9-da-ngon-ngu.md) | 492 |  |
| 16 | 10. Lỗi, ghi nhật ký, quan sát | [10-loi-ghi-nhat-ky-quan-sat.md](10-loi-ghi-nhat-ky-quan-sat.md) | 470 | D-13 |
| 17 | 11. Hiệu năng và bộ nhớ (ngân sách) | [11-hieu-nang-va-bo-nho-ngan-sach.md](11-hieu-nang-va-bo-nho-ngan-sach.md) | 589 | NFR-PERF-05 |
| 18 | 12. Bảo mật và quyền riêng tư | [12-bao-mat-va-quyen-rieng-tu.md](12-bao-mat-va-quyen-rieng-tu.md) | 728 | OI-07 |
| 19 | 13. Xây dựng, kiểm thử, phát hành | [13-xay-dung-kiem-thu-phat-hanh.md](13-xay-dung-kiem-thu-phat-hanh.md) | 906 | D-12, D-35, REQ-CAP-01 |
| 20 | 14. Việc cần làm theo mốc (từ thiết kế này) | [14-viec-can-lam-theo-moc-tu-thiet-ke-nay.md](14-viec-can-lam-theo-moc-tu-thiet-ke-nay.md) | 760 |  |
