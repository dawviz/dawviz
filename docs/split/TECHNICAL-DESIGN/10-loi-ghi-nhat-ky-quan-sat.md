---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "10. Lỗi, ghi nhật ký, quan sát"
path: "10. Lỗi, ghi nhật ký, quan sát"
chunk: 10-loi-ghi-nhat-ky-quan-sat.md
source_lines: 394-398
source_sha1: 185dbf38d8
ids: [D-13]
---
## 10. Lỗi, ghi nhật ký, quan sát
- Mọi lỗi dự đoán được là `DawParseError{code, message, details}` hoặc lỗi xuất có mã `ERR_*`; giao diện không bao giờ hiện stack trace, chỉ chuỗi dịch + chi tiết kỹ thuật gập lại.
- Lỗi không dự đoán: `window.onerror`/`unhandledrejection` → khung báo lỗi chung, giữ phiên, nút "sao chép chi tiết" (không gửi đi đâu, D-13 không telemetry).
- Cảnh báo giữ lại trong `warnings` của kết quả; Export tóm tắt cảnh báo trong bước pre-flight.
