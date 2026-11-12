---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "8b. Package `i18n` (`@dawviz/i18n`)"
path: "8b. Package `i18n` (`@dawviz/i18n`)"
chunk: 8b-package-i18n-dawviz-i18n.md
source_lines: 99-102
source_sha1: dbb03a72c8
ids: []
---
## 8b. Package `i18n` (`@dawviz/i18n`)
Một file `src/index.js`, không phụ thuộc, không nằm trong bundle parser (parser/Worker không cần dịch). `createI18n({locale, fallback, catalogs, onMissing})` trả `{t, has, number, duration, setLocale, locale, dir}`. Danh mục là JSON phẳng `{ "khoá.chấm": "chuỗi" }` + `@meta`. `parseMessage` tách chuỗi thành mảnh chữ / `{arg}` / `{arg, plural, nhánh…}` (có lồng, kiểm ngoặc, bắt buộc `other`); kết quả được cache theo (locale, khoá). `t` tra `localeChain(locale)` rồi `localeChain(fallback)` (`vi-VN → vi → en`), thiếu thì gọi `onMissing` và trả chính khoá; số nhiều dùng `Intl.PluralRules`, `#` = số định dạng theo locale. `matchLocale(navigator.languages, codes)` chọn ngôn ngữ; `dirOf` trả `rtl` cho `ar he fa ur ps sd ug yi dv`; `loadLocales(baseUrl)` fetch `index.json` + từng `<mã>.json`.
`scripts/check-i18n.mjs` là bộ kiểm cho cộng tác viên/CI (xem `docs/I18N.md`); `--dir` cho phép test trên thư mục tạm. Lý do tách danh mục khỏi mã: thêm ngôn ngữ chỉ là thêm file JSON, và có thể kiểm tự động mà không cần chạy giao diện.
