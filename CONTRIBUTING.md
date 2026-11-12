# Đóng góp cho DAW Visualizer

Cảm ơn bạn đã quan tâm! Toàn bộ mã và tài liệu của dự án là **công khai**. Bạn có thể đóng góp theo nhiều cách, không nhất thiết phải viết mã.

| Bạn muốn… | Làm gì |
|---|---|
| Sửa lỗi chính tả, làm rõ tài liệu | Sửa tệp `.md` trong [`docs/`](docs/README.md) (nút "Chỉnh sửa trang này" trên trang web tài liệu mở đúng tệp), mở pull request |
| Dịch giao diện sang ngôn ngữ mới | Làm theo [docs/I18N.md](docs/I18N.md): thêm `locales/<mã>.json` và một dòng trong `locales/index.json`; chạy `npm run i18n:check` |
| Báo lỗi đọc tệp dự án | Mở issue kèm **định dạng, phiên bản DAW** và, nếu được phép công khai, một tệp mẫu nhỏ; mô tả kết quả mong đợi (ví dụ BPM, số nốt) |
| Cung cấp mẫu để kiểm chứng mục `[VERIFY]` | **Chương trình tệp mẫu** (BRD D-45): mở issue "Gửi tệp mẫu", ghi DAW và phiên bản, xác nhận bạn có quyền chia sẻ và có cho phép công khai hay không. Danh sách đang cần: OI-01, OI-05, OI-12, OI-14, SOI-18, SOI-19 trong [PROGRESS.md](PROGRESS.md) |
| Đóng góp preset, hiệu ứng, tài nguyên | Xem [docs/COMMUNITY-CONTENT.md](docs/COMMUNITY-CONTENT.md); được duyệt bởi kiểm duyệt viên cộng đồng ([docs/design/EXPRESSIONS.md](docs/design/EXPRESSIONS.md) §6.4) |
| Trở thành kiểm duyệt viên | Sau ít nhất 3 đóng góp được merge, nhờ một reviewer hoặc maintainer đề cử (BRD D-43) |
| Sửa/thêm tính năng | Đọc [AI_CONTEXT.md](AI_CONTEXT.md) → [ARCHITECTURE.md](ARCHITECTURE.md) → đúng mảnh tài liệu liên quan, rồi mở issue/PR |

## Thiết lập

```bash
npm install            # Node >= 22.18
npm test               # parser + Render Core + logic ứng dụng
npm run i18n:check
npm run docs:sync      # sinh lại SKELETON, mục lục, kiểm liên kết
npm run docs:site      # dựng trang web tài liệu vào dist-docs/
```

## Quy tắc cho pull request

1. **Mã và tài liệu đổi cùng nhau.** Đổi hành vi → cập nhật tài liệu gốc trong `docs/` (không sửa `docs/split/**`, `SKELETON.md` hay khối mục lục trong `AI_CONTEXT.md` bằng tay) → chạy `npm run docs:sync`. CI chạy `npm run docs:check` và sẽ báo nếu bạn quên hoặc có liên kết hỏng.
2. **Có test.** Hàm thuần: `node --test`; giao diện: Vitest. Nếu không chạy được, nói rõ trong PR.
3. **Không đoán điều chưa kiểm.** Giữ nhãn `[VERIFY]`/`[PROVISIONAL]` cho đến khi có dữ liệu thật; giới hạn đã chốt nằm ở [ARCHITECTURE.md](ARCHITECTURE.md) mục 6 và [PROGRESS.md](PROGRESS.md) mục 2.
4. **Mọi chuỗi giao diện qua i18n**; lỗi/cảnh báo của thư viện dịch theo mã.
5. **Không thêm phụ thuộc** vào `packages/*` (parser và i18n không phụ thuộc thư viện ngoài).
6. **Đừng đưa dữ liệu riêng tư vào repo**: khoá, đường dẫn máy cá nhân, tệp dự án nhạc không được phép công khai. Tệp mẫu chỉ thêm vào `test/fixtures` khi bạn có quyền công khai và ghi rõ nguồn trong PR.
7. Tài liệu viết tiếng Việt (có thể kèm bản tiếng Anh cho phần dành cho người đóng góp); mã, tên biến, mã lỗi bằng tiếng Anh.

## Giấy phép

Dự án dùng **Apache License 2.0** (tệp [LICENSE](LICENSE)) cho mã, tài liệu và bản dịch. Khi gửi pull request, bạn đồng ý đóng góp của mình được cấp phép theo cùng giấy phép (Điều 5 của Apache-2.0; không cần ký CLA).

**DCO (Developer Certificate of Origin, BRD D-42):** mọi commit phải có dòng `Signed-off-by: Tên <email>`, thêm tự động bằng `git commit -s`. Dòng này xác nhận bạn có quyền gửi đóng góp theo [DCO 1.1](https://developercertificate.org/). CI sẽ từ chối PR có commit thiếu dòng này (bước kiểm thêm ở task T-39). Preset và tài nguyên mang giấy phép SPDX riêng ghi trong tệp. Tệp mẫu trong `test/fixtures` có nguồn riêng, xem [test/fixtures/README.md](test/fixtures/README.md).
