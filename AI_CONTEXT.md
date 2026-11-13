# AI_CONTEXT — điểm vào cho AI và người mới

> **Đọc tệp này trước.** Nó cho biết (1) cách làm việc trong repo, (2) nên mở tệp nào cho từng loại việc, (3) mục lục đầy đủ của tài liệu đã chia nhỏ. Mục (3) do `scripts/sync-docs.mjs` sinh tự động; phần còn lại viết tay.

## 1. Dự án trong 5 dòng

DAW Visualizer: trình duyệt đọc tệp dự án DAW (Ableton `.als/.alp`, Reaper `.rpp`, `.dawproject`, `.mid`, nhị phân theo schema) → **Unified AST** (tick, PPQ 960) → **Render Core** (khung hình = hàm của thời gian `t`) → Preview Canvas và xuất MP4/WebM bằng WebCodecs. Không backend. Monorepo: `packages/*` (parser, i18n, render-core), `apps/web` (React), `docs/`. Trạng thái hiện tại: M1 (khung) — xem [PROGRESS.md](PROGRESS.md).

## 2. Bốn tệp lõi

| Tệp | Dùng khi |
|---|---|
| [AI_CONTEXT.md](AI_CONTEXT.md) (tệp này) | Bắt đầu mọi phiên; tìm tài liệu nào cần đọc |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Cần hiểu luồng dữ liệu (`.rpp` → AST → render), ranh giới package, quyết định kỹ thuật |
| [SKELETON.md](SKELETON.md) | Cần biết tệp nào làm gì, chữ ký hàm công khai (sinh tự động từ mã) |
| [PROGRESS.md](PROGRESS.md) | Cần biết cái gì xong/đang làm, giới hạn đã chốt (vd. chỉ `QN`), task tiếp theo, đánh giá lịch |

## 3. Quy tắc làm việc

1. **Tiết kiệm ngữ cảnh.** Đọc theo thứ tự: `PROGRESS.md` → bảng định tuyến (mục 4) → *đúng mảnh* cần dùng trong `docs/split/`. Không nạp cả BRD/SRS (hàng trăm KB). Tra nhanh: `node scripts/sync-docs.mjs --find "từ khóa"` hoặc `python3 scripts/split_doc.py --find REQ-ID`.
2. **Dẫn chiếu bằng ID** (`REQ-…`, `D-…`, `PD-…`, `AD-…`, `OI-…`, `SOI-…`, `AT-…`) thay vì chép lại nội dung. Không đổi số ID cũ; ID mới thêm ở cuối nhóm.
3. **Mã và tài liệu đổi cùng lúc.** Đổi hành vi → cập nhật tài liệu gốc trong `docs/` (SRS → SDD/Technical Design → TDD; parser dùng bộ `PARSER-*`) → chạy `npm run docs:sync`. Không bao giờ sửa tay: `SKELETON.md`, khối mục lục bên dưới, `docs/split/**`.
4. **Không đoán điều chưa kiểm.** Mục `[VERIFY]`/`[PROVISIONAL]` giữ nguyên nhãn; muốn đổi cần dữ liệu thật hoặc quyết định của người dùng. Không "sửa" giới hạn đã chốt (ARCHITECTURE §6, PROGRESS §2) mà không xin ý kiến.
5. **Tính tất định của Render Core.** Không `Date`, `performance`, `Math.random`, `requestAnimationFrame` trong `packages/render-core`; kết quả chỉ phụ thuộc `(scene, derived, ast, t, scale)`.
6. **Parser ném lỗi có mã.** Chỉ `DawParseError{code}` và cảnh báo `{code, message, details?}`; không để mất dữ liệu thầm lặng (mọi thứ bỏ qua đều có `WARN_*`).
7. **i18n ngay từ đầu.** Mọi chuỗi người dùng thấy dùng khoá trong `locales/*.json` (en là gốc; vi đi kèm); lỗi/cảnh báo dịch theo mã. Chạy `npm run i18n:check`.
8. **Không thêm phụ thuộc mới** vào `packages/*` (parser và i18n zero-dependency). Thư viện giao diện mới cần ghi quyết định (D-/AD-).
9. **Test đi cùng thay đổi.** Hàm thuần → test bằng `node --test`; giao diện → Vitest. Báo rõ cái gì *chưa chạy được* thay vì khẳng định đã chạy.
10. **Ngôn ngữ:** tài liệu và giao diện mặc định tiếng Việt (có bản en); mã, tên biến, mã lỗi bằng tiếng Anh.
11. **Git và công khai:** toàn bộ tài liệu (`docs/**`, kể cả `docs/split`) và bốn tệp lõi đều được commit và **công khai**; đừng ghi bí mật, khoá, đường dẫn máy cá nhân hay dữ liệu riêng vào tài liệu/mã. Tệp dự án nhạc chỉ được thêm vào `test/fixtures` khi chắc chắn được phép công khai. Hướng dẫn đóng góp: [CONTRIBUTING.md](CONTRIBUTING.md); trang web tài liệu: `npm run docs:site`.

## 4. Định tuyến theo tác vụ

| Tác vụ | Đọc (theo thứ tự) | Mã liên quan |
|---|---|---|
| Hiểu toàn cảnh / luồng dữ liệu | [ARCHITECTURE.md](ARCHITECTURE.md) · [Technical Design §1](docs/split/TECHNICAL-DESIGN/1-buc-tranh-tong-the.md#1-bức-tranh-tổng-thể) | — |
| Sửa/thêm parser Reaper | [PARSER-SDD §5](docs/split/PARSER-SDD/5-package-rpp-req-rpp.md#5-package-rpp-req-rpp-) · [PARSER-SRS §3.6](docs/split/PARSER-SRS/3-6-reaper-rpp-verify.md#36-reaper-rpp--verify) · [SRS REQ-PARSER-02](docs/split/SRS/req-parser-02-cockos-reaper-rpp.md#req-parser-02-cockos-reaper-rpp) | `packages/rpp/src/rpp.js`, `test/rpp.test.js` |
| Sửa/thêm parser Ableton | [PARSER-SRS §3.5](docs/split/PARSER-SRS/3-5-ableton-als-alp.md#35-ableton-als--alp) · [SRS REQ-PARSER-01](docs/split/SRS/req-parser-01-ableton-live-als.md#req-parser-01-ableton-live-als) · [REQ-PARSER-06](docs/split/SRS/req-parser-06-ableton-live-pack-alp.md#req-parser-06-ableton-live-pack-alp) | `packages/als/src/`, `test/als.test.js` |
| MIDI / DAWproject / nhị phân | [PARSER-SRS §3.8](docs/split/PARSER-SRS/3-8-midi.md#38-midi) · [§3.7](docs/split/PARSER-SRS/3-7-dawproject.md#37-dawproject) · [§3.9](docs/split/PARSER-SRS/3-9-binary-theo-schema.md#39-binary-theo-schema) | `packages/midi`, `packages/dawproject`, `packages/binary` |
| Thêm định dạng mới | [PARSER-SDD §11](docs/split/PARSER-SDD/11-mo-rong.md#11-mở-rộng) · [§8](docs/split/PARSER-SDD/8-package-parser-bao-ngoai.md#8-package-parser-bao-ngoài) | `packages/parser/src/index.js` |
| AST, tick, tempo, ghi đè tempo | [SRS §3.2](docs/split/SRS/3-2-cau-truc-du-lieu-chuan-hoa-unified-ast-d-08.md#32-cấu-trúc-dữ-liệu-chuẩn-hóa-unified-ast-d-08-d-09) · [REQ-PARSER-07](docs/split/SRS/req-parser-07-tempo-khong-doan-ngam-va-ghi-de-d.md#req-parser-07-tempo-không-đoán-ngầm-và-ghi-đè-d-24-d-29) · [Technical Design §2](docs/split/TECHNICAL-DESIGN/2-mo-hinh-du-lieu-va-thoi-gian.md#2-mô-hình-dữ-liệu-và-thời-gian-) | `packages/core/src/ast.js`, `packages/core/src/tempo.js` |
| Automation, độ sáng track | [Technical Design §2.3](docs/split/TECHNICAL-DESIGN/2-mo-hinh-du-lieu-va-thoi-gian.md#2-mô-hình-dữ-liệu-và-thời-gian-) · [SRS REQ-GRAPHICS-06](docs/split/SRS/req-graphics-06-do-sang-track-theo-automation-d.md#req-graphics-06-độ-sáng-track-theo-automation-d-33) | `packages/core/src/automation.js`, `packages/render-core/src/brightness.ts` |
| Render Core, Piano Roll, widget | [Technical Design §5](docs/split/TECHNICAL-DESIGN/5-1-giao-dien-chinh.md#51-giao-diện-chính-) · [SRS §3.4 (8 widget)](docs/split/SRS/3-4-dac-ta-8-widget-hud-br-02-br-03-br-04.md#34-đặc-tả-8-widget-hud-br-02-br-03-br-04) · [SDD §3](docs/split/SDD/3-render-core-dawviz-render-core-d-36.md#3-render-core-dawvizrender-core-d-36) | `packages/render-core/src/` |
| Giao diện, phát lại, chế độ chỉnh sửa | [Technical Design §6](docs/split/TECHNICAL-DESIGN/6-1-trang-thai.md#61-trạng-thái) · [SDD §4](docs/split/SDD/4-ung-dung-web-apps-web-d-34.md#4-ứng-dụng-web-appsweb-d-34) · [SRS §5.1](docs/split/SRS/5-1-bo-cuc-khong-gian-lam-viec.md#51-bố-cục-không-gian-làm-việc) | `apps/web/src/` |
| Tùy biến: storyboard, chuyển cảnh nốt, easing, hạt, tài nguyên phiên, preset cộng đồng | [CUSTOMIZATION](docs/design/CUSTOMIZATION.md) (đề xuất, AD-08…AD-12) · [ANIMATION](docs/design/ANIMATION.md) · [COMMUNITY-CONTENT](docs/COMMUNITY-CONTENT.md) | `packages/render-core/src/style.ts`, `presets/` (motion/particles: chưa có — T-17…T-20) |
| Biểu thức người dùng, bảo mật, kiểm duyệt preset cộng đồng | [EXPRESSIONS](docs/design/EXPRESSIONS.md) (đề xuất, AD-13…AD-15) · [ANIMATION-CATALOG](docs/design/ANIMATION-CATALOG.md) · SRS NFR-SEC | (chưa có — T-29…T-31; package `@dawviz/expr` dự kiến) |
| Xuất video | [Technical Design §7](docs/split/TECHNICAL-DESIGN/7-duong-ong-xuat-video-m3-spike-1-la-co-so.md#7-đường-ống-xuất-video--m3-spike-1-là-cơ-sở) · [REQ-EXPORT-00](docs/split/SRS/req-export-00-pre-flight-r-01-d-17.md#req-export-00-pre-flight-r-01-d-17)…[07](docs/split/SRS/req-export-07-thuc-thi-trong-worker-arc-02-d-21.md#req-export-07-thực-thi-trong-worker-arc-02-d-21) | (chưa có — M3) |
| Lưu trữ, Preset, Project Pack | [Technical Design §8](docs/split/TECHNICAL-DESIGN/8-luu-tru-m4.md#8-lưu-trữ--m4) · [SRS §3.5](docs/split/SRS/3-5-luu-tru-cau-hinh-dong-goi-br-05-d-11.md#35-lưu-trữ-cấu-hình--đóng-gói-br-05-d-11) | (chưa có — M4) |
| Đa ngôn ngữ / dịch | [I18N §1](docs/split/I18N/1-them-mot-ngon-ngu-moi-how-to-add-a-language.md#1-thêm-một-ngôn-ngữ-mới-how-to-add-a-language) · [§4](docs/split/I18N/4-quy-uoc-cho-nha-phat-trien-developer-rules.md#4-quy-ước-cho-nhà-phát-triển-developer-rules) · [SRS §3.7](docs/split/SRS/3-7-da-ngon-ngu-va-cong-dong-dich-br-09-d-30-kpi.md#37-đa-ngôn-ngữ-và-cộng-đồng-dịch-br-09-d-30-kpi-08) | `packages/i18n`, `locales/` |
| Viết/chạy test | [TDD §1](docs/split/TDD/1-chien-luoc.md#1-chiến-lược) · [PARSER-TDD §1](docs/split/PARSER-TDD/1-chien-luoc.md#1-chiến-lược) · [§7](docs/split/PARSER-TDD/7-quy-uoc-viet-test-moi.md#7-quy-ước-viết-test-mới) | `test/`, `packages/render-core/test/`, `apps/web/src/lib/*.test.ts` |
| Mã lỗi / cảnh báo | [SRS Phụ lục A](docs/split/SRS/phu-luc-a-ma-loi.md#phụ-lục-a-mã-lỗi) · [A2](docs/split/SRS/phu-luc-a2-ma-canh-bao-cua-parser-library.md#phụ-lục-a2-mã-cảnh-báo-của-parser-library) · [PARSER-SRS §4](docs/split/PARSER-SRS/4-ma-loi.md#4-mã-lỗi) | `locales/en.json` (`errors.*`, `warn.*`) |
| Quyết định, vấn đề mở, rủi ro | [BRD §7](docs/split/BRD/7-nhat-ky-quyet-dinh-decision-log.md#7-nhật-ký-quyết-định-decision-log) · [BRD §8](docs/split/BRD/8-cac-van-de-con-mo-open-issues.md#8-các-vấn-đề-còn-mở-open-issues) · [SRS §8](docs/split/SRS/8-cac-van-de-con-mo-cua-srs.md#8-các-vấn-đề-còn-mở-của-srs) · [BRD §5](docs/split/BRD/5-phan-tich-rui-ro-phuong-an-giam-thieu-risk-man.md#5-phân-tích-rủi-ro--phương-án-giảm-thiểu-risk-management) | — |
| Nghiệm thu | [SRS §7 (AT-xx)](docs/split/SRS/7-dieu-kien-nghiem-thu-va-ban-giao.md#7-điều-kiện-nghiệm-thu-và-bàn-giao) | — |

## 5. Lệnh thường dùng

```bash
npm install                      # cần mạng; Node >= 22.18
npm test                         # parser (66) + render-core (12) + logic web (9) + docs-site (6)
npm run test:components          # Vitest (thành phần React) — cần npm install
npm run typecheck && npm run build
npm run i18n:check               # kiểm danh mục ngôn ngữ
npm run docs:site                # dựng trang web tài liệu vào dist-docs/ (docs:serve để xem thử)
npm run docs:sync                # tách tài liệu, sinh SKELETON + mục lục bên dưới, kiểm liên kết
npm run docs:check               # như trên nhưng chỉ kiểm: exit 1 nếu cũ/hỏng/bị bỏ quên
node scripts/sync-docs.mjs --find "độ sáng"   # lấy liên kết mảnh#heading để dán vào tài liệu
```

## 6. Mục lục tài liệu đã chia nhỏ (sinh tự động)

<!-- sync:begin docs-index -->
<!-- Khối này do scripts/sync-docs.mjs sinh ra; đừng sửa tay. -->

Có 18 tài liệu, 272 mảnh. Mỗi mục là **một tệp nhỏ**; chỉ mở mảnh cần dùng. Mọi heading (kể cả cấp thấp) và neo `#…`: [docs/split/HEADINGS.md](docs/split/HEADINGS.md). Tìm nhanh: `node scripts/sync-docs.mjs --find "từ khóa"`.

### BRD.md — TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)

Nguồn: `docs/product/BRD.md` · [thứ tự đọc](docs/split/BRD/_index.md)

- [DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)](docs/split/BRD/du-an-trinh-truc-quan-hoa-du-lieu-du-an-am-nhac.md) · 4.1k
- [1. THÔNG TIN CHUNG & BỐI CẢNH DỰ ÁN](docs/split/BRD/1-thong-tin-chung-boi-canh-du-an.md) · 1.8k
- [2. MỤC TIÊU KINH DOANH, CHỈ SỐ ĐO LƯỜNG & YÊU CẦU NGHIỆP VỤ](docs/split/BRD/2-muc-tieu-kinh-doanh-chi-so-do-luong-yeu-cau-ng.md) · 4.8k
- [3. CHÂN DUNG NGƯỜI DÙNG MỤC TIÊU (USER PERSONAS)](docs/split/BRD/3-chan-dung-nguoi-dung-muc-tieu-user-personas.md) · 1.3k
- [4. PHẠM VI DỰ ÁN (PROJECT SCOPE) › 4.1. Trong phạm vi phiên bản 1.0 (In-Scope)](docs/split/BRD/4-1-trong-pham-vi-phien-ban-1-0-in-scope.md) · 3.2k
- [4. PHẠM VI DỰ ÁN (PROJECT SCOPE) › 4.3. Lộ trình phát hành (Milestones)](docs/split/BRD/4-3-lo-trinh-phat-hanh-milestones.md) · 0.9k
- [4. PHẠM VI DỰ ÁN (PROJECT SCOPE) › 4.4. Phân bổ theo bản phát hành (D-40, chốt ở tài liệu v1.1)](docs/split/BRD/4-4-phan-bo-theo-ban-phat-hanh-d-40-chot-o-tai-l.md) · 2.9k
- [4. PHẠM VI DỰ ÁN (PROJECT SCOPE) › 4.2. Ngoài phạm vi phiên bản 1.0 (Out-of-Scope)](docs/split/BRD/4-2-ngoai-pham-vi-phien-ban-1-0-out-of-scope.md) · 1.2k
- [5. PHÂN TÍCH RỦI RO & PHƯƠNG ÁN GIẢM THIỂU (RISK MANAGEMENT)](docs/split/BRD/5-phan-tich-rui-ro-phuong-an-giam-thieu-risk-man.md) · 4.3k
- [6. GIẢ ĐỊNH (ASSUMPTIONS)](docs/split/BRD/6-gia-dinh-assumptions.md) · 0.6k
- [7. NHẬT KÝ QUYẾT ĐỊNH (DECISION LOG)](docs/split/BRD/7-nhat-ky-quyet-dinh-decision-log.md) · 20.7k
- [8. CÁC VẤN ĐỀ CÒN MỞ (OPEN ISSUES)](docs/split/BRD/8-cac-van-de-con-mo-open-issues.md) · 4.6k

### SRS.md — ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)

Nguồn: `docs/product/SRS.md` · [thứ tự đọc](docs/split/SRS/_index.md)

- [DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO)](docs/split/SRS/du-an-trinh-truc-quan-hoa-du-lieu-du-an-am-nhac.md) · 0.4k
- [DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO) › Lịch sử phiên bản](docs/split/SRS/lich-su-phien-ban.md) · 6.9k
- [DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO) › Quy ước trong tài liệu](docs/split/SRS/quy-uoc-trong-tai-lieu.md) · 0.8k
- [DỰ ÁN: TRÌNH TRỰC QUAN HÓA DỮ LIỆU DỰ ÁN ÂM NHẠC & XUẤT VIDEO TRÊN TRÌNH DUYỆT (BROWSER-BASED DAW VISUALIZER STUDIO) › Mục lục](docs/split/SRS/muc-luc.md) · 0.4k
- [1. GIỚI THIỆU & MỤC TIÊU HỆ THỐNG](docs/split/SRS/1-gioi-thieu-muc-tieu-he-thong.md) · 4.7k
- [2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC › 2.1. Kiến trúc phân tầng hệ thống](docs/split/SRS/2-1-kien-truc-phan-tang-he-thong.md) · 6.6k
- [2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC › 2.2. Luồng dữ liệu chính](docs/split/SRS/2-2-luong-du-lieu-chinh.md) · 0.6k
- [2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC › 2.3. Thành phần bên thứ ba](docs/split/SRS/2-3-thanh-phan-ben-thu-ba.md) · 1.1k
- [2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC › 2.4. Đánh giá kiến trúc hiện tại](docs/split/SRS/2-4-danh-gia-kien-truc-hien-tai.md) · 2.2k
- [2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC › 2.5. Thư viện parser độc lập (D-23)](docs/split/SRS/2-5-thu-vien-parser-doc-lap-d-23.md) · 1.1k
- [2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC › 2.6. Ngăn xếp giao diện, Render Core và cấu trúc kho mã (D-34, D-35, D-36)](docs/split/SRS/2-6-ngan-xep-giao-dien-render-core-va-cau-truc-k.md) · 1.2k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) › REQ-PARSER-00: Thực thi an toàn và giới hạn đầu vào (R-05, R-09)](docs/split/SRS/req-parser-00-thuc-thi-an-toan-va-gioi-han-dau-v.md) · 1.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) › REQ-PARSER-01: Ableton Live (`.als`)](docs/split/SRS/req-parser-01-ableton-live-als.md) · 2.7k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) › REQ-PARSER-02: Cockos Reaper (`.rpp`)](docs/split/SRS/req-parser-02-cockos-reaper-rpp.md) · 3.7k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) › REQ-PARSER-03: DAWproject (`.dawproject`, D-03)](docs/split/SRS/req-parser-03-dawproject-dawproject-d-03.md) · 1.2k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) › REQ-PARSER-04: Standard MIDI File (`.mid`, format 0/1)](docs/split/SRS/req-parser-04-standard-midi-file-mid-format-0-1.md) · 0.9k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) › REQ-PARSER-05: Parser JSON khai báo (D-18, D-28, R-05)](docs/split/SRS/req-parser-05-parser-json-khai-bao-d-18-d-28-r-0.md) · 1.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) › REQ-PARSER-06: Ableton Live Pack (`.alp`)](docs/split/SRS/req-parser-06-ableton-live-pack-alp.md) · 1.1k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) › REQ-PARSER-07: Tempo không đoán ngầm và ghi đè (D-24, D-29)](docs/split/SRS/req-parser-07-tempo-khong-doan-ngam-va-ghi-de-d.md) · 1.7k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.2. Cấu trúc dữ liệu chuẩn hóa (Unified AST, D-08, D-09)](docs/split/SRS/3-2-cau-truc-du-lieu-chuan-hoa-unified-ast-d-08.md) · 3.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-00: Độ phân giải thiết kế logic (D-06)](docs/split/SRS/req-graphics-00-do-phan-giai-thiet-ke-logic-d-06.md) · 0.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-01: Phân lớp đồ họa (D-07)](docs/split/SRS/req-graphics-01-phan-lop-do-hoa-d-07.md) · 0.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-02: Bắt dính thông minh](docs/split/SRS/req-graphics-02-bat-dinh-thong-minh.md) · 0.8k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-16: Thanh phát (playhead) tuỳ chỉnh](docs/split/SRS/req-graphics-16-thanh-phat-playhead-tuy-chinh.md) · 1.1k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-03: Xoay widget tự do (D-54, thay D-15)](docs/split/SRS/req-graphics-03-xoay-widget-tu-do-d-54-thay-d-15.md) · 1.3k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-04: Preset dựng sẵn và đổi tỉ lệ khung](docs/split/SRS/req-graphics-04-preset-dung-san-va-doi-ti-le-khu.md) · 0.7k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-06: Độ sáng track theo automation (D-33)](docs/split/SRS/req-graphics-06-do-sang-track-theo-automation-d.md) · 2.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-07: Kiểu dáng nốt tuỳ chỉnh và bàn phím](docs/split/SRS/req-graphics-07-kieu-dang-not-tuy-chinh-va-ban-p.md) · 3.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-08: Hiệu ứng chuyển động tất định (D-37)](docs/split/SRS/req-graphics-08-hieu-ung-chuyen-dong-tat-dinh-d.md) · 0.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-05: Render Core dùng chung (ARC-01, D-20)](docs/split/SRS/req-graphics-05-render-core-dung-chung-arc-01-d.md) · 1.0k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-GRAPHICS-17: Phát sáng động khi chạm (D-50, 1.0)](docs/split/SRS/req-graphics-17-phat-sang-dong-khi-cham-d-50-1-0.md) · 2.8k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) › REQ-AST-02: Automation tổng quát (D-50; 1.0 cho Reaper track + MIDI CC, các nguồn khác theo tệp mẫu)](docs/split/SRS/req-ast-02-automation-tong-quat-d-50-1-0-cho-rea.md) · 2.2k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04)](docs/split/SRS/3-4-dac-ta-8-widget-hud-br-02-br-03-br-04.md) · 0.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-WIDGET-01: Piano Roll](docs/split/SRS/req-widget-01-piano-roll.md) · 1.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-WIDGET-02: Track Info](docs/split/SRS/req-widget-02-track-info.md) · 1.0k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-WIDGET-03: Event Counter](docs/split/SRS/req-widget-03-event-counter.md) · 1.1k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-WIDGET-04: Live Note Trigger](docs/split/SRS/req-widget-04-live-note-trigger.md) · 0.9k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-WIDGET-05: Time & Bar Counter](docs/split/SRS/req-widget-05-time-bar-counter.md) · 1.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-WIDGET-06: Chord Detection (D-09)](docs/split/SRS/req-widget-06-chord-detection-d-09.md) · 1.8k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-WIDGET-07: Audio Spectrum & Meter (D-10, ARC-03, ARC-06)](docs/split/SRS/req-widget-07-audio-spectrum-meter-d-10-arc-03-a.md) · 2.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-AUDIO-01: Âm thanh theo track (stem), bản 1.2](docs/split/SRS/req-audio-01-am-thanh-theo-track-stem-ban-1-2.md) · 3.3k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) › REQ-WIDGET-08: Progress Bar (D-27)](docs/split/SRS/req-widget-08-progress-bar-d-27.md) · 0.8k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.4b. Đề xuất widget và dữ liệu hiển thị bổ sung (D-32, OI-11) **[ĐỀ XUẤT, chưa cam kết v1.0]**](docs/split/SRS/3-4b-de-xuat-widget-va-du-lieu-hien-thi-bo-sung.md) · 3.0k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.5. Lưu trữ, cấu hình & đóng gói (BR-05, D-11)](docs/split/SRS/3-5-luu-tru-cau-hinh-dong-goi-br-05-d-11.md) · 3.2k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-CAP-01: Phát hiện khả năng của trình duyệt (R-06, D-05)](docs/split/SRS/req-cap-01-phat-hien-kha-nang-cua-trinh-duyet-r.md) · 0.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-00: Pre-flight (R-01, D-17)](docs/split/SRS/req-export-00-pre-flight-r-01-d-17.md) · 2.6k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-01: Xung nhịp khung hình độc lập](docs/split/SRS/req-export-01-xung-nhip-khung-hinh-doc-lap.md) · 0.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-02: Kiểm soát dòng chảy (R-01)](docs/split/SRS/req-export-02-kiem-soat-dong-chay-r-01.md) · 0.2k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-03: Luồng âm thanh và Silent Audio (D-01 sửa, R-08)](docs/split/SRS/req-export-03-luong-am-thanh-va-silent-audio-d-0.md) · 1.3k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-04: Ghép container qua Mediabunny (D-04)](docs/split/SRS/req-export-04-ghep-container-qua-mediabunny-d-04.md) · 0.8k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-05: Giao diện tiến độ và hủy](docs/split/SRS/req-export-05-giao-dien-tien-do-va-huy.md) · 0.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-06: Chuỗi dự phòng codec (D-05, R-06)](docs/split/SRS/req-export-06-chuoi-du-phong-codec-d-05-r-06.md) · 2.4k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-08: Xuất nền trong suốt để ghép trong phần mềm dựng (D-47), bản 1.0](docs/split/SRS/req-export-08-xuat-nen-trong-suot-de-ghep-trong.md) · 2.1k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) › REQ-EXPORT-07: Thực thi trong Worker (ARC-02, D-21)](docs/split/SRS/req-export-07-thuc-thi-trong-worker-arc-02-d-21.md) · 0.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.7. Đa ngôn ngữ và cộng đồng dịch (BR-09, D-30, KPI-08)](docs/split/SRS/3-7-da-ngon-ngu-va-cong-dong-dich-br-09-d-30-kpi.md) · 2.7k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40)](docs/split/SRS/3-8-tuy-bien-hieu-ung-va-bieu-thuc-d-38-d-39-d-4.md) · 0.3k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-GRAPHICS-09: Bộ máy keyframe, easing và Graph Editor](docs/split/SRS/req-graphics-09-bo-may-keyframe-easing-va-graph.md) · 0.8k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-GRAPHICS-10: Template chuyển cảnh nốt](docs/split/SRS/req-graphics-10-template-chuyen-canh-not.md) · 0.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-GRAPHICS-11: Hạt không trạng thái](docs/split/SRS/req-graphics-11-hat-khong-trang-thai.md) · 0.3k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-GRAPHICS-12: Storyboard, hiệu ứng và chữ động](docs/split/SRS/req-graphics-12-storyboard-hieu-ung-va-chu-dong.md) · 0.5k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-GRAPHICS-13: Biểu thức thuộc tính](docs/split/SRS/req-graphics-13-bieu-thuc-thuoc-tinh.md) · 0.3k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-GRAPHICS-14: Khoảng hiển thị theo thời gian và theo track](docs/split/SRS/req-graphics-14-khoang-hien-thi-theo-thoi-gian-v.md) · 0.8k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-GRAPHICS-15: Không gian 2.5D: xoay X/Y/Z và camera phối cảnh (D-47), bản 1.1](docs/split/SRS/req-graphics-15-khong-gian-2-5d-xoay-x-y-z-va-ca.md) · 1.9k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-STORAGE-05: Tài nguyên của phiên](docs/split/SRS/req-storage-05-tai-nguyen-cua-phien.md) · 0.3k
- [3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) › 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) › REQ-STORAGE-06: Preset mới và chia sẻ](docs/split/SRS/req-storage-06-preset-moi-va-chia-se.md) · 0.4k
- [4. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)](docs/split/SRS/4-yeu-cau-phi-chuc-nang-non-functional-requireme.md) · 5.2k
- [5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG › 5.1. Bố cục không gian làm việc](docs/split/SRS/5-1-bo-cuc-khong-gian-lam-viec.md) · 3.7k
- [5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG › 5.2. Chế độ tương tác](docs/split/SRS/5-2-che-do-tuong-tac.md) · 0.4k
- [5. ĐẶC TẢ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG › 5.3. Yêu cầu giao diện](docs/split/SRS/5-3-yeu-cau-giao-dien.md) · 15.9k
- [6. MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU](docs/split/SRS/6-ma-tran-truy-xuat-nguon-goc-yeu-cau.md) · 1.4k
- [7. ĐIỀU KIỆN NGHIỆM THU VÀ BÀN GIAO](docs/split/SRS/7-dieu-kien-nghiem-thu-va-ban-giao.md) · 6.7k
- [8. CÁC VẤN ĐỀ CÒN MỞ CỦA SRS](docs/split/SRS/8-cac-van-de-con-mo-cua-srs.md) · 4.0k
- [9. PHỤ LỤC › Phụ lục A: Mã lỗi](docs/split/SRS/phu-luc-a-ma-loi.md) · 2.4k
- [9. PHỤ LỤC › Phụ lục A1: Mã cảnh báo khi đọc Preset/Scene (REQ-STORAGE-02)](docs/split/SRS/phu-luc-a1-ma-canh-bao-khi-doc-preset-scene-req.md) · 1.2k
- [9. PHỤ LỤC › Phụ lục A2: Mã cảnh báo của Parser Library](docs/split/SRS/phu-luc-a2-ma-canh-bao-cua-parser-library.md) · 1.1k
- [9. PHỤ LỤC › Phụ lục B: Ghi chú rà soát](docs/split/SRS/phu-luc-b-ghi-chu-ra-soat.md) · 2.9k

### SDD.md — TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER

Nguồn: `docs/design/SDD.md` · [thứ tự đọc](docs/split/SDD/_index.md)

- [TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER (mở đầu)](docs/split/SDD/tai-lieu-thiet-ke-phan-mem-sdd-ung-dung-daw-visu.md) · 0.5k
- [1. Phạm vi và nguyên tắc](docs/split/SDD/1-pham-vi-va-nguyen-tac.md) · 0.6k
- [2. Cấu trúc kho mã (D-35)](docs/split/SDD/2-cau-truc-kho-ma-d-35.md) · 0.7k
- [3. Render Core (`@dawviz/render-core`, D-36)](docs/split/SDD/3-render-core-dawviz-render-core-d-36.md) · 1.1k
- [4. Ứng dụng web (`apps/web`, D-34)](docs/split/SDD/4-ung-dung-web-apps-web-d-34.md) · 1.3k
- [5. Quyết định thiết kế của ứng dụng](docs/split/SDD/5-quyet-dinh-thiet-ke-cua-ung-dung.md) · 1.2k
- [6. Tính tất định và an toàn](docs/split/SDD/6-tinh-tat-dinh-va-an-toan.md) · 0.3k
- [7. Mở rộng](docs/split/SDD/7-mo-rong.md) · 0.4k
- [8. Tình trạng (M1 — khung đầu)](docs/split/SDD/8-tinh-trang-m1-khung-dau.md) · 0.5k

### TECHNICAL-DESIGN.md — THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER

Nguồn: `docs/design/TECHNICAL-DESIGN.md` · [thứ tự đọc](docs/split/TECHNICAL-DESIGN/_index.md)

- [THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER (mở đầu)](docs/split/TECHNICAL-DESIGN/thiet-ke-ky-thuat-chi-tiet-technical-design-daw.md) · 0.7k
- [1. Bức tranh tổng thể](docs/split/TECHNICAL-DESIGN/1-buc-tranh-tong-the.md) · 2.4k
- [2. Mô hình dữ liệu và thời gian 🟢](docs/split/TECHNICAL-DESIGN/2-mo-hinh-du-lieu-va-thoi-gian.md) · 2.9k
- [3. Đường ống phân tích (parser) 🟢](docs/split/TECHNICAL-DESIGN/3-duong-ong-phan-tich-parser.md) · 1.9k
- [4. Dữ liệu dẫn xuất (derived) 🟢/⚪](docs/split/TECHNICAL-DESIGN/4-du-lieu-dan-xuat-derived.md) · 1.3k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.0 Kiểu dáng nốt và bàn phím 🟢 (REQ-GRAPHICS-07)](docs/split/TECHNICAL-DESIGN/5-0-kieu-dang-not-va-ban-phim-req-graphics-07.md) · 0.6k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.1 Giao diện chính 🟢](docs/split/TECHNICAL-DESIGN/5-1-giao-dien-chinh.md) · 3.9k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.2 Hợp đồng widget 🟢](docs/split/TECHNICAL-DESIGN/5-2-hop-dong-widget.md) · 0.5k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.3 Hệ toạ độ và tỉ lệ 🟡](docs/split/TECHNICAL-DESIGN/5-3-he-toa-do-va-ti-le.md) · 0.4k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.4 Piano Roll 🟢](docs/split/TECHNICAL-DESIGN/5-4-piano-roll.md) · 0.7k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.5 Quy tắc tất định (kiểm bằng test)](docs/split/TECHNICAL-DESIGN/5-5-quy-tac-tat-dinh-kiem-bang-test.md) · 0.6k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.6 Phát sáng động khi chạm 🟢](docs/split/TECHNICAL-DESIGN/5-6-phat-sang-dong-khi-cham.md) · 1.8k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.7 Primitive chữ và nạp phông 🟢 (T-69, SRS REQ-WIDGET-02)](docs/split/TECHNICAL-DESIGN/5-7-primitive-chu-va-nap-phong-t-69-srs-req-widg.md) · 5.0k
- [5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại › 5.8 Dữ liệu cho widget Bar.Beat: AST đã có bản đồ nhịp 🟢 (đã dùng ở T-69)](docs/split/TECHNICAL-DESIGN/5-8-du-lieu-cho-widget-bar-beat-ast-da-co-ban-do.md) · 0.9k
- [6. Ứng dụng web và phát lại 🟡 › 6.1 Trạng thái](docs/split/TECHNICAL-DESIGN/6-1-trang-thai.md) · 1.3k
- [6. Ứng dụng web và phát lại 🟡 › 6.2 Phát lại và âm thanh ⚪](docs/split/TECHNICAL-DESIGN/6-2-phat-lai-va-am-thanh.md) · 0.6k
- [6. Ứng dụng web và phát lại 🟡 › 6.3 Danh sách track 🟢](docs/split/TECHNICAL-DESIGN/6-3-danh-sach-track.md) · 1.9k
- [6. Ứng dụng web và phát lại 🟡 › 6.4 Store, lệnh, hoàn tác và chế độ chỉnh sửa 🟢 (T-07; giao diện kéo thả widget ⚪ T-68)](docs/split/TECHNICAL-DESIGN/6-4-store-lenh-hoan-tac-va-che-do-chinh-sua-t-07.md) · 12.2k
- [7. Đường ống xuất video ⚪ (M3; Spike 1 là cơ sở)](docs/split/TECHNICAL-DESIGN/7-duong-ong-xuat-video-m3-spike-1-la-co-so.md) · 2.0k
- [8. Lưu trữ ⚪ (M4)](docs/split/TECHNICAL-DESIGN/8-luu-tru-m4.md) · 1.0k
- [9. Đa ngôn ngữ 🟢](docs/split/TECHNICAL-DESIGN/9-da-ngon-ngu.md) · 0.5k
- [10. Lỗi, ghi nhật ký, quan sát](docs/split/TECHNICAL-DESIGN/10-loi-ghi-nhat-ky-quan-sat.md) · 0.5k
- [11. Hiệu năng và bộ nhớ (ngân sách)](docs/split/TECHNICAL-DESIGN/11-hieu-nang-va-bo-nho-ngan-sach.md) · 0.6k
- [12. Bảo mật và quyền riêng tư](docs/split/TECHNICAL-DESIGN/12-bao-mat-va-quyen-rieng-tu.md) · 0.7k
- [13. Xây dựng, kiểm thử, phát hành](docs/split/TECHNICAL-DESIGN/13-xay-dung-kiem-thu-phat-hanh.md) · 0.9k
- [14. Việc cần làm theo mốc (từ thiết kế này)](docs/split/TECHNICAL-DESIGN/14-viec-can-lam-theo-moc-tu-thiet-ke-nay.md) · 0.8k

### TDD.md — TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER

Nguồn: `docs/design/TDD.md` · [thứ tự đọc](docs/split/TDD/_index.md)

- [TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER (mở đầu)](docs/split/TDD/tai-lieu-thiet-ke-kiem-thu-tdd-test-design-docum.md) · 0.8k
- [1. Chiến lược](docs/split/TDD/1-chien-luoc.md) · 1.0k
- [2. Danh mục test mới](docs/split/TDD/2-danh-muc-test-moi.md) · 1.3k
- [3. Ma trận truy vết](docs/split/TDD/3-ma-tran-truy-vet.md) · 0.4k
- [4. Khoảng trống đã biết](docs/split/TDD/4-khoang-trong-da-biet.md) · 0.4k
- [5. Danh sách kiểm thủ công cho AT-18 (Chrome)](docs/split/TDD/5-danh-sach-kiem-thu-cong-cho-at-18-chrome.md) · 4.1k

### ANIMATION.md — Hiệu ứng chuyển động và xuất video: so sánh công cụ và quyết định

Nguồn: `docs/design/ANIMATION.md` · [thứ tự đọc](docs/split/ANIMATION/_index.md)

- [Hiệu ứng chuyển động và xuất video: so sánh công cụ và quyết định (mở đầu)](docs/split/ANIMATION/hieu-ung-chuyen-dong-va-xuat-video-so-sanh-cong.md) · 0.5k
- [1. Vấn đề cốt lõi](docs/split/ANIMATION/1-van-de-cot-loi.md) · 0.6k
- [2. Các lựa chọn đã xét](docs/split/ANIMATION/2-cac-lua-chon-da-xet.md) · 1.2k
- [2.1 Điều rút ra](docs/split/ANIMATION/2-1-dieu-rut-ra.md) · 0.4k
- [3. Quyết định](docs/split/ANIMATION/3-quyet-dinh.md) · 1.0k
- [4. Việc cần làm (T-15)](docs/split/ANIMATION/4-viec-can-lam-t-15.md) · 0.7k
- [5. Việc cần xác minh trước khi dùng thư viện ngoài](docs/split/ANIMATION/5-viec-can-xac-minh-truoc-khi-dung-thu-vien-ngoa.md) · 0.5k

### CUSTOMIZATION.md — Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng

Nguồn: `docs/design/CUSTOMIZATION.md` · [thứ tự đọc](docs/split/CUSTOMIZATION/_index.md)

- [Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng (mở đầu)](docs/split/CUSTOMIZATION/tuy-bien-toi-da-storyboard-chuyen-canh-not-duong.md) · 0.9k
- [1. Mục tiêu và ranh giới](docs/split/CUSTOMIZATION/1-muc-tieu-va-ranh-gioi.md) · 0.9k
- [2. Nguyên tắc dễ dùng](docs/split/CUSTOMIZATION/2-nguyen-tac-de-dung.md) · 1.6k
- [3. Mô hình dữ liệu storyboard (AD-08)](docs/split/CUSTOMIZATION/3-mo-hinh-du-lieu-storyboard-ad-08.md) · 4.9k
- [4. Đường cong chuyển động (easing) (AD-09)](docs/split/CUSTOMIZATION/4-duong-cong-chuyen-dong-easing-ad-09.md) · 1.2k
- [5. Hạt (particles) không trạng thái (AD-10)](docs/split/CUSTOMIZATION/5-hat-particles-khong-trang-thai-ad-10.md) · 1.4k
- [6. Tài nguyên (assets) của phiên và của cộng đồng (AD-12)](docs/split/CUSTOMIZATION/6-tai-nguyen-assets-cua-phien-va-cua-cong-dong-a.md) · 2.3k
- [7. Hiệu năng và giới hạn](docs/split/CUSTOMIZATION/7-hieu-nang-va-gioi-han.md) · 0.6k
- [8. Quyết định đề xuất](docs/split/CUSTOMIZATION/8-quyet-dinh-de-xuat.md) · 1.1k
- [9. Yêu cầu tương ứng (đã đưa vào SRS §3.8)](docs/split/CUSTOMIZATION/9-yeu-cau-tuong-ung-da-dua-vao-srs-3-8.md) · 0.9k
- [10. Khả thi](docs/split/CUSTOMIZATION/10-kha-thi.md) · 1.6k
- [11. Vấn đề mở](docs/split/CUSTOMIZATION/11-van-de-mo.md) · 0.4k
- [12. Hướng 3D đầy đủ (sau 1.2) **[ĐỀ XUẤT, chưa chốt]**](docs/split/CUSTOMIZATION/12-huong-3d-day-du-sau-1-2-de-xuat-chua-chot.md) · 3.1k

### ANIMATION-CATALOG.md — Danh mục hiệu ứng chuyển động và đường cong nội suy

Nguồn: `docs/design/ANIMATION-CATALOG.md` · [thứ tự đọc](docs/split/ANIMATION-CATALOG/_index.md)

- [Danh mục hiệu ứng chuyển động và đường cong nội suy (mở đầu)](docs/split/ANIMATION-CATALOG/danh-muc-hieu-ung-chuyen-dong-va-duong-cong-noi.md) · 0.9k
- [0. Cách đọc bảng](docs/split/ANIMATION-CATALOG/0-cach-doc-bang.md) · 0.6k
- [1. Kiểu nội suy keyframe (theo thời gian)](docs/split/ANIMATION-CATALOG/1-kieu-noi-suy-keyframe-theo-thoi-gian.md) · 1.1k
- [2. Thư viện easing đặt sẵn](docs/split/ANIMATION-CATALOG/2-thu-vien-easing-dat-san.md) · 1.3k
- [3. Đồ thị (Graph Editor)](docs/split/ANIMATION-CATALOG/3-do-thi-graph-editor.md) · 1.2k
- [4. Nội suy không gian và kiểu giá trị](docs/split/ANIMATION-CATALOG/4-noi-suy-khong-gian-va-kieu-gia-tri.md) · 0.7k
- [5. Ngoại suy, lặp và bộ biến đổi đường cong](docs/split/ANIMATION-CATALOG/5-ngoai-suy-lap-va-bo-bien-doi-duong-cong.md) · 0.8k
- [6. Hiệu ứng biến đổi cơ bản (transform)](docs/split/ANIMATION-CATALOG/6-hieu-ung-bien-doi-co-ban-transform.md) · 0.8k
- [7. Hiện/ẩn, che và lộ (reveal)](docs/split/ANIMATION-CATALOG/7-hien-an-che-va-lo-reveal.md) · 0.8k
- [8. Hình dạng (shape) và biến dạng hình học](docs/split/ANIMATION-CATALOG/8-hinh-dang-shape-va-bien-dang-hinh-hoc.md) · 0.7k
- [9. Chuyển động "có vật lý" (cảm giác tự nhiên)](docs/split/ANIMATION-CATALOG/9-chuyen-dong-co-vat-ly-cam-giac-tu-nhien.md) · 0.6k
- [10. Hiệu ứng thủ tục (procedural)](docs/split/ANIMATION-CATALOG/10-hieu-ung-thu-tuc-procedural.md) · 0.6k
- [11. Màu và ánh sáng](docs/split/ANIMATION-CATALOG/11-mau-va-anh-sang.md) · 0.7k
- [12. Làm mờ, biến dạng điểm ảnh và phong cách hoá](docs/split/ANIMATION-CATALOG/12-lam-mo-bien-dang-diem-anh-va-phong-cach-hoa.md) · 1.0k
- [13. Chữ (text)](docs/split/ANIMATION-CATALOG/13-chu-text.md) · 0.7k
- [14. Chuyển cảnh (giữa hai cảnh hoặc hai đoạn)](docs/split/ANIMATION-CATALOG/14-chuyen-canh-giua-hai-canh-hoac-hai-doan.md) · 0.7k
- [15. Camera](docs/split/ANIMATION-CATALOG/15-camera.md) · 0.6k
- [16. Nhân bản và vệt](docs/split/ANIMATION-CATALOG/16-nhan-ban-va-vet.md) · 0.4k
- [17. Hạt (bổ sung cho CUSTOMIZATION §5)](docs/split/ANIMATION-CATALOG/17-hat-bo-sung-cho-customization-5.md) · 0.5k
- [18. Riêng cho âm nhạc (điểm mạnh của DAW Visualizer)](docs/split/ANIMATION-CATALOG/18-rieng-cho-am-nhac-diem-manh-cua-daw-visualize.md) · 0.9k
- [19. Thời gian (time controls)](docs/split/ANIMATION-CATALOG/19-thoi-gian-time-controls.md) · 0.7k
- [20. Hoà trộn và tổng hợp lớp](docs/split/ANIMATION-CATALOG/20-hoa-tron-va-tong-hop-lop.md) · 0.5k
- [21. Phạm vi đã chốt](docs/split/ANIMATION-CATALOG/21-pham-vi-da-chot.md) · 0.6k

### EXPRESSIONS.md — Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng

Nguồn: `docs/design/EXPRESSIONS.md` · [thứ tự đọc](docs/split/EXPRESSIONS/_index.md)

- [Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng (mở đầu)](docs/split/EXPRESSIONS/bieu-thuc-nguoi-dung-mo-hinh-bao-mat-va-kiem-duy.md) · 0.8k
- [1. Nguyên tắc nền](docs/split/EXPRESSIONS/1-nguyen-tac-nen.md) · 0.7k
- [2. "Mã độc" ở đây là gì](docs/split/EXPRESSIONS/2-ma-doc-o-day-la-gi.md) · 3.0k
- [3. Ngôn ngữ biểu thức (AD-13)](docs/split/EXPRESSIONS/3-ngon-ngu-bieu-thuc-ad-13.md) · 3.5k
- [4. Trình thông dịch an toàn](docs/split/EXPRESSIONS/4-trinh-thong-dich-an-toan.md) · 2.0k
- [5. Phòng thủ nhiều lớp cho ứng dụng (AD-14)](docs/split/EXPRESSIONS/5-phong-thu-nhieu-lop-cho-ung-dung-ad-14.md) · 1.6k
- [6. Kiểm duyệt template và preset qua cộng đồng (AD-15)](docs/split/EXPRESSIONS/6-kiem-duyet-template-va-preset-qua-cong-dong-ad.md) · 3.2k
- [7. Yêu cầu tương ứng (đã đưa vào SRS v1.1)](docs/split/EXPRESSIONS/7-yeu-cau-tuong-ung-da-dua-vao-srs-v1-1.md) · 0.5k
- [8. Ước lượng](docs/split/EXPRESSIONS/8-uoc-luong.md) · 0.5k
- [9. Vấn đề mở](docs/split/EXPRESSIONS/9-van-de-mo.md) · 0.2k

### UI-DIRECTION.md — Định hướng hình ảnh: khung preview và giao diện web

Nguồn: `docs/design/UI-DIRECTION.md` · [thứ tự đọc](docs/split/UI-DIRECTION/_index.md)

- [Định hướng hình ảnh: khung preview và giao diện web (mở đầu)](docs/split/UI-DIRECTION/dinh-huong-hinh-anh-khung-preview-va-giao-dien-w.md) · 2.2k
- [1. Khung preview: hướng "Bản in" 🟡 đã chốt hướng, chưa làm (D-51)](docs/split/UI-DIRECTION/1-khung-preview-huong-ban-in-da-chot-huong-chua.md) · 4.2k
- [2. Giao diện web: vì sao đang trông "AI slop"](docs/split/UI-DIRECTION/2-giao-dien-web-vi-sao-dang-trong-ai-slop.md) · 1.5k
- [3. Bộ prompt sinh ảnh giao diện web › 3.1 Cách dùng](docs/split/UI-DIRECTION/3-1-cach-dung.md) · 0.5k
- [3. Bộ prompt sinh ảnh giao diện web › 3.2 Khối chung (luôn dán)](docs/split/UI-DIRECTION/3-2-khoi-chung-luon-dan.md) · 1.7k
- [3. Bộ prompt sinh ảnh giao diện web › 3.3 Các hướng (chọn một, dán sau khối chung)](docs/split/UI-DIRECTION/3-3-cac-huong-chon-mot-dan-sau-khoi-chung.md) · 4.3k
- [3. Bộ prompt sinh ảnh giao diện web › 3.4 Khối tránh (luôn dán cuối)](docs/split/UI-DIRECTION/3-4-khoi-tranh-luon-dan-cuoi.md) · 0.4k
- [3. Bộ prompt sinh ảnh giao diện web › 3.5 Prompt phụ](docs/split/UI-DIRECTION/3-5-prompt-phu.md) · 1.3k
- [3. Bộ prompt sinh ảnh giao diện web › 3.6 Tiêu chí chọn](docs/split/UI-DIRECTION/3-6-tieu-chi-chon.md) · 0.6k
- [3. Bộ prompt sinh ảnh giao diện web › 3.7 Khung bố cục chung (từ vòng 1, dùng cho vòng 2)](docs/split/UI-DIRECTION/3-7-khung-bo-cuc-chung-tu-vong-1-dung-cho-vong-2.md) · 1.5k
- [3. Bộ prompt sinh ảnh giao diện web › 3.8 Prompt vòng 2 (dùng kèm tệp đính kèm)](docs/split/UI-DIRECTION/3-8-prompt-vong-2-dung-kem-tep-dinh-kem.md) · 9.8k
- [4. Nhật ký thử và hướng được chọn](docs/split/UI-DIRECTION/4-nhat-ky-thu-va-huong-duoc-chon.md) · 3.5k
- [5. Theme giao diện chỉ đổi màu (D-52) › 5.1 Quyết định](docs/split/UI-DIRECTION/5-1-quyet-dinh.md) · 0.8k
- [5. Theme giao diện chỉ đổi màu (D-52) › 5.2 Bộ token (đề xuất, chốt khi làm)](docs/split/UI-DIRECTION/5-2-bo-token-de-xuat-chot-khi-lam.md) · 1.0k
- [5. Theme giao diện chỉ đổi màu (D-52) › 5.3 Cấu trúc giao diện: D + A + E (D-53, đã chốt 2026-11-13)](docs/split/UI-DIRECTION/5-3-cau-truc-giao-dien-d-a-e-d-53-da-chot-2026-1.md) · 2.5k
- [5. Theme giao diện chỉ đổi màu (D-52) › 5.4 Bảng màu dựng sẵn (đã kiểm AA, v0.5)](docs/split/UI-DIRECTION/5-4-bang-mau-dung-san-da-kiem-aa-v0-5.md) · 4.5k
- [6. Việc tiếp theo đề xuất](docs/split/UI-DIRECTION/6-viec-tiep-theo-de-xuat.md) · 0.9k
- [7. Nguyên tắc sản phẩm: trình dựng thật, mặc định đơn giản (D-54)](docs/split/UI-DIRECTION/7-nguyen-tac-san-pham-trinh-dung-that-mac-dinh-d.md) · 1.1k

### PARSER-SRS.md — SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer

Nguồn: `docs/parser/PARSER-SRS.md` · [thứ tự đọc](docs/split/PARSER-SRS/_index.md)

- [SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer (mở đầu)](docs/split/PARSER-SRS/srs-dac-ta-yeu-cau-thu-vien-parser-daw-visualize.md) · 0.4k
- [1. Mục đích và phạm vi](docs/split/PARSER-SRS/1-muc-dich-va-pham-vi.md) · 0.4k
- [2. Định dạng hỗ trợ](docs/split/PARSER-SRS/2-dinh-dang-ho-tro.md) · 1.2k
- [3. Yêu cầu chức năng › 3.1 Chung (core)](docs/split/PARSER-SRS/3-1-chung-core.md) · 0.7k
- [3. Yêu cầu chức năng › 3.2 Giới hạn và an toàn (REQ-PARSER-00)](docs/split/PARSER-SRS/3-2-gioi-han-va-an-toan-req-parser-00.md) · 0.8k
- [3. Yêu cầu chức năng › 3.3 Tempo và thời gian](docs/split/PARSER-SRS/3-3-tempo-va-thoi-gian.md) · 0.7k
- [3. Yêu cầu chức năng › 3.4 AST (REQ-AST-01)](docs/split/PARSER-SRS/3-4-ast-req-ast-01.md) · 0.7k
- [3. Yêu cầu chức năng › 3.5 Ableton (.als / .alp)](docs/split/PARSER-SRS/3-5-ableton-als-alp.md) · 6.1k
- [3. Yêu cầu chức năng › 3.6 Reaper (.rpp) — VERIFY](docs/split/PARSER-SRS/3-6-reaper-rpp-verify.md) · 4.5k
- [3. Yêu cầu chức năng › 3.7 DAWproject](docs/split/PARSER-SRS/3-7-dawproject.md) · 0.7k
- [3. Yêu cầu chức năng › 3.8 MIDI](docs/split/PARSER-SRS/3-8-midi.md) · 0.4k
- [3. Yêu cầu chức năng › 3.9 Binary theo schema](docs/split/PARSER-SRS/3-9-binary-theo-schema.md) · 0.7k
- [3. Yêu cầu chức năng › 3.10 So sánh kiểm chứng (KPI-01)](docs/split/PARSER-SRS/3-10-so-sanh-kiem-chung-kpi-01.md) · 0.3k
- [4. Mã lỗi](docs/split/PARSER-SRS/4-ma-loi.md) · 1.0k
- [5. Yêu cầu phi chức năng](docs/split/PARSER-SRS/5-yeu-cau-phi-chuc-nang.md) · 0.3k
- [6. Câu hỏi mở / cần dữ liệu](docs/split/PARSER-SRS/6-cau-hoi-mo-can-du-lieu.md) · 0.5k
- [7. Lệch so với SRS gốc v0.2](docs/split/PARSER-SRS/7-lech-so-voi-srs-goc-v0-2.md) · 0.4k

### PARSER-SDD.md — SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer

Nguồn: `docs/parser/PARSER-SDD.md` · [thứ tự đọc](docs/split/PARSER-SDD/_index.md)

- [SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer (mở đầu)](docs/split/PARSER-SDD/sdd-thiet-ke-phan-mem-thu-vien-parser-daw-visual.md) · 0.2k
- [1. Kiến trúc tổng thể](docs/split/PARSER-SDD/1-kien-truc-tong-the.md) · 1.1k
- [2. Package `core`](docs/split/PARSER-SDD/2-package-core.md) · 4.3k
- [3. Package `midi` (REQ-MIDI-*)](docs/split/PARSER-SDD/3-package-midi-req-midi.md) · 0.4k
- [4. Package `als` (REQ-ALS-*, REQ-ALP-*)](docs/split/PARSER-SDD/4-package-als-req-als-req-alp.md) · 2.0k
- [5. Package `rpp` (REQ-RPP-*)](docs/split/PARSER-SDD/5-package-rpp-req-rpp.md) · 1.2k
- [6. Package `dawproject` (REQ-DAWP-*)](docs/split/PARSER-SDD/6-package-dawproject-req-dawp.md) · 0.4k
- [7. Package `binary` (REQ-BIN-*)](docs/split/PARSER-SDD/7-package-binary-req-bin.md) · 0.9k
- [8. Package `parser` (bao ngoài)](docs/split/PARSER-SDD/8-package-parser-bao-ngoai.md) · 0.6k
- [8b. Package `i18n` (`@dawviz/i18n`)](docs/split/PARSER-SDD/8b-package-i18n-dawviz-i18n.md) · 1.1k
- [9. Bundle, CLI, demo](docs/split/PARSER-SDD/9-bundle-cli-demo.md) · 0.7k
- [10. Quyết định thiết kế và đánh đổi](docs/split/PARSER-SDD/10-quyet-dinh-thiet-ke-va-danh-doi.md) · 1.7k
- [11. Mở rộng](docs/split/PARSER-SDD/11-mo-rong.md) · 0.5k

### PARSER-TDD.md — TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer

Nguồn: `docs/parser/PARSER-TDD.md` · [thứ tự đọc](docs/split/PARSER-TDD/_index.md)

- [TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer (mở đầu)](docs/split/PARSER-TDD/tdd-tai-lieu-kiem-thu-thu-vien-parser-daw-visual.md) · 0.2k
- [1. Chiến lược](docs/split/PARSER-TDD/1-chien-luoc.md) · 0.8k
- [2. Công cụ dùng chung (`test/helpers.mjs`)](docs/split/PARSER-TDD/2-cong-cu-dung-chung-test-helpers-mjs.md) · 0.5k
- [3. Danh mục test (66 test, 7 file)](docs/split/PARSER-TDD/3-danh-muc-test-66-test-7-file.md) · 5.7k
- [4. Ma trận truy vết (rút gọn)](docs/split/PARSER-TDD/4-ma-tran-truy-vet-rut-gon.md) · 0.5k
- [5. Khoảng trống kiểm thử (cần dữ liệu thật, xem SRS §6)](docs/split/PARSER-TDD/5-khoang-trong-kiem-thu-can-du-lieu-that-xem-srs.md) · 1.0k
- [6. Kiểm thử thủ công trình duyệt](docs/split/PARSER-TDD/6-kiem-thu-thu-cong-trinh-duyet.md) · 0.4k
- [7. Quy ước viết test mới](docs/split/PARSER-TDD/7-quy-uoc-viet-test-moi.md) · 0.4k
- [8. Tiêu chí chấp nhận](docs/split/PARSER-TDD/8-tieu-chi-chap-nhan.md) · 0.2k

### I18N.md — Đa ngôn ngữ (i18n) và đóng góp bản dịch / Localization & translation guide

Nguồn: `docs/I18N.md` · [thứ tự đọc](docs/split/I18N/_index.md)

- [Đa ngôn ngữ (i18n) và đóng góp bản dịch / Localization & translation guide (mở đầu)](docs/split/I18N/da-ngon-ngu-i18n-va-dong-gop-ban-dich-localizati.md) · 0.6k
- [1. Thêm một ngôn ngữ mới (How to add a language)](docs/split/I18N/1-them-mot-ngon-ngu-moi-how-to-add-a-language.md) · 0.9k
- [2. Cú pháp chuỗi (Message syntax)](docs/split/I18N/2-cu-phap-chuoi-message-syntax.md) · 0.8k
- [3. Nhóm khoá (Key groups)](docs/split/I18N/3-nhom-khoa-key-groups.md) · 0.8k
- [4. Quy ước cho nhà phát triển (Developer rules)](docs/split/I18N/4-quy-uoc-cho-nha-phat-trien-developer-rules.md) · 1.0k
- [5. Ngoài chuỗi giao diện (Beyond UI strings)](docs/split/I18N/5-ngoai-chuoi-giao-dien-beyond-ui-strings.md) · 0.7k

### PUBLISHING.md — Xuất bản lần đầu lên GitHub

Nguồn: `docs/PUBLISHING.md` · [thứ tự đọc](docs/split/PUBLISHING/_index.md)

- [Xuất bản lần đầu lên GitHub (mở đầu)](docs/split/PUBLISHING/xuat-ban-lan-dau-len-github-mo-dau.md) · 0.2k
- [1. Giấy phép đã chọn và lý do](docs/split/PUBLISHING/1-giay-phep-da-chon-va-ly-do.md) · 1.8k
- [2. Build và kiểm tra trên máy bạn](docs/split/PUBLISHING/2-build-va-kiem-tra-tren-may-ban.md) · 1.0k
- [3. Tạo repo trên GitHub](docs/split/PUBLISHING/3-tao-repo-tren-github.md) · 0.4k
- [4. Commit đầu tiên](docs/split/PUBLISHING/4-commit-dau-tien.md) · 0.9k
- [5. Sau khi push](docs/split/PUBLISHING/5-sau-khi-push.md) · 0.9k
- [6. Lỗi thường gặp khi build lần đầu](docs/split/PUBLISHING/6-loi-thuong-gap-khi-build-lan-dau.md) · 2.1k
- [7. Dọn lịch sử: xoá tệp mẫu bên thứ ba khỏi mọi commit](docs/split/PUBLISHING/7-don-lich-su-xoa-tep-mau-ben-thu-ba-khoi-moi-co.md) · 5.0k

### COMMUNITY-CONTENT.md — Tài nguyên (assets) và bộ kiểu (presets) do cộng đồng đóng góp

Nguồn: `docs/COMMUNITY-CONTENT.md` · [thứ tự đọc](docs/split/COMMUNITY-CONTENT/_index.md)

- [Tài nguyên (assets) và bộ kiểu (presets) do cộng đồng đóng góp (mở đầu)](docs/split/COMMUNITY-CONTENT/tai-nguyen-assets-va-bo-kieu-presets-do-cong-don.md) · 0.2k
- [1. Hiện trạng và mục tiêu](docs/split/COMMUNITY-CONTENT/1-hien-trang-va-muc-tieu.md) · 0.4k
- [2. Cấu trúc](docs/split/COMMUNITY-CONTENT/2-cau-truc.md) · 0.4k
- [3. Định dạng preset kiểu nốt](docs/split/COMMUNITY-CONTENT/3-dinh-dang-preset-kieu-not.md) · 0.6k
- [4. Quy tắc cho assets](docs/split/COMMUNITY-CONTENT/4-quy-tac-cho-assets.md) · 0.5k
- [5. Cách đóng góp](docs/split/COMMUNITY-CONTENT/5-cach-dong-gop.md) · 0.4k
- [6. Kế hoạch tách repo (T-16)](docs/split/COMMUNITY-CONTENT/6-ke-hoach-tach-repo-t-16.md) · 0.8k

### SPIKE-1-EXPORT.md — Spike 1: Đường ống xuất video (Export Pipeline)

Nguồn: `docs/spikes/SPIKE-1-EXPORT.md` · [thứ tự đọc](docs/split/SPIKE-1-EXPORT/_index.md)

- [Spike 1: Đường ống xuất video (Export Pipeline) (mở đầu)](docs/split/SPIKE-1-EXPORT/spike-1-duong-ong-xuat-video-export-pipeline-mo.md) · 0.3k
- [1. Môi trường và kết quả chung](docs/split/SPIKE-1-EXPORT/1-moi-truong-va-ket-qua-chung.md) · 0.7k
- [2. Vấn đề phát sinh và đề xuất](docs/split/SPIKE-1-EXPORT/2-van-de-phat-sinh-va-de-xuat.md) · 1.0k
- [3. Đồng bộ A/V (KPI-02, AT-03)](docs/split/SPIKE-1-EXPORT/3-dong-bo-a-v-kpi-02-at-03.md) · 0.5k
- [4. Container và fast-start (SOI-10)](docs/split/SPIKE-1-EXPORT/4-container-va-fast-start-soi-10.md) · 0.3k
- [5. Đối chiếu với tài liệu v1.1](docs/split/SPIKE-1-EXPORT/5-doi-chieu-voi-tai-lieu-v1-1.md) · 1.2k

### SPIKE-2-PARSER.md — Spike 2: Parser và Unified AST

Nguồn: `docs/spikes/SPIKE-2-PARSER.md` · [thứ tự đọc](docs/split/SPIKE-2-PARSER/_index.md)

- [Spike 2: Parser và Unified AST (mở đầu)](docs/split/SPIKE-2-PARSER/spike-2-parser-va-unified-ast-mo-dau.md) · 0.3k
- [1. Tổng quan](docs/split/SPIKE-2-PARSER/1-tong-quan.md) · 0.6k
- [2. Hạn chế ghi nhận lúc đó](docs/split/SPIKE-2-PARSER/2-han-che-ghi-nhan-luc-do.md) · 0.5k
- [3. Bài học và đề xuất](docs/split/SPIKE-2-PARSER/3-bai-hoc-va-de-xuat.md) · 0.3k
- [4. Kế hoạch hành động lúc đó](docs/split/SPIKE-2-PARSER/4-ke-hoach-hanh-dong-luc-do.md) · 0.3k
- [5. Trạng thái hiện tại (tài liệu v1.1)](docs/split/SPIKE-2-PARSER/5-trang-thai-hien-tai-tai-lieu-v1-1.md) · 1.1k

<!-- sync:end docs-index -->
