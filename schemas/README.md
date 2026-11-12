# Schema nhị phân (`schemaVersion: 1`)

Parser nhị phân (`@dawviz/parser-binary`) không chứa mã riêng cho từng DAW. Một file JSON mô tả (1) cách đọc byte và (2) cách ánh xạ sang AST. Dùng cho `.bwproject` hoặc bất kỳ định dạng nhị phân nào khi đã biết cấu trúc. Ví dụ chạy được: `demo-dbin.schema.json`.

Dùng: `parseProject('x.dbin', buf, { schemas: [schemaJson] })` — schema được chọn theo `extensions` + `magic`.

## Khung

```json
{ "schemaVersion": 1, "id": "...", "name": "...", "version": 1,
  "extensions": ["bwproject"], "magic": {"ascii":"BTWG","offset":0} ,
  "endian": "big|little",
  "root":  { "fields": [ ... ] },
  "types": { "TenKieu": { "endian": "little", "fields": [ ... ] } },
  "ast":   { ... } }
```

## Trường (`fields[]`)

| Khóa | Ý nghĩa |
|---|---|
| `name` | tên biến (`[A-Za-z_][A-Za-z0-9_]*`); `skip` và `assert` có thể bỏ tên |
| `type` | `u8 i8 u16 i16 u32 i32 u64 i64 f32 f64` (u64/i64 vượt 2^53 là lỗi), `vlq`, `leb128`, `ascii latin1 utf8 utf16le utf16be` (cần `length`), `cstring`, `bytes`, `skip`, `computed` (cần `expr`), `struct` (cần `fields`), `array`, `switch`, hoặc tên một kiểu trong `types` |
| `length` | số byte của chuỗi/bytes/skip; với kiểu phức hợp thì giới hạn **vùng** đọc (không đọc lố, con trỏ nhảy tới cuối vùng) |
| `endian` | ghi đè big/little cho trường này |
| `when` | chỉ đọc nếu biểu thức đúng |
| `offset`, `peek` | nhảy tới offset tuyệt đối; `peek:true` quay lại vị trí cũ sau khi đọc |
| `align` | căn con trỏ lên bội số N sau khi đọc |
| `array` | `of` (kiểu phần tử) + một trong `count` / `size` (số byte) / `until` (`"end"` hoặc biểu thức, `$item` là phần tử vừa đọc) |
| `switch` | `on` (biểu thức), `cases` {giá trị: kiểu}, `default` |
| `{ "assert": "expr", "message": "..." }` | dừng với lỗi nếu sai (kiểm version, v.v.) |

Trong biểu thức dùng được: biến đã đọc (từ trong ra ngoài), `parent`, `root`, `$index`, `$pos`, `$remaining`, `.` và `[]`, toán tử số học/bit/so sánh/logic/`?:`, hàm `min max floor ceil round abs len beatsToTicks clamp`. **Không** có eval/Function; tên `__proto__ constructor prototype` bị cấm; có giới hạn số phép tính, số nút, độ sâu.

## Ánh xạ AST (`ast`)

```json
"ast": {
  "title": "title", "ppq": "ppq", "timeUnit": "ticks | beats",
  "tempo":  { "each": "tempos", "as": "t", "tick": "t.tick", "bpm": "t.bpm", "num": "...", "den": "..." },
  "tracks": { "each": "tracks", "as": "tr", "filter": "...", "name": "tr.name", "muted": "(tr.flags & 1) == 1",
    "notes": { "each": "tr.notes", "as": "n", "pitch": "n.pitch", "startTick": "n.start",
               "durationTick": "n.dur", "endTick": "...", "velocity": "n.vel", "channel": "..." } }
}
```

- `timeUnit: ticks` → chia cho `ppq` rồi đổi sang 960; `beats` → nhân 960.
- `tempo` có thể là mảng nhiều luật. Không có tempo trong file → `tempoSource: "fallback"` + cảnh báo `WARN_TEMPO_FALLBACK`; truyền `options.tempoOverride` để thay.
- `velocity` mặc định 100 nếu không khai báo.

## Quy trình viết schema cho `.bwproject` (khi đã có file mẫu)
1. Dùng `readBinary(buf, schemaTamThoi)` để chỉ đọc phần đầu (header, bảng chunk) và in `root`.
2. Mở rộng dần `fields`; mỗi bước kiểm `bytesRead`.
3. Khi đã thấy mảng nốt/tempo, thêm mục `ast`, rồi so với `.dawproject` xuất từ cùng dự án bằng `compareAST`.
