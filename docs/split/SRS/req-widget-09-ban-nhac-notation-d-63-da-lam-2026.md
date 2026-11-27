---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-09: Bản nhạc (Notation) (D-63; đã làm 2026-11-21, T-90…T-95)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-09: Bản nhạc (Notation) (D-63; đã làm 2026-11-21, T-90…T-95)"
chunk: req-widget-09-ban-nhac-notation-d-63-da-lam-2026.md
source_lines: 674-685
source_sha1: 73016ec8ed
ids: [D-63, OI-20, REQ-GRAPHICS-05, REQ-WIDGET-09]
---
#### REQ-WIDGET-09: Bản nhạc (Notation) (D-63; đã làm 2026-11-21, T-90…T-95)
* Bản nhạc khuông đôi (khoá Sol, khoá Fa) dựng từ nốt của các track được gán (bỏ track mà mọi nốt ở kênh 10), kèm khoá, hoá biểu, dấu nhịp (đổi nhịp giữa bài có ký hiệu mới), `♩=` lấy BPM đầu bài (tuỳ chọn), số ô nhịp đầu hàng (tuỳ chọn). Dựng bằng VexFlow ở Worker của ứng dụng, **ngoài** Render Core; Render Core chỉ nhận `NotationLayout` (dữ liệu thuần: trang → phần tử đường/glyph gắn chủ là nốt; chủ → giây thật và track; hàng → mốc thời gian → x đơn điệu; bảng đường viền glyph) trong `Derived.notation` theo id widget.
* **Trạng thái từng nốt** theo `t`: *sắp tới* (màu mực, độ đục riêng), *đang ngân* (từ giây bắt đầu thật tới giây kết thúc thật; màu riêng hoặc màu track; vẽ sau cùng), *đã qua* (màu và độ đục riêng). Phần tĩnh (khuông, khoá, móc nối, dấu nối, ngoặc liên ba) dùng màu mực. Đầu nốt, cờ, dấu hoá, chấm, thân (khi không có móc nối) của một hợp âm là một nhóm.
* **Phóng to** quanh tâm hợp âm: *Nảy* (to lên rồi về trong thời gian chỉnh được) hoặc *Giữ khi ngân*; đoạn nối tiếp sau dấu nối không nảy. **Quầng sáng**: *Quầng* (viền dày mờ, mặc định) hoặc *Mềm* (`shadowBlur`, chậm hơn trên Firefox), cường độ và độ rộng chỉnh được.
* **Sáng cả bản nhạc** (T-96, 2026-11-21): quầng sáng phủ mọi nét của trang (dòng kẻ, khoá, nốt), *Tắt* / *Luôn sáng* / *Nhấp theo phách* / *Nhấp theo ô nhịp* / *Nhấp theo giây*; lặp mỗi N phách, ô hoặc giây (0,25–64); kiểu nhấp *Thở* (sáng nhất đầu chu kỳ, lên xuống êm), *Loé* (sáng ngay rồi tắt dần), *Bật tắt* (nửa đầu sáng, nửa sau tắt); độ sáng, mức thấp nhất, màu (trống = theo màu từng nét; nền khung sáng thì mặc định màu nốt đang phát). Luôn vẽ kiểu Quầng; lúc tắt hẳn không tốn thêm thời gian vẽ. Phách và ô theo tempo map và dấu nhịp của bài. Hiệu ứng tổng quát "Glow / Bloom pulse" cho mọi lớp vẫn thuộc thư viện hiệu ứng (T-34, ANIMATION-CATALOG).
* **Độ đục** (T-96): *độ đục cả bản nhạc* nhân cho mọi phần tử, quầng sáng và vạch phát (0 = không vẽ); *độ đục khuông và ký hiệu tĩnh* chỉ cho nét tĩnh; cùng *độ đục nốt sắp tới / đã qua* có sẵn.
* **Cỡ số ô nhịp** (T-96): 0,5–4 lần cỡ mặc định của VexFlow; ảnh hưởng bản dựng (dựng lại khi đổi).
* **Vạch phát** tuỳ chọn (không / vạch, màu, độ dày) trong hàng đang phát. **Trang**: số ô mỗi hàng (0 = tự dàn theo bề rộng), số hàng mỗi trang; sang trang khi tới giây bắt đầu trang, trang mới hiện dần (ms chỉnh được). Trang đặt vừa khung widget theo bề rộng và chiều cao trang lớn nhất (tỉ lệ không đổi khi lật trang), căn trên hoặc giữa.
* **Phông nhạc**: *In* (Bravura + Academico), *Viết tay* (Petaluma + Petaluma Script), *Cổ điển* (Gonville); glyph thiếu ở phông chính lấy từ Bravura. Glyph vẽ bằng đường viền từ bảng sinh sẵn, **không** nạp `FontFace` (FIREFOX-FONT-SLOWDOWN). Màu mực khi thêm widget chọn theo nền khung (nền sáng → mực tối).
* **Tất định:** kết quả chỉ phụ thuộc `(scene, derived, ast, t, scale)` (REQ-GRAPHICS-05); Preview và Export dùng cùng `NotationLayout` (truyền qua `ExportJob.notation`). Dựng lại chỉ khi đổi dự án, tempo, tập track hoặc thuộc tính ảnh hưởng bản dựng (`NOTATION_ENGRAVE_KEYS`); bộ đệm theo khoá. Khi còn widget đang dựng, hộp thoại Xuất video khoá nút xuất và báo lý do.
* **Chưa làm** (OI-20): ký hiệu hợp âm phía trên khuông, tên nốt trong đầu nốt, dấu động theo velocity, 8va, cuộn ngang, chuyển trang kiểu nét bút, phông SMuFL do người dùng nạp.
