---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "9. Yêu cầu tương ứng (đã đưa vào SRS §3.8)"
path: "9. Yêu cầu tương ứng (đã đưa vào SRS §3.8)"
chunk: 9-yeu-cau-tuong-ung-da-dua-vao-srs-3-8.md
source_lines: 203-213
source_sha1: 252b907188
ids: [REQ-GRAPHICS-09, REQ-GRAPHICS-10, REQ-GRAPHICS-11, REQ-GRAPHICS-12, REQ-STORAGE-05, REQ-STORAGE-06]
---
## 9. Yêu cầu tương ứng (đã đưa vào SRS §3.8)

| ID dự kiến | Nội dung tóm tắt | Nghiệm thu (gợi ý) |
|---|---|---|
| REQ-GRAPHICS-09 | Thư viện easing và trình soạn đồ thị | Cùng `t` cho cùng giá trị; biên đúng; lưu và nạp preset `easing` |
| REQ-GRAPHICS-10 | Template chuyển cảnh nốt bốn pha, có ít nhất 9 template dựng sẵn | Tua tới/lui bằng nhau; ảnh Preview và Export trùng nhau |
| REQ-GRAPHICS-11 | Hạt không trạng thái | Đặt `t` trực tiếp cho cùng ảnh với chạy liên tục tới `t` |
| REQ-GRAPHICS-12 | Storyboard: lớp, phần tử, keyframe theo giây hoặc nhịp, bindings | Đổi tempo thì keyframe theo nhịp vẫn khớp nhịp |
| REQ-STORAGE-05 | Tài nguyên của phiên (băm, giới hạn, đóng gói) | Nạp trùng không nhân đôi dung lượng; Pack mở trên máy khác đủ tài nguyên |
| REQ-STORAGE-06 | Chia sẻ và nhập preset cộng đồng, có xác minh băm | Preset sai băm hoặc sai schema bị từ chối kèm mã lỗi |
