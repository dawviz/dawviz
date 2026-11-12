---
doc: SPIKE-1-EXPORT.md
doc_title: "Spike 1: Đường ống xuất video (Export Pipeline)"
section: "2. Vấn đề phát sinh và đề xuất"
path: "2. Vấn đề phát sinh và đề xuất"
chunk: 2-van-de-phat-sinh-va-de-xuat.md
source_lines: 12-25
source_sha1: cbc774f4af
ids: []
---
## 2. Vấn đề phát sinh và đề xuất

### 2.1 Lỗi encoder khi bật Silent AAC trên một số máy
* **Triệu chứng:** với cấu hình `mp4a.40.2`, 64.000 bps, 2 kênh, 48.000 Hz, máy tính LOQ gặp lỗi encoder từ Mediabunny; điện thoại chạy bình thường.
* **Đề xuất:** tắt mặc định Silent AAC. Phần mềm dựng và trình phát phổ biến (Premiere Pro, VLC…) xử lý tốt MP4 không có âm thanh, nên ưu tiên chế độ không audio khi người dùng không nạp nhạc.

### 2.2 Tên tệp khi ghi thẳng xuống đĩa (StreamTarget)
* **Triệu chứng:** khi ghi qua File System Access API, tên tệp không phản ánh tuỳ chọn `fastStart` ngay từ đầu, chỉ đổi sau khi xuất xong.
* **Đề xuất:** chốt tên tệp chuẩn (rộng × cao, fps, chế độ fast-start) **trước** vòng lặp render.

### 2.3 Bó cứng độ phân giải và tỉ lệ khung
* **Triệu chứng:** chỉ có các mốc 720p, 1080p, 2160p và vài tỉ lệ cố định.
* **Đề xuất:** cho nhập tuỳ ý rộng và cao (vẫn làm tròn số chẵn cho H.264), và cho nhập tỉ lệ khung tuỳ chỉnh.
