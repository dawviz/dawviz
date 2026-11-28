---
doc: VISUAL-LAYERS.md
doc_title: "Lớp đồ hoạ: nạp PSD, hình học, phát sáng theo nhạc **[ĐỀ XUẤT, chưa chốt]**"
section: "3. Phản ứng theo nhạc: cái đã có và cái cần thêm"
path: "3. Phản ứng theo nhạc: cái đã có và cái cần thêm"
chunk: 3-phan-ung-theo-nhac-cai-da-co-va-cai-can-them.md
source_lines: 56-66
source_sha1: d59766186f
ids: []
---
## 3. Phản ứng theo nhạc: cái đã có và cái cần thêm

**Đã có:** 9 nguồn binding (`beat.phase`, `bar.phase`, `progress`, `notes.count`, `notes.velocity`, `note.hit`, `track.volume`, `track.pan`, `audio.level`) và lane automation `track.automation.<id>`; easing, `from/to`; mọi thuộc tính số/màu của mọi widget.

**Cần thêm:**

1. **Dải tần**: `audio.bass`, `audio.mid`, `audio.high` (và dải tự chọn Hz) từ `AudioFeatures` đã có (`smoothedBands`); có tấn công/nhả để không giật.
2. **Nốt theo bộ lọc**: `note.hit` của một track / dải cao độ (ví dụ chỉ trống kick), để một lớp nháy theo đúng nhạc cụ, lợi thế riêng của DawViz so với công cụ chỉ nghe âm thanh trộn sẵn.
3. **Phát sáng cho mọi lớp**: thuộc tính `glow` (màu, bán kính, cường độ) ở cấp widget, vẽ bằng `shadowBlur` quanh nội dung; animate/bind được. Trên cảnh nhiều lớp sáng, Canvas 2D chậm (đã đo ở CUSTOMIZATION §7); đây là chỗ WebGL (bloom một lần cho cả khung) có lợi nhất.
4. **Hoà trộn** (`blend`, mục 1.3) để ánh sáng cộng (`lighter`) tự nhiên như các visualizer 3D.
