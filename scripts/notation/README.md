# Công cụ đo widget Bản nhạc

Công cụ phát triển cho widget Bản nhạc (D-63, [SPIKE-4](../../docs/spikes/SPIKE-4-NOTATION.md)). Không phải mã của ứng dụng và không vào bản build. Chúng chạy trên mã chính thức (`packages/render-core/src/notation/`, `apps/web/src/lib/notation/`), nên đổi mã thì chạy lại để kiểm số.

| Lệnh (từ thư mục gốc) | Việc |
|---|---|
| `node scripts/notation/grid-stats.mjs <tệp…>` | Nốt của tệp thật nằm trên lưới nào (1/4, 1/8, 1/16, liên ba…): nhạc làm trong DAW gần 100%, nhạc chơi tự do vài phần trăm |
| `node scripts/notation/quantize-check.mjs <tệp…> [--maxDivision=16 --triplets=0 --simplicity=3]` | Lượng tử hoá: lỗi cấu trúc (phải bằng 0), sai số điểm bắt đầu, thời gian chạy |
| `node scripts/notation/build-file.mjs <tệp…>` | `buildNotation` của ứng dụng trên tệp thật: số trang, phần tử, kích thước `NotationLayout` (ghi vào `out/`) |
| `node scripts/notation/make-short-mid.mjs` | Sinh `out/short.mid` (8 ô, tự soạn) để thử nhanh |
| `node scripts/notation/e2e.mjs out/short.mid 3` | Ứng dụng thật (Vite + Chromium hoặc Firefox): thêm widget, phát, chụp khung. Thêm `EXPORT=1` để xuất MP4 và in thời gian; `BROWSER=firefox`, `AURA=STEADY\|BEAT\|BAR\|TIME`, `AURA_SHAPE=…`, `MNSIZE=2.5`, `TAG=tên` |

Cần Playwright: `npx playwright-core install chromium firefox` (hoặc `CHROME=<đường dẫn>`). Ảnh và video của e2e nằm ở `scripts/notation/out/` (không commit). Khi xem khung video để kiểm, theo quy tắc của dự án: trích ít khung, xem xong thì xoá.

## Dữ liệu thử của bên thứ ba (không có trong repo)

`scripts/notation/data/` bị bỏ khỏi git. Số liệu "nhạc chơi tự do" trong SPIKE-4 đo trên hai bài của **MAESTRO v3.0.0** (Google Magenta, CC BY-NC-SA 4.0: phi thương mại, chia sẻ cùng giấy phép), nên repo không phân phối lại dữ liệu này. Muốn chạy lại:

1. Tải `maestro-v3.0.0-midi.zip` (chỉ MIDI, khoảng 58 MB) ở https://magenta.tensorflow.org/datasets/maestro, đặt vào `scripts/notation/data/`.
2. Chép hai bài đã dùng ra `scripts/notation/data/maestro/`:
   - `maestro-v3.0.0/2011/MIDI-Unprocessed_06_R3_2011_MID--AUDIO_R3-D3_05_Track05_wav.midi` → `chopin-nocturne-op9-2.mid`
   - `maestro-v3.0.0/2011/MIDI-Unprocessed_19_R1_2011_MID--AUDIO_R1-D7_12_Track12_wav.midi` → `bach-wtc1-a-minor-bwv865.mid`
3. `node scripts/notation/grid-stats.mjs scripts/notation/data/maestro/*.mid`

## Mã spike cũ

Mã thử của Spike 4 (so ảnh dựng lại S1, trang đo hiệu năng S3, bản engraver thử S5) đã xoá khỏi cây thư mục vì đã có bản chính thức. Xem lại bằng `git show 1ae4887` hoặc `git log -- spikes/`.
