# Chỉ mục TECHNICAL-DESIGN.md — THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER

nguồn: `TECHNICAL-DESIGN.md` (sha1 03d31db5d8)

| # | Mục | File | Ký tự | ID |
|---|---|---|---|---|
| 0 | THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER (mở đầu) | [thiet-ke-ky-thuat-chi-tiet-technical-design-daw.md](thiet-ke-ky-thuat-chi-tiet-technical-design-daw.md) | 720 |  |
| 1 | 1. Bức tranh tổng thể | [1-buc-tranh-tong-the.md](1-buc-tranh-tong-the.md) | 2420 | ARC-01 |
| 2 | 2. Mô hình dữ liệu và thời gian 🟢 | [2-mo-hinh-du-lieu-va-thoi-gian.md](2-mo-hinh-du-lieu-va-thoi-gian.md) | 2921 | D-50, REQ-AST-02, SOI-19, WARN_TEMPO_RAMP |
| 3 | 3. Đường ống phân tích (parser) 🟢 | [3-duong-ong-phan-tich-parser.md](3-duong-ong-phan-tich-parser.md) | 1875 | ERR_FILE_TOO_LARGE, ERR_UNSUPPORTED_FORMAT, WARN_RPP_ENVELOPES_IGNORED, WARN_RPP_EXTERNAL_MIDI, WARN_RPP_SRC_UNIT |
| 4 | 4. Dữ liệu dẫn xuất (derived) 🟢/⚪ | [4-du-lieu-dan-xuat-derived.md](4-du-lieu-dan-xuat-derived.md) | 1495 | OI-05 |
| 5 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.0 Kiểu dáng nốt và bàn phím 🟢 (REQ-GRAPHICS-07) | [5-0-kieu-dang-not-va-ban-phim-req-graphics-07.md](5-0-kieu-dang-not-va-ban-phim-req-graphics-07.md) | 624 | REQ-GRAPHICS-07 |
| 6 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.1 Giao diện chính 🟢 | [5-1-giao-dien-chinh.md](5-1-giao-dien-chinh.md) | 5650 | D-54, D-56, ERR_PRESET_INVALID, REQ-STORAGE-02, WARN_PRESET_UNSUPPORTED, WARN_PRESET_VALUE… |
| 7 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.2 Hợp đồng widget 🟢 | [5-2-hop-dong-widget.md](5-2-hop-dong-widget.md) | 459 |  |
| 8 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.3 Hệ toạ độ và tỉ lệ 🟡 | [5-3-he-toa-do-va-ti-le.md](5-3-he-toa-do-va-ti-le.md) | 364 |  |
| 9 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.4 Piano Roll 🟢 | [5-4-piano-roll.md](5-4-piano-roll.md) | 714 | D-50 |
| 10 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.5 Quy tắc tất định (kiểm bằng test) | [5-5-quy-tac-tat-dinh-kiem-bang-test.md](5-5-quy-tac-tat-dinh-kiem-bang-test.md) | 640 | REQ-GRAPHICS-05 |
| 11 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.6 Phát sáng động khi chạm 🟢 | [5-6-phat-sang-dong-khi-cham.md](5-6-phat-sang-dong-khi-cham.md) | 1776 | D-50, REQ-GRAPHICS-06, REQ-GRAPHICS-17 |
| 12 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.7 Primitive chữ và nạp phông 🟢 (T-69, SRS REQ-WIDGET-02) | [5-7-primitive-chu-va-nap-phong-t-69-srs-req-widg.md](5-7-primitive-chu-va-nap-phong-t-69-srs-req-widg.md) | 4996 | ERR_FONT_LOAD, NFR-SEC-03, REQ-STORAGE-05, REQ-WIDGET-02 |
| 13 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.8 Dữ liệu cho widget Bar.Beat: AST đã có bản đồ nhịp 🟢 (đã dùng ở T-69) | [5-8-du-lieu-cho-widget-bar-beat-ast-da-co-ban-do.md](5-8-du-lieu-cho-widget-bar-beat-ast-da-co-ban-do.md) | 925 | REQ-WIDGET-05 |
| 14 | 5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.9 Kiểu chữ cho mọi chữ trong video 🟢 (T-72, SRS REQ-GRAPHICS-18, D-58) | [5-9-kieu-chu-cho-moi-chu-trong-video-t-72-srs-re.md](5-9-kieu-chu-cho-moi-chu-trong-video-t-72-srs-re.md) | 6552 | D-58, REQ-GRAPHICS-18, REQ-STORAGE-05, WARN_PRESET_FONT_MISSING, WARN_PRESET_VALUE |
| 15 | 6. Ứng dụng web và phát lại 🟡 > 6.1 Trạng thái | [6-1-trang-thai.md](6-1-trang-thai.md) | 1256 | REQ-UI-14 |
| 16 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) | [6-2-phat-lai-va-am-thanh-t-08-da-duyet-kem-8-chi.md](6-2-phat-lai-va-am-thanh-t-08-da-duyet-kem-8-chi.md) | 233 | NFR-SEC-04, REQ-EXPORT-03, REQ-PARSER-00, REQ-STORAGE-05, REQ-UI-03, REQ-WIDGET-07 |
| 17 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.1 Nạp tệp âm thanh (mix) | [6-2-1-nap-tep-am-thanh-mix.md](6-2-1-nap-tep-am-thanh-mix.md) | 3263 | ARC-03, ERR_AUDIO_DECODE, ERR_AUDIO_TOO_LONG, ERR_FILE_TOO_LARGE, NFR-PERF-04, REQ-AUDIO-01… |
| 18 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.2 Đồng hồ chủ | [6-2-2-dong-ho-chu.md](6-2-2-dong-ho-chu.md) | 4556 |  |
| 19 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.3 Offset âm thanh so với dự án | [6-2-3-offset-am-thanh-so-voi-du-an.md](6-2-3-offset-am-thanh-so-voi-du-an.md) | 1992 | REQ-UI-15, REQ-WIDGET-07 |
| 20 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.4 Phát / dừng / tua / lặp / về đầu | [6-2-4-phat-dung-tua-lap-ve-dau.md](6-2-4-phat-dung-tua-lap-ve-dau.md) | 1439 | REQ-UI-03 |
| 21 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.5 Sóng âm cho thanh tua (việc để dành từ T-70) | [6-2-5-song-am-cho-thanh-tua-viec-de-danh-tu-t-70.md](6-2-5-song-am-cho-thanh-tua-viec-de-danh-tu-t-70.md) | 1211 | REQ-WIDGET-07 |
| 22 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.6 Cảnh báo lệch độ dài | [6-2-6-canh-bao-lech-do-dai.md](6-2-6-canh-bao-lech-do-dai.md) | 826 | REQ-PARSER-07, WARN_AUDIO_LENGTH |
| 23 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.7 Dữ liệu giữ lại cho T-09 (xuất video, §7) | [6-2-7-du-lieu-giu-lai-cho-t-09-xuat-video-7.md](6-2-7-du-lieu-giu-lai-cho-t-09-xuat-video-7.md) | 1023 | AT-03, REQ-EXPORT-03 |
| 24 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.8 Kiểm thử (thuần, không cần trình duyệt) | [6-2-8-kiem-thu-thuan-khong-can-trinh-duyet.md](6-2-8-kiem-thu-thuan-khong-can-trinh-duyet.md) | 1014 | ERR_AUDIO_DECODE, ERR_AUDIO_TOO_LONG, ERR_FILE_TOO_LARGE |
| 25 | 6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.9 Quyết định đã duyệt | [6-2-9-quyet-dinh-da-duyet.md](6-2-9-quyet-dinh-da-duyet.md) | 672 |  |
| 26 | 6. Ứng dụng web và phát lại 🟡 > 6.3 Danh sách track 🟢 | [6-3-danh-sach-track.md](6-3-danh-sach-track.md) | 1860 | D-50, REQ-UI-14 |
| 27 | 6. Ứng dụng web và phát lại 🟡 > 6.4 Store, lệnh, hoàn tác và chế độ chỉnh sửa 🟢 (T-07; giao diện kéo thả widget ⚪ T-68) | [6-4-store-lenh-hoan-tac-va-che-do-chinh-sua-t-07.md](6-4-store-lenh-hoan-tac-va-che-do-chinh-sua-t-07.md) | 18818 | ARC-05, D-55, D-57, ERR_PRESET_, ERR_PRESET_INVALID, ERR_PRESET_TOO_LARGE… |
| 28 | 7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) > 7.1 Trình tự | [7-1-trinh-tu.md](7-1-trinh-tu.md) | 1019 | REQ-EXPORT-00, REQ-EXPORT-02, REQ-EXPORT-06 |
| 29 | 7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) > 7.2 Quyết định kỹ thuật | [7-2-quyet-dinh-ky-thuat.md](7-2-quyet-dinh-ky-thuat.md) | 947 | AT-03, D-01, ERR_EXPORT_FAILED, ERR_NO_SUPPORTED_ENCODER, SOI-10 |
| 30 | 7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) > 7.3 Phần lõi thuần đã làm (T-09, 2026-11-14) | [7-3-phan-loi-thuan-da-lam-t-09-2026-11-14.md](7-3-phan-loi-thuan-da-lam-t-09-2026-11-14.md) | 1745 | D-26, ERR_NO_SUPPORTED_ENCODER, REQ-EXPORT-00, REQ-EXPORT-01, REQ-EXPORT-02, REQ-EXPORT-03… |
| 31 | 7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở) > 7.4 Export Worker và giao diện (T-09, 2026-11-14) | [7-4-export-worker-va-giao-dien-t-09-2026-11-14.md](7-4-export-worker-va-giao-dien-t-09-2026-11-14.md) | 2905 | AT-03, AT-05, D-04, D-26, ERR_EXPORT_FAILED, REQ-EXPORT-02… |
| 32 | 8. Lưu trữ ⚪ (M4) | [8-luu-tru-m4.md](8-luu-tru-m4.md) | 1035 | ERR_PRESET_INVALID, ERR_SCHEMA_NEWER, WARN_PRESET_MIGRATED |
| 33 | 9. Đa ngôn ngữ 🟢 | [9-da-ngon-ngu.md](9-da-ngon-ngu.md) | 492 |  |
| 34 | 10. Lỗi, ghi nhật ký, quan sát | [10-loi-ghi-nhat-ky-quan-sat.md](10-loi-ghi-nhat-ky-quan-sat.md) | 470 | D-13 |
| 35 | 11. Hiệu năng và bộ nhớ (ngân sách) | [11-hieu-nang-va-bo-nho-ngan-sach.md](11-hieu-nang-va-bo-nho-ngan-sach.md) | 885 | NFR-PERF-04, NFR-PERF-05 |
| 36 | 12. Bảo mật và quyền riêng tư | [12-bao-mat-va-quyen-rieng-tu.md](12-bao-mat-va-quyen-rieng-tu.md) | 728 | OI-07 |
| 37 | 13. Xây dựng, kiểm thử, phát hành | [13-xay-dung-kiem-thu-phat-hanh.md](13-xay-dung-kiem-thu-phat-hanh.md) | 906 | D-12, D-35, REQ-CAP-01 |
| 38 | 14. Việc cần làm theo mốc (từ thiết kế này) | [14-viec-can-lam-theo-moc-tu-thiet-ke-nay.md](14-viec-can-lam-theo-moc-tu-thiet-ke-nay.md) | 760 |  |
