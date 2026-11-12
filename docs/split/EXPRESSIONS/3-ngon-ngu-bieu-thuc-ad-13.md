---
doc: EXPRESSIONS.md
doc_title: "Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng"
section: "3. Ngôn ngữ biểu thức (AD-13)"
path: "3. Ngôn ngữ biểu thức (AD-13)"
chunk: 3-ngon-ngu-bieu-thuc-ad-13.md
source_lines: 32-94
source_sha1: 19ec9a9aa3
ids: [AD-07, AD-13]
---
## 3. Ngôn ngữ biểu thức (AD-13)

### 3.1 Người dùng viết gì

Mỗi thuộc tính (vị trí, kích thước, màu, độ mờ…) có thể đặt bằng một biểu thức thay cho keyframe hoặc binding:

```text
// kích thước nốt: theo độ mạnh, thêm nhịp thở theo phách
0.5 + note.velocity / 127 * (1 + 0.3 * sin(beat.phase * TAU))

// màu: nốt cao màu hồng, nốt thấp màu xanh, chuyển dần ở giữa
mix(#4aa8f5, #ff6b9d, smoothstep(48, 72, note.pitch))

// vị trí x: theo pan của track, rung nhẹ khi nốt mạnh
let shake = wiggle(8, note.velocity / 20);
track.pan * 200 + shake

// độ mờ: tắt dần 0,5 giây sau khi nốt kết thúc
note.active ? 1 : ease(clamp(1 - note.sinceEnd / 0.5, 0, 1), "easeOutCubic")

// lặp keyframe sẵn có theo kiểu ping-pong
loop("pingpong")
```

### 3.2 Đặc tả

| Thành phần | Cho phép | Không cho phép |
|---|---|---|
| Kiểu giá trị | số, boolean, màu (`#rrggbb`, `rgb()`, `oklch()`), vec2 `[x, y]`, chuỗi **hằng** cho tên enum (`"easeOutCubic"`) | đối tượng, hàm làm giá trị, mảng tuỳ ý, chuỗi ghép động |
| Toán tử | `+ - * / % **`, so sánh, `&& \|\| !`, `? :` | gán vào biến ngoài, `++`, toán tử bit (không cần) |
| Biến | `let tên = …;` (tối đa 16), chỉ trong biểu thức | biến toàn cục, sửa biến hệ thống |
| Dữ liệu đọc được | danh sách trắng cố định: `t`, `time.*`, `beat.*`, `bar.*`, `note.*`, `track.*`, `layer.*`, `index`, `count`, `seed`, `value` (giá trị keyframe hiện tại), `width`, `height` | `window`, `this`, `globalThis`, `constructor`, `__proto__`, bất kỳ tên nào ngoài danh sách |
| Hàm | danh sách trắng thuần (§3.3) | khai báo hàm, gọi hàm theo tên động, gọi phương thức `a.b()` |
| Điều khiển | `? :` | `for`, `while`, đệ quy, `try`, `import` |

Dấu chấm (`note.velocity`) **không phải truy cập thuộc tính JavaScript**. Đó là một tên phẳng `"note.velocity"` được tra trong bảng biến cố định. Vì vậy những thứ như `note.constructor`, `beat.__proto__` hay `t["con"+"structor"]` đơn giản là **tên không tồn tại** và bị báo lỗi ngay lúc phân tích.

### 3.3 Hàm có sẵn

| Nhóm | Hàm |
|---|---|
| Toán | `abs, sign, floor, ceil, round, fract, min, max, clamp, mix/lerp, step, smoothstep, sqrt, pow, exp, log, sin, cos, tan, asin, acos, atan, atan2, mod, PI, TAU` |
| Ánh xạ | `map(v, a, b, c, d)`, `linear(v, a, b, c, d)`, `ease(x, "tên")`, `ease(v, a, b, c, d, "tên")` (giống `linear()` có easing) |
| Ngẫu nhiên tất định | `random()`, `random(a, b)` theo `seed` của phần tử; `noise(x)`, `noise(x, y)` |
| Thời gian | `wiggle(freq, amp)`, `oscillate(freq, amp, "sine\|triangle\|square\|saw")`, `loop("cycle\|pingpong\|offset")`, `valueAt(time)` (đọc keyframe của chính thuộc tính), `beatsToSec`, `secToBeats` |
| Màu | `rgb, hsl, oklch, mix, lighten, darken, saturate, alpha, hue` |
| Vector | `vec(x, y)`, `length, normalize, dot, rotate` |

Không có `Date`, `random` thật, I/O, hay bất kỳ thứ gì phụ thuộc máy (giữ AD-07). `valueAt` chỉ đọc **cùng thuộc tính**; không đọc chéo giữa các phần tử trong v1, để tránh vòng phụ thuộc. Nếu cần liên kết chéo, chỉ thêm khi có kiểm tra đồ thị phụ thuộc không có chu trình.

### 3.4 Giới hạn cứng

| Giới hạn | Giá trị đề xuất |
|---|---|
| Độ dài mã nguồn | 2.000 ký tự |
| Số nút cây cú pháp | 500 |
| Độ sâu lồng | 32 |
| Số `let` | 16 |
| Bước tính mỗi lần đánh giá | 10.000 |
| Tổng bước tính mỗi khung, toàn cảnh | 2.000.000 (vượt thì phần tử dùng giá trị dự phòng và báo cảnh báo) |

Kết quả `NaN` hoặc `Infinity` được thay bằng giá trị dự phòng (giá trị keyframe hoặc mặc định), và một cảnh báo được ghi theo phần tử. Khung hình không bao giờ bị hỏng.
