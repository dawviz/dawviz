# Mã spike

Mã đo của các spike trong [docs/spikes/](../docs/spikes/). Không thuộc workspace của monorepo; mỗi thư mục cài riêng (xem README của nó). Kết quả đo đã ghi trong báo cáo spike; mã giữ ở đây để chạy lại khi cần kiểm số.

- [notation/](notation/README.md): Spike 4, widget Bản nhạc (VexFlow, lượng tử hoá, nét tay, tốc độ vẽ).

## Dữ liệu MAESTRO (không có trong repo)

S2 của Spike 4 có đo trên hai bài của bộ **MAESTRO v3.0.0** (Google Magenta, giấy phép CC BY-NC-SA 4.0: phi thương mại, chia sẻ cùng giấy phép). Repo không phân phối lại dữ liệu này, nên `spikes/test/` bị bỏ khỏi git. Muốn chạy lại:

1. Tải `maestro-v3.0.0-midi.zip` (chỉ MIDI, khoảng 58 MB) ở https://magenta.tensorflow.org/datasets/maestro, đặt vào `spikes/test/`.
2. Chép hai bài đã dùng ra `spikes/test/maestro/` (tên trong tệp zip → tên spike dùng):
   - `maestro-v3.0.0/2011/MIDI-Unprocessed_06_R3_2011_MID--AUDIO_R3-D3_05_Track05_wav.midi` → `chopin-nocturne-op9-2.mid`
   - `maestro-v3.0.0/2011/MIDI-Unprocessed_19_R1_2011_MID--AUDIO_R1-D7_12_Track12_wav.midi` → `bach-wtc1-a-minor-bwv865.mid`
3. Từ `spikes/notation/`: `node s2-grid-stats.mjs ../test/maestro/*.mid` và `node s2-quantize.mjs ../test/maestro/*.mid`.
