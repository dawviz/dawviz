---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "3. Mô hình dữ liệu storyboard (AD-08)"
path: "3. Mô hình dữ liệu storyboard (AD-08)"
chunk: 3-mo-hinh-du-lieu-storyboard-ad-08.md
source_lines: 35-110
source_sha1: e3b1cd1a13
ids: [AD-08, AD-11, AD-13, OI-16]
---
## 3. Mô hình dữ liệu storyboard (AD-08)

```text
SceneDocument (đã có kế hoạch ở T-05)
├─ settings      kích thước, fps, nền, phông mặc định
├─ assets[]      tham chiếu tài nguyên theo băm nội dung (mục 6)
├─ layers[]      thứ tự vẽ; mỗi lớp: visible, locked, blend, opacity
│   └─ elements[]
│       ├─ NoteLayer       Piano Roll / làn rơi; dùng NoteStyle + NoteTransition
│       ├─ Widget          8 widget HUD (SRS §3.4)
│       ├─ Sprite          ảnh tĩnh hoặc sprite sheet
│       ├─ Text            chữ (tên bài, lời, bộ đếm)
│       ├─ Shape           chữ nhật, tròn, đa giác, đường SVG đơn giản
│       └─ ParticleEmitter (mục 5)
└─ bindings      liên kết thuộc tính ↔ dữ liệu nhạc (mục 3.3)
```

### 3.1 Thuộc tính có keyframe

Mọi thuộc tính số hoặc màu của phần tử là một `Track<T>`:

```json
{ "x": { "keys": [
    { "at": { "beat": 0 },  "value": 0,   "ease": "linear" },
    { "at": { "beat": 4 },  "value": 640, "ease": { "cubicBezier": [0.25, 0.1, 0.25, 1] } },
    { "at": { "sec": 12.5 }, "value": 320, "ease": "easeOutElastic" } ] } }
```

* Mốc `at` nhận `sec`, `beat`, `bar.beat` hoặc `tick`. Mốc nhạc được quy đổi qua `TempoMap` lúc dựng chỉ mục, không đổi lúc vẽ.
* `ease` ở keyframe áp cho đoạn **đi tới** keyframe đó.
* Trước keyframe đầu và sau keyframe cuối, thuộc tính giữ nguyên giá trị.
* Màu nội suy trong không gian OKLab để chuyển màu không bị xỉn ở giữa.

### 3.2 Template theo nốt (NoteTransition)

Đây là phần giúp tùy biến dễ nhất: không phải đặt keyframe tay cho hàng nghìn nốt, mà khai báo **một template** áp cho mọi nốt (hoặc theo track). Mỗi nốt có bốn pha, mỗi pha có thời lượng, easing và hiệu ứng:

| Pha | Khi nào | Ví dụ hiệu ứng |
|---|---|---|
| `enter` | Trước nốt bắt đầu một khoảng `lead` | rơi xuống, trượt vào, phóng to, mờ dần hiện ra, morph từ hình khác |
| `hit` | Lúc nốt chạm vạch phát | bật sáng, nảy, rung, toả hạt, gợn sóng |
| `sustain` | Trong lúc nốt kêu | thở (co giãn theo nhịp), dịch màu, phát hạt liên tục |
| `exit` | Sau khi nốt tắt | tắt dần, vỡ thành hạt, thu nhỏ, bay lên |

Template dựng sẵn (preset `kind: "note-transition"`):

| Tên | Mô tả |
|---|---|
| `scroll-left` | Piano Roll hiện tại (nốt trôi từ phải sang trái) — mặc định |
| `fall-down` | Nốt rơi từ trên xuống bàn phím (kiểu Synthesia) |
| `rise-up` | Nốt bay lên từ bàn phím |
| `drop-bounce` | Rơi rồi nảy khi chạm vạch (easing `easeOutBounce`) |
| `pop-in` | Phóng từ 0 lên kích thước thật (`easeOutBack`) |
| `fade-scale` | Mờ hiện và co giãn nhẹ |
| `morph` | Hình dạng biến đổi: viên tròn khi chờ, thanh dài khi kêu; hoặc nốt trước morph thành nốt sau trong cùng track |
| `shatter` | Khi tắt, vỡ thành hạt (cần bộ phát hạt) |
| `ripple` | Gợn tròn lan ra lúc chạm |

**Morph** (AD-11): chỉ morph giữa các hình **cùng họ** để đảm bảo tất định và rẻ: chữ nhật bo góc ↔ viên thuốc ↔ tròn (nội suy bán kính bo và kích thước), và đa giác ↔ đa giác sau khi lấy mẫu lại về cùng số đỉnh. Morph giữa đường SVG bất kỳ để sau (OI-16). Các hiệu ứng khác ngoài morph: [ANIMATION-CATALOG.md](../../design/ANIMATION-CATALOG.md).

Hướng cuộn và vị trí vạch phát là tham số của NoteLayer (`direction: left | right | up | down`, `playhead: 0..1`). Nhờ vậy `fall-down` chỉ là một cấu hình, không phải mã riêng.

### 3.3 Liên kết dữ liệu nhạc (bindings)

Thuộc tính có thể **lấy giá trị từ dữ liệu nhạc** thay cho keyframe, kèm ánh xạ miền và easing:

| Nguồn | Ví dụ dùng |
|---|---|
| `note.velocity`, `note.pitch`, `note.durationSec` | Kích thước, màu, cường độ phát sáng theo độ mạnh nốt |
| `track.automation.volume` / `pan` (đã có trong AST) | Độ sáng track (đã làm), vị trí ngang theo pan |
| `beat.phase`, `bar.phase` (0..1 trong mỗi nhịp) | Nhấp nháy, thở theo nhịp |
| `activeNotes.count`, `activeNotes.maxVelocity` | Độ rung màn hình, mật độ hạt |
| `audio.rms` (sau khi có audio, T-08) | Phản ứng theo âm lượng; phải tính trước thành bảng theo thời gian để giữ tất định |

Dạng khai báo: `{ "bind": "note.velocity", "from": [0, 127], "to": [0.4, 1.2], "ease": "easeInQuad" }`. Khi cần kết hợp nhiều nguồn, điều kiện hay hàm toán học, dùng **biểu thức** (`{ "expr": "…" }`) chạy bằng trình thông dịch an toàn: xem [EXPRESSIONS.md](../../design/EXPRESSIONS.md) (AD-13). Biểu thức vẫn là dữ liệu, nên AD-08 giữ nguyên.
