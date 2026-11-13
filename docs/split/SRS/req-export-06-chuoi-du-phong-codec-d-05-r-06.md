---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-06: Chuỗi dự phòng codec (D-05, R-06)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-06: Chuỗi dự phòng codec (D-05, R-06)"
chunk: req-export-06-chuoi-du-phong-codec-d-05-r-06.md
source_lines: 755-791
source_sha1: 3d043a49c8
ids: [D-05, D-17, ERR_NO_SUPPORTED_ENCODER, KPI-03, REQ-EXPORT-06]
---
#### REQ-EXPORT-06: Chuỗi dự phòng codec (D-05, R-06)

```text
+----------------------------------------------------------------------------+
| TIER 1 - Maximum compatibility (default)                                   |
| Video: H.264 (AVC), profile/level chosen per D-17                          |
| Audio: AAC (real audio or Silent Audio)                                    |
| Container: MP4 (Mediabunny)                                                |
+----------------------------------------------------------------------------+
                     |  AAC encode unsupported on this OS
                                      v
+----------------------------------------------------------------------------+
| TIER 2 - Video-only MP4                                                    |
| Video: H.264 (AVC)                                                         |
| Audio: none                                                                |
| Container: MP4                                                             |
| Notice: file has no audio because the OS lacks an AAC encoder              |
+----------------------------------------------------------------------------+
                         |  H.264 encode unsupported
                                      v
+----------------------------------------------------------------------------+
| TIER 3 - Open standards fallback                                           |
| Video: VP9 (or VP8)                                                        |
| Audio: Opus (or none)                                                      |
| Container: WebM (Mediabunny)                                               |
| Notice: WebM output because the browser lacks H.264                        |
+----------------------------------------------------------------------------+
                           |  no supported encoder
                                      v
+----------------------------------------------------------------------------+
| TIER 4 - Fatal error                                                       |
| Abort export, show ERR_NO_SUPPORTED_ENCODER                                |
+----------------------------------------------------------------------------+
```

KPI-03 chỉ áp dụng cho Tier 1. Từ Tier 2 trở đi, người dùng được thông báo rõ phiên bản đầu ra khác mặc định.
