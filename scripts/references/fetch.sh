#!/usr/bin/env bash
# Tải video tham chiếu (720p) và trích khung hình vào references/ (KHÔNG commit: không có bản quyền các video này, xem references/README.md).
# Cần: yt-dlp, ffmpeg. Chạy: bash scripts/references/fetch.sh [số khung mỗi video, mặc định 16]
set -euo pipefail
cd "$(dirname "$0")/../.."
N="${1:-16}"
declare -A SRC=(
  [01-usagin-last-dice]="https://www.youtube.com/watch?v=0zq2QkhOJxQ"
  [02-tn-shi-synthesis]="https://www.youtube.com/watch?v=dOP7G5J755s"
  [03-emocute-kawaii-bass]="https://www.youtube.com/watch?v=KFA9YZselQ4"
  [04-silentroom-limen]="https://www.youtube.com/watch?v=0RkSETqXYZA"
)
mkdir -p references/video references/frames
for name in "${!SRC[@]}"; do
  [ -f "references/video/$name.mp4" ] || yt-dlp -q --no-warnings -f "bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720]" --merge-output-format mp4 -o "references/video/$name.mp4" "${SRC[$name]}"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "references/video/$name.mp4")
  mkdir -p "references/frames/$name"; rm -f "references/frames/$name"/*.jpg
  # N khung đều nhau, cạnh dài tối đa 768 px; tên theo giây để dễ dẫn chiếu trong tài liệu (f0061.jpg = giây 61)
  for i in $(seq 0 $((N-1))); do
    t=$(awk -v d="$dur" -v i="$i" -v n="$N" 'BEGIN{printf "%d", (i+0.5)*d/n}')
    ffmpeg -v error -ss "$t" -i "references/video/$name.mp4" -frames:v 1 -vf "scale='min(768,iw)':-2" -q:v 3 -y "references/frames/$name/f$(printf %04d "$t").jpg"
  done
done
# Video 4: đoạn từ 1:01 đến cuối (parallax, nghiêng, visualizer vector) lấy dày hơn: mỗi 3 giây
v4=references/video/04-silentroom-limen.mp4; mkdir -p references/frames/04-silentroom-limen/late
for t in $(seq 61 3 "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v4" | cut -d. -f1)"); do
  ffmpeg -v error -ss "$t" -i "$v4" -frames:v 1 -vf "scale='min(768,iw)':-2" -q:v 3 -y "references/frames/04-silentroom-limen/late/f$(printf %04d "$t").jpg"
done
echo "xong: references/video và references/frames"
