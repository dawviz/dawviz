---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-03: DAWproject (`.dawproject`, D-03)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-03: DAWproject (`.dawproject`, D-03)"
chunk: req-parser-03-dawproject-dawproject-d-03.md
source_lines: 298-308
source_sha1: baed28c4a6
ids: [D-03, ERR_ARCHIVE_INVALID, OI-01, REQ-PARSER-03, SOI-04, SOI-06, WARN_TIME_UNIT_MIXED]
---
#### REQ-PARSER-03: DAWproject (`.dawproject`, D-03)
Cấu trúc XML cần đối chiếu đặc tả chính thức và file mẫu **[VERIFY]** (OI-01, SOI-04). Định dạng do Bitwig Studio và PreSonus Studio One xuất.

* Giải nén ZIP trong bộ nhớ; bắt buộc có `project.xml` (thiếu thì `ERR_ARCHIVE_INVALID`); `metadata.xml` tùy chọn (`Title`, `Artist`).
* Transport: đọc tempo và time-signature.
* Track: chỉ lấy track có `contentType` chứa `notes` **[VERIFY]**.
* Clip và nốt: `time`, `duration`, `playStart`, `loopStart`, `loopEnd`, `contentTimeUnit`; `Note@time/duration/key/vel/channel`. `vel` trong 0–1 nhân 127 (lớn hơn 1 coi là thang 127). Đơn vị `beats` nhân 960; `seconds` quy đổi qua TempoMap (`WARN_TIME_UNIT_MIXED` khi trộn). Clip lồng clip được đệ quy; `playStart` bỏ nốt trước điểm bắt đầu; `loopStart/loopEnd` lặp đến hết clip.
* Track nốt: `contentType` chứa `notes`, loại kênh `role="master"`. Mute từ `Channel/Mute@value`.
* Tempo: `Transport/Tempo@value`; tempo/nhịp automation (`TempoAutomation`, `TimeSignatureAutomation`) **[VERIFY SOI-06]**; tempo tính bằng giây chưa hỗ trợ.
* **[ĐÃ KIỂM]** với ví dụ `project.xml` chính thức của Bitwig 5.0 (149 BPM, 9 nốt); chưa có `.dawproject` xuất thật (SOI-04).
