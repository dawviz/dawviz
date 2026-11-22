# Tham chiếu hình ảnh (không commit nội dung)

Thư mục này chứa video và khung hình của bốn video YouTube dùng làm **ý tưởng** cho các preset và widget. Ta không có bản quyền các video đó, vì vậy
`.gitignore` bỏ qua mọi thứ trong `references/` trừ tệp này. Mỗi người tự tạo lại trên máy mình:

```bash
bash scripts/references/fetch.sh        # cần yt-dlp và ffmpeg; tải 720p rồi trích 16 khung mỗi video
```

Kết quả: `references/video/*.mp4` và `references/frames/<tên>/fNNNN.jpg` (NNNN = giây). Video 4 có thêm `late/` (mỗi 3 giây từ 1:01).
Tài liệu dẫn chiếu: [docs/design/REFERENCE-VIDEOS.md](../docs/design/REFERENCE-VIDEOS.md). Đừng đưa khung hình, tên bài hay logo của họ vào preset, mã hay tài liệu.
