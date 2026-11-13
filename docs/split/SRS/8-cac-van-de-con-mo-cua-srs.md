---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "8. CÁC VẤN ĐỀ CÒN MỞ CỦA SRS"
path: "8. CÁC VẤN ĐỀ CÒN MỞ CỦA SRS"
chunk: 8-cac-van-de-con-mo-cua-srs.md
source_lines: 1076-1102
source_sha1: 0b10d2a1a5
ids: [D-20, D-21, D-22, D-31, D-44, D-45, KPI-03, OI-01, OI-02, OI-05, OI-08, OI-09, OI-10, OI-12, OI-13, P-13, REQ-GRAPHICS-06, REQ-PARSER-05, REQ-STORAGE-05, SOI-01, SOI-02, SOI-03, SOI-04, SOI-05, SOI-06, SOI-07, SOI-08, SOI-09, SOI-10, SOI-11, SOI-12, SOI-13, SOI-14, SOI-15, SOI-16, SOI-17, SOI-18, SOI-19, SOI-20]
---
## 8. CÁC VẤN ĐỀ CÒN MỞ CỦA SRS

| Mã | Nội dung | Xử lý |
| :--- | :--- | :--- |
| **SOI-01** | Chốt D-20, D-21, D-22 (Render Core chung, Export Worker, FFT tất định) và đưa vào Nhật ký quyết định BRD. **Đã đóng v1.1:** D-20, D-21, D-22 đã có trong Nhật ký quyết định BRD. | Product/Dev, trước khi code |
| **SOI-02** | Chiến lược giải mã audio theo khối cho file dài (WebCodecs `AudioDecoder` hay `decodeAudioData` theo đoạn) và đo bộ nhớ thực tế. | Dev, spike |
| **SOI-03** | Kiểm chứng `OffscreenCanvas` 2D, nạp `FontFace` và vẽ chữ trong Worker hoạt động nhất quán giữa Chrome/Edge trên Windows và macOS. **v1.1:** Spike 1 xác nhận `FontFace` trong Worker hoạt động trên Windows (Chromium/Edge, máy LOQ); còn kiểm macOS. | Dev, spike |
| **SOI-04** | Đối chiếu lược đồ DAWproject (tên phần tử/thuộc tính, `contentType`, đơn vị thời gian) với đặc tả và file thật. *Cập nhật v0.3:* đã khớp ví dụ chính thức của Bitwig 5.0; còn thiếu `.dawproject` xuất thật. **v1.1:** Chương trình tệp mẫu (D-45). | Dev/QA (OI-01) |
| **SOI-05** | Lập bảng profile/level H.264 thực tế theo độ phân giải × FPS và kiểm bằng `isConfigSupported` trên RM-1. | Dev (OI-02) |
| **SOI-06** | Tempo automation của Ableton và tempo envelope của Reaper: cách đọc, nội suy dốc tempo. *Cập nhật v0.3:* đã cài (Ableton: sự kiện và envelope; Reaper: PT, shape 1 = giữ), kiểm bằng dữ liệu tổng hợp; thiếu mẫu thật có dốc tempo. **v1.1:** Chương trình tệp mẫu (D-45). | Dev (OI-01) |
| **SOI-07** | Có thể chặn hoàn toàn `style-src 'unsafe-inline'` với thư viện giao diện được chọn không. **v1.1:** kiểm khi làm T-30 (CSP); React đặt style qua CSSOM nên dự kiến không cần `unsafe-inline`. | Dev |
| **SOI-08** | Mức hỗ trợ chính thức cho Linux (hiện là best-effort). **Đã chốt v1.1 (D-44):** Linux theo khả năng phát hiện được ở 1.0/1.1. | Product |
| **SOI-09** | Ngưỡng độ dài tối thiểu đoạn hợp âm (80 ms) cần chỉnh theo bộ mẫu thật. | Nhạc công (OI-05) |
| **SOI-10** | Mediabunny khi ghi luồng có đạt MP4 fast-start không, hay phải dùng chế độ phân mảnh; ảnh hưởng nhập vào Premiere/DaVinci/CapCut (KPI-03). *Cập nhật v0.3:* `in-memory` đạt fast-start (`ftyp moov mdat`); ghi thẳng xuống đĩa + fast-start chưa kết luận. | Dev, spike |
| **SOI-11** | Viết schema nhị phân cho `.bwproject` (và `.flp`) khi có file mẫu; hiện *chưa hỗ trợ*. | Dev (OI-08) |
| **SOI-12** | Triển khai parser khai báo cho nguồn XML/JSON (REQ-PARSER-05) hoặc bỏ yêu cầu nếu `.dawproject` và schema nhị phân đủ dùng. **Đã chốt v1.1:** không có trong 1.0/1.1; xem lại ở 1.2 (BRD §4.4). | Product/Dev |
| **SOI-13** | Bù độ lệch A/V trên di động hay giữ phạm vi desktop (R-11, OI-09). **Đã chốt v1.1 (D-44):** 1.0/1.1 chỉ desktop; 1.2 xem trên di động. | Dev |
| **SOI-14** | Đọc clip Session View của Ableton (OI-10). **Đã chốt v1.1 (D-44):** bản 1.2. | Product |
| **SOI-15** | Cách chọn `.als` mặc định trong `.alp` (hiện: lớn nhất) và ý nghĩa thứ tự trong manifest. | Dev |
| **SOI-17** | Cách đếm beat/bar trong nhịp ghép: **Reaper đã xác nhận** (đếm theo mẫu số, 12/8 @120: `1.12.68` = 2,920 s). Còn Ableton, Bitwig và các nhịp ghép khác để chốt D-31 (OI-12). **v1.1:** Chương trình tệp mẫu (D-45). | Dev/QA |
| **SOI-18** | Đọc automation của Ableton/DAWproject/Bitwig và envelope trong item/take của Reaper (REQ-GRAPHICS-06, P-13). **v1.1:** cần cho widget P-13 ở bản 1.0 (Ableton/DAWproject automation). | Dev |
| **SOI-19** | Kiểm với Reaper thật: chiều của pan (âm = trái?), nghĩa giá trị `MUTEENV` (0/1), và hệ số nội suy fader `gain^0,25` với thêm vài điểm đo. **v1.1:** Chương trình tệp mẫu (D-45). | Dev/QA |
| **SOI-20** | Font và hiển thị chữ cho video xuất ra với các hệ chữ ngoài Latin; chữ từ phải sang trái trên canvas (REQ-I18N-07, OI-13). **v1.1:** đổi ID từ SOI-18 trùng; 1.0 dùng phông người dùng nạp (REQ-STORAGE-05), 1.1 gói phông cộng đồng (OI-13). | Dev |
| **SOI-16** | Ý nghĩa `SOFFS`, `IGNTEMPO 1`, shape cong và `PROJOFFS` của Reaper bằng mẫu thật có các giá trị này (`.mid` ngoài đã kiểm). **v1.1:** Chương trình tệp mẫu (D-45). | Dev (OI-01) |

---
