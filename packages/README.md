# Thư viện parser và i18n (`packages/*`)

Monorepo các package ES module độc lập, không phụ thuộc bên ngoài (Node ≥ 18 và trình duyệt/Worker đều chạy). Đầu ra chung: `UnifiedProjectAST` (SRS REQ-AST-01), `internalPPQ = 960`, tick là nguồn sự thật.

| Package | Nội dung |
|---|---|
| `@dawviz/parser-core` | lỗi, giới hạn (zip bomb/XML depth), giải nén streaming, ZIP, XML scanner, bản đồ tempo, dựng + kiểm tra AST, `compareAST` |
| `@dawviz/parser-midi` | `.mid` (SMF 0/1/2) |
| `@dawviz/parser-als` | `.als` (**XML thuần hoặc Gzip**, nhận bằng magic bytes) và `.alp` (gói `pl-a` thật; nhận cả ZIP) |
| `@dawviz/parser-rpp` | Reaper `.rpp` (MIDI nhúng, take, loop, pooled, tempo envelope, MIDI ngoài) |
| `@dawviz/parser-dawproject` | `.dawproject` (Bitwig, Studio One, Cubase…) |
| `@dawviz/parser-binary` | parser nhị phân theo **JSON schema** (xem `schemas/README.md`) |
| `@dawviz/parser` | bao ngoài: `detectFormat`, `probeProject`, `parseProject(name, buffer, options)` |
| `@dawviz/i18n` | đa ngôn ngữ: danh mục JSON (`locales/`), `{tham_số}`, số nhiều, dự phòng, chọn locale; hướng dẫn đóng góp: `docs/I18N.md` |

`npm run bundle` (hoặc `node scripts/bundle.mjs`, từ gốc monorepo) → `dist/dawviz-parser.bundle.js` (một file ES module cho Worker). `npm run test:parser` → 66 test. `npm run i18n:check` kiểm danh mục ngôn ngữ. `node bin/dawparse.mjs <file> [--json] [--inventory] [--tempo BPM] [--files thư_mục] [--schema s.json] [--ref ref.mid]`. Demo trình duyệt: `apps/parser-lab/`. Tài liệu: `docs/parser/` (xem `docs/README.md`).

## API
```js
import { parseProject } from '@dawviz/parser';
const { ast, warnings, info, format } = await parseProject(file.name, await file.arrayBuffer(), {
  title, showMuted: false,
  tempoOverride: 128,               // số BPM, hoặc [{bpm, num?, den?, tick|beat|timeSeconds}] — thay tempo của file
                                    // người dùng gõ vị trí/dấu nhịp: resolveTempoRows([{pos:'5.1.00', bpm:90, sig:'12/8'}], {unit:'reaper'})
  limits: { maxFileBytes, maxUnzippedBytes, maxNotes, ... },
  schemas: [schemaJson],            // binary
  files: { 'kick.mid': Uint8Array } // hoặc resolveFile(path, base) — Reaper tham chiếu .mid ngoài
});
```
Lỗi là `DawParseError` với `code` theo SRS §8 (+ `ERR_SCHEMA_INVALID`, `ERR_NO_SUPPORTED_ENV`). Cảnh báo là `{code, message, details?}`.

**Không còn 120 BPM ngầm**: `ast.meta.tempoSource` ∈ `file | midi-default | fallback | user`. `fallback` luôn kèm `WARN_TEMPO_FALLBACK`; UI nên cho người dùng nhập BPM (`tempoOverride`).

## Đã kiểm chứng với file thật
- `Demo.als` (Live 12.4.16, Gzip): 11 track MIDI, 9605 nốt, 167 BPM, khớp **từng nốt** với một bộ đối chứng độc lập; XML thuần ≡ Gzip. Cũng đọc được file Gravitas (Live 9, XML thuần).
- Bitwig 5.0 `project.xml` mẫu chính thức: tempo 149, 9 nốt, vel 100.
- Reaper: 5 template (cấu trúc/tempo/envelope), 1 dự án tham chiếu **`.mid` ngoài** (`BigProject3` + `Oboe_MIDI_001.mid` → 3147 nốt) và 2 dự án thật có **MIDI nhúng** (`BigProjectDemo2`: 3147 nốt; `BigProjectDemo`: 107 item, nhiều take/loop/pooled/SOFFS → 7497 nốt, khớp oracle độc lập).
- `.alp` thật (Live 9.1, 65 MB): không phải ZIP mà là gói `pl-a` chứa 3 file `.als`; đọc trong ≈ 0,15 s.

## Trạng thái spike
- **Spike 1 (xuất video, WebCodecs):** hoàn thành; số đo và các điều chỉnh nằm trong BRD/SRS v0.3.
- **Spike 2 (parser và Unified AST):** hoàn thành: `.mid`, `.als`, `.alp` (`pl-a`), `.rpp`, `.dawproject` (mẫu chính thức), nhị phân theo schema; ghi đè tempo theo mốc kèm dấu nhịp; đa ngôn ngữ (en, vi).
- Phần còn lại là việc cần mẫu thật hoặc chưa làm (mục dưới), không chặn giai đoạn xây ứng dụng chính.

## Đa ngôn ngữ
Giao diện dịch qua `locales/*.json` (en là gốc, vi đầy đủ). Thêm ngôn ngữ = thêm một file JSON + một dòng `locales/index.json`, không sửa mã; xem `docs/I18N.md`. Thư viện parser trả mã lỗi/cảnh báo và giao diện dịch theo mã.

## Chưa kiểm chứng (đánh dấu [VERIFY])
1. `.rpp`: `IGNTEMPO 1` đã có dự án thật (BigProject4b: nhịp 12/8, nguồn chạy 180 BPM; kết quả khớp thước kẻ Reaper và mật độ nốt trong ảnh, chưa có đối chứng độc lập từng nốt); envelope track (âm lượng đã đối chiếu với số đọc trong Reaper; pan/mute lưu giá trị thô, chiều/nghĩa chưa kiểm; envelope trong item/trước FX chưa đọc, có cảnh báo); còn thiếu mẫu tempo envelope cong (`.mid` ngoài đã kiểm bằng mẫu thật; `HASDATA` chỉ nhận QN, PPQ đọc động — BigProject4 thật dùng 480 — đơn vị lạ bị bỏ qua có cảnh báo chứ không đoán).
2. `.dawproject` xuất thật từ Bitwig (tempo/nhịp automation, clip lồng nhau, đơn vị giây).
3. Clip Ableton có `StartRelative ≠ 0` hoặc đang lặp; tempo ramp thật; nhịp ≠ 4/4 (công thức enum suy từ 1 mẫu); cách đếm beat/bar của từng DAW trong nhịp ghép (6/8, 12/8) khi nhập mốc `Bar.Beat`.
4. KPI-01 (sai số ≤ 1 tick) cần cặp (dự án, MIDI xuất từ chính DAW đó); `compareAST` đã sẵn.
5. `.bwproject` và `.flp`: *chưa hỗ trợ* (chưa có file mẫu để viết schema) — dùng `.dawproject` / `.mid` trước.

## Lệch so với SRS gốc
Đã đưa vào `docs/parser/PARSER-SRS.md` §7 và `docs/product/SRS.md` (xem lịch sử phiên bản và Phụ lục B).
