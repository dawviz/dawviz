# Spike 4: bản nhạc (mã thử)

Mã đo của [docs/spikes/SPIKE-4-NOTATION.md](../../docs/spikes/SPIKE-4-NOTATION.md). Không thuộc workspace của monorepo; cài riêng:

```bash
cd spikes/notation && npm install          # vexflow 5.6.0, playwright-core (dùng trình duyệt trong ~/.cache/ms-playwright)
node s1-engrave-node.mjs && node s1-compare.mjs chromium   # S1: VexFlow ngoài DOM, so ảnh
node s2-grid-stats.mjs <tệp…>; node s2-quantize.mjs <tệp…> [--maxDivision=8|16|32 --triplets=0 --simplicity=3]   # S2
node s5-engrave.mjs <tệp…> [--font=Petaluma "--text=Petaluma Script"]; node shot.mjs <tên> <trang> [tỉ lệ] ["&rough=3&step=1"]   # S5, S4
node s3-perf.mjs <tên layout> chromium|firefox [số khung]   # S3
node make-short-mid.mjs && EXPORT=1 node e2e-app.mjs out/short.mid   # ứng dụng thật: thêm widget, phát, xuất MP4
BROWSER=firefox AURA=STEADY TAG=-ff EXPORT=1 node e2e-app.mjs out/short.mid   # đo xuất khi bật Sáng cả bản nhạc (T-96)
```

`out/` (kết quả) và `../test/` (dữ liệu MAESTRO, CC BY-NC-SA 4.0) không được commit. Thư viện của spike (`lib/engrave.ts`…) là bản thử; bản dùng trong ứng dụng ở `apps/web/src/lib/notation/` và `packages/render-core/src/notation/`.
