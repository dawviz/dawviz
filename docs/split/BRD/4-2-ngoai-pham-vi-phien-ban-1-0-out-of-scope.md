---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "4.2. Ngoài phạm vi phiên bản 1.0 (Out-of-Scope)"
path: "4. PHẠM VI DỰ ÁN (PROJECT SCOPE) > 4.2. Ngoài phạm vi phiên bản 1.0 (Out-of-Scope)"
chunk: 4-2-ngoai-pham-vi-phien-ban-1-0-out-of-scope.md
source_lines: 150-164
source_sha1: 5173bcd17b
ids: [D-12, D-13, D-14, D-15, D-28, D-44, OI-08]
---
### 4.2. Ngoài phạm vi phiên bản 1.0 (Out-of-Scope)
* **Chưa hỗ trợ** trong v1.0: phân tích trực tiếp `.flp` (FL Studio) và `.bwproject` gốc của Bitwig (định dạng nhị phân). Người dùng dùng `.mid` (FL Studio) hoặc `.dawproject` (Bitwig). Engine parser nhị phân theo schema đã sẵn sàng, nên khi có file mẫu và schema thì có thể thêm mà không đổi lõi (D-28, OI-08).
* Đọc clip Session View của Ableton: chưa hỗ trợ ở 1.0/1.1 (clip bị bỏ qua và được báo cho người dùng); dự kiến 1.2 (D-44).
* Bộ tổng hợp âm thanh ảo (VST/Sampler) để phát tiếng từ nốt MIDI.
* Backend render video.
* Biên tập video đa tầng timeline phức tạp.
* Thư viện Preset/Parser tích hợp trong ứng dụng (GitHub Hub) — bản 1.1 (D-14, §4.4).
* Trình soạn storyboard đầy đủ, Graph Editor đầy đủ, hiệu ứng WebGL — bản 1.1 (§4.4).
* Ableton Session View, giao diện di động, morph SVG tự do — bản 1.2 (D-44).
* Xoay widget (rotation) — trường dữ liệu được giữ chỗ nhưng không cho chỉnh trong v1.0 (D-15).
* Giao diện cho thiết bị di động (D-12); xem trên di động dự kiến 1.2 (D-44).
* Telemetry/analytics (D-13).

---
