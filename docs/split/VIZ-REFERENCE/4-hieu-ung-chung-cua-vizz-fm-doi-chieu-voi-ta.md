---
doc: VIZ-REFERENCE.md
doc_title: "Tham khảo vizz.fm: mẫu visualizer 3D và cách đưa vào DawViz **[ĐỀ XUẤT, chưa chốt]**"
section: "4. Hiệu ứng chung của vizz.fm đối chiếu với ta"
path: "4. Hiệu ứng chung của vizz.fm đối chiếu với ta"
chunk: 4-hieu-ung-chung-cua-vizz-fm-doi-chieu-voi-ta.md
source_lines: 49-62
source_sha1: 1ee00dca1b
ids: [D-47]
---
## 4. Hiệu ứng chung của vizz.fm đối chiếu với ta

| Nhóm | Ta có gì | Làm bằng |
|---|---|---|
| Camera xoay/zoom/pan theo chu kỳ | Chưa (D-47: camera 2.5D ở 1.1) | B rồi C |
| Hoà trộn với nền (Add, Screen, Multiply…) | Chưa | A: `globalCompositeOperation` (xem VISUAL-LAYERS §1.3) |
| Nền trời sao, bụi trôi, gradient | Ảnh nền, màu nền | A (sao/bụi tất định theo hạt giống) |
| Nền plasma, mọi shader toàn khung | Không | C |
| Vignette, khung, kết cấu phủ, nhiễu hạt, pixelate | Không | A |
| Bloom, RGB shift, glitch, blur, méo ống kính, kính vạn hoa, CRT, ASCII, LED | Không | C (T-36) |
| Echo Trails, Persistence (phản hồi khung trước) | Không | Đặc biệt, xem §5 |
| Gắn thanh trượt vào âm thanh | Có: 9 nguồn binding + lane automation | Thêm dải tần bass/mid/high (VISUAL-LAYERS §3) |
| Morph giữa preset | Phase, chuyển cảnh nốt | Chuyển cảnh giữa phase dùng lại được |
