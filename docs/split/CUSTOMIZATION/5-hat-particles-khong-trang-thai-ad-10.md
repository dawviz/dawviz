---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "5. Hạt (particles) không trạng thái (AD-10)"
path: "5. Hạt (particles) không trạng thái (AD-10)"
chunk: 5-hat-particles-khong-trang-thai-ad-10.md
source_lines: 127-144
source_sha1: e3b1cd1a13
ids: [AD-10]
---
## 5. Hạt (particles) không trạng thái (AD-10)

Mô phỏng hạt thông thường tích luỹ theo từng khung, nên tua sẽ sai và xuất video không khớp Preview. Ở đây **mỗi hạt được tính trực tiếp từ thời điểm sinh của nó**:

```text
hạt i của lần phát e:  seed = hash(emitterId, e, i)          // PRNG mulberry32, không dùng Math.random
  tuổi a = t − tSinh;  nếu a < 0 hoặc a > life(seed) thì không vẽ
  vị trí  = p0 + v0·(1 − e^(−k·a))/k + ½·g·a²                // trọng lực + lực cản dạng đóng
  nhiễu   = noise2D(seed, a)·turbulence                       // nhiễu giá trị tất định, không phải mô phỏng
  opacity, size, color, rotation = Track theo tuổi chuẩn hoá a/life, kèm easing
```

* **Nguồn phát:** khi nốt bắt đầu (`hit`), liên tục trong lúc nốt kêu (`sustain`), khi nốt tắt (`exit`/`shatter`), tại vạch phát, theo nhịp (`beat`), hoặc môi trường (bụi, sao, tuyết).
* **Hình hạt:** chấm, vòng, sao, tia, hoặc ảnh lấy từ tài nguyên của phiên.
* **Tham số:** số hạt, tốc độ, góc toả, trọng lực, lực cản, nhiễu, tuổi thọ, kích thước, màu (cố định, theo nốt, theo track, hoặc gradient), chế độ hoà trộn (`additive` cho phát sáng).
* **Không hỗ trợ:** va chạm, hạt tương tác với nhau, chất lỏng. Những thứ này cần mô phỏng từng bước, trái với tính tất định.
* **Chi phí:** mỗi khung chỉ duyệt các lần phát còn sống trong cửa sổ `[t − lifeMax, t]`, nhờ chỉ mục theo thời gian giống `buildIndex` của nốt.
