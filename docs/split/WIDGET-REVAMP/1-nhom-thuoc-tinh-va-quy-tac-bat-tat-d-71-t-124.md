---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "1. Nhóm thuộc tính và quy tắc bật/tắt (D-71, T-124)"
path: "1. Nhóm thuộc tính và quy tắc bật/tắt (D-71, T-124)"
chunk: 1-nhom-thuoc-tinh-va-quy-tac-bat-tat-d-71-t-124.md
source_lines: 19-70
source_sha1: 5eb561ef37
ids: [D-71, D-72]
---
## 1. Nhóm thuộc tính và quy tắc bật/tắt (D-71, T-124)

### 1.1 Vấn đề

Cột Thiết lập của nhiều widget là một danh sách phẳng 20–40 ô (Phổ tần, Hạt, Bản nhạc). Có ô "0 là tắt" (phát sáng), có ô tick riêng để bật (bàn phím, đỉnh của phổ), có lựa chọn "Tắt" trong danh sách (quầng của Bản nhạc); ô phụ của một tính năng đang tắt vẫn hiện.

### 1.2 Quy tắc (chủ dự án chọn phương án A, 2026-11-26)

1. **Một ý nghĩa, một điều khiển.** Tính năng mà giá trị 0 đã nghĩa là tắt (phát sáng, độ dày viền, độ dày nét) **không** có công tắc riêng.
2. **Ô phụ đi theo ô chính.** Ô chỉ có nghĩa khi tính năng bật (bán kính phát sáng, màu viền) **ẩn khi ô chính là 0**. Ngoại lệ: ô phụ đang có keyframe/binding thì vẫn hiện (không giấu hoạt hình của người dùng).
3. **Nhóm có công tắc.** Nhóm có từ 2 ô trở lên dùng chung một trạng thái bật/tắt tự nhiên (bàn phím, lưới, đỉnh phổ, hiệu ứng chữ, bóng, nền chữ, chớp theo phách, chấm phách) có **công tắc ở tiêu đề nhóm**. Tắt: ẩn các ô con, nhóm còn một dòng tiêu đề. Giá trị con được giữ.
4. **Lựa chọn có "Tắt".** Danh sách có giá trị tắt (Quầng: Tắt/Đều/Theo phách…, Vạch phát: Không/Vạch, Vòng tiến độ: Tắt/Ô nhịp/Bài) đứng ở tiêu đề nhóm thay cho công tắc; chọn "Tắt" thì ẩn ô con.
5. **Không làm cả hai.** Nhóm có công tắc thì các ô số bên trong không mang nghĩa "0 là tắt" nữa (ví dụ khoảng cách bóng = 0 chỉ là bóng nằm ngay dưới chữ).
6. **Công tắc là thuộc tính.** Công tắc ghi vào đúng thuộc tính bool sẵn có (`keyboard.enabled`, `peakCap`, `animator.enabled`…), nên vẫn đặt keyframe bậc được và preset cũ đọc như cũ. Không đổi lược đồ.

### 1.3 Mô hình dữ liệu (chỉ ở `apps/web`)

`lib/widgetFields.ts` thêm vào `FieldDef`:

```ts
sec?: SectionId;          // nhóm chứa ô: 'look' | 'notes' | 'playhead' | 'keyboard' | 'grid' | 'glow' | 'colour' | 'peaks' | 'motion' | 'text' | 'timing' | 'frame' | …
```

và một bảng `WIDGET_SECTIONS[type]`: thứ tự nhóm, nhãn, và **điều khiển ở tiêu đề** (`toggle: path` cho quy tắc 3, `choice: path` cho quy tắc 4, vắng = nhóm thường). Quy tắc 2 viết bằng `when` như hiện nay (`when: (P) => P.glow > 0`), `WidgetSettings` tự giữ ô có hoạt hình.

`WidgetSettings` vẽ mỗi nhóm thành một tiêu đề con (chữ 12 px đậm, mũi tên gấp, công tắc hoặc danh sách ở bên phải), nhớ trạng thái gấp theo `<loại widget>.<nhóm>` bằng kho `sectionState` sẵn có. Nhóm không còn ô nào hiện (Cơ bản, hoặc bị `when` ẩn hết) thì ẩn luôn tiêu đề. **Tìm thiết lập** giữ nguyên: khớp tên nhóm thì hiện cả nhóm.

Timeline keyframe dùng **cùng** nhóm: `propGroup()` (đã làm 2026-11-26, đoán theo đường dẫn) đổi sang đọc `sec` của `FieldDef` khi có, đoán theo đường dẫn chỉ còn là dự phòng cho Piano Roll và đường dẫn không có trong bảng. Một chỗ khai báo, hai nơi hiện giống nhau (Thiết lập và Timeline), như After Effects.

### 1.4 Rà từng widget

Rà theo bốn câu hỏi, ghi kết quả vào `widgetFields.ts` và test `widgetFields.test.ts`:

1. Ô này thuộc nhóm nào? (mọi ô phải có `sec`, test bắt ô thiếu)
2. Có ô "0 là tắt" nào đang có thêm công tắc không? (bỏ công tắc)
3. Ô phụ nào đang hiện khi tính năng tắt? (thêm `when`)
4. Ô nào không áp dụng cho kiểu/hình dạng đang chọn? (D-72)

Ví dụ đã thấy khi rà sơ bộ:

| Widget | Thay đổi |
|---|---|
| Phổ tần | Nhóm: Kiểu (kiểu, hình dạng, số cột, thang), Hình học (theo hình dạng: Thẳng có góc/độ dài, Tròn có bán kính/góc bắt đầu), Cột (bề rộng, bo góc, độ dài tối thiểu: chỉ kiểu Cột/Chấm), **Đỉnh** (công tắc `peakCap` + tốc độ rơi + kiểu đỉnh, T-130), Màu, Phát sáng, Phản hồi (attack/release/dB/Hz) |
| Piano Roll | Nhóm: Nốt, Màu, Phát sáng (0 là tắt, ô phụ ẩn), Vạch phát (công tắc `playheadVisible`), Bàn phím (công tắc `keyboard.enabled`), Lưới (công tắc ghép ba ô tick hiện có), Dải cao độ |
| Bản nhạc | Nhóm: Bản nhạc (phông, số ô nhịp, giọng…; đổi thì dựng lại), Màu, Phóng to khi phát (`zoom` = 1 là tắt, ô phụ ẩn), Phát sáng (0 là tắt), Quầng (danh sách có Tắt ở tiêu đề), Vạch phát (danh sách Không/Vạch ở tiêu đề), Nét tay (`rough` = 0 là tắt, ẩn rung/seed) |
| Hạt | Nhóm: Phát ra, Chuyển động, Kích thước, Màu, Điểm xuất phát |
| Ô chữ | Nhóm: Chữ, Hiệu ứng chữ (công tắc `animator.enabled`) |
| Nhịp phách | Nhóm: Chấm phách (công tắc `dots`) |
| Tempo | Nhóm: Đường tempo (công tắc `showCurve`), Chớp (công tắc `flash`) |

Mục **Chữ** (`TextPanel`) đã gần đúng quy tắc: Bóng và Nền có ô tick (quy tắc 3), Viền theo độ dày (quy tắc 1–2). Chỉ đổi ô tick thành công tắc ở tiêu đề nhóm cho thống nhất.
