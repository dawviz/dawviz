# Bản nhạc

Widget **Bản nhạc** viết các nốt của dự án thành bản nhạc khuông đôi (khoá Sol và khoá Fa), như bản nhạc in. Khi bài phát, nốt đang vang sáng lên và phóng to, nốt đã qua đổi màu. Video xuất ra giống hệt những gì bạn thấy ở Xem trước.

## Thêm bản nhạc

1. Mở thẻ **Chỉnh sửa**, bấm **Thêm** ở góc trên bên trái Timeline, chọn **Bản nhạc**.
2. Ứng dụng viết bản nhạc từ nốt của các track. Việc này mất từ dưới một giây đến vài giây tuỳ độ dài bài; trong lúc đó mục **Thiết lập** hiện "Đang viết bản nhạc…".
3. Viết xong, mục **Thiết lập** cho biết số trang, số ô nhịp và giọng của bài (ví dụ "64 trang, 128 ô nhịp, giọng La thứ"). Nếu có điều cần chú ý, dòng chữ vàng bên dưới sẽ nói rõ.

Màu mực được chọn theo nền khung: nền sáng thì mực tối, nền tối thì mực sáng.

## Chọn track

Ở **Track**, để **Mọi track đang hiện** hoặc bấm **Chọn track** rồi chỉ giữ track giai điệu và hợp âm. Track trống (kênh 10) luôn được bỏ qua. Bài có nhiều nhạc cụ thì chọn ít track sẽ cho bản nhạc dễ đọc hơn, vì mọi nốt đều được dồn vào hai khuông như bản piano.

## Thiết lập hay dùng

- **Kiểu chữ nhạc**: **In** (như bản nhạc in), **Viết tay** (nét bút, chữ viết tay) hoặc **Cổ điển** (nét mảnh).
- **Số ô mỗi hàng**: số ô nhịp trên một hàng; 0 là tự xếp theo bề rộng. **Số hàng mỗi trang**: hết trang thì sang trang mới.
- **Màu mực**, **Màu nốt đang phát**. Chọn **Màu của track** để nốt đang phát lấy màu của track.
- **Cỡ nốt đang phát**: 1 là không phóng to; 1,35 là to hơn một phần ba.
- **Keyframe cho màu và quầng sáng**: ở mục Hoạt hình của widget, chọn một thuộc tính hình vẽ của bản nhạc để đặt keyframe: các màu (mực, đã qua, đang phát, vạch phát, sáng cả bản nhạc), **Phát sáng**, độ rộng quầng, các độ đục, mức phóng to, kiểu sáng, thời gian viết và các số của nhóm Xoá nốt. Màu đang phát đổi theo keyframe thì quầng sáng của nốt đổi theo, nên quầng có thể nhiều màu theo thời gian. Thuộc tính dựng bản nhạc (phông, số ô mỗi hàng, lượng tử hoá…) không keyframe được vì đổi là phải dựng lại.
- **Phát sáng**: độ sáng của quầng quanh nốt đang phát; 0 là tắt.
- **Vạch phát**: **Không** (chỉ nốt sáng) hoặc **Vạch** chạy theo nhạc.
- **Độ đục cả bản nhạc**: làm mờ toàn bộ (nốt, khuông, quầng sáng, vạch phát); 1 là đục hoàn toàn. Dùng khi muốn bản nhạc làm nền cho widget khác.
- **Nét run tay**: làm dòng kẻ và ký hiệu lượn nhẹ như vẽ tay; 0 là tắt. Hợp với kiểu chữ **Viết tay**.
- **Sáng cả bản nhạc**: thêm quầng sáng quanh mọi nét của trang, không chỉ nốt đang phát.
  - **Luôn sáng**: sáng suốt bài.
  - **Nhấp theo phách**, **Nhấp theo ô nhịp**, **Nhấp theo giây**: sáng lên rồi tắt, lặp lại theo nhịp của bài hoặc theo giây.
  - **Cứ mỗi … sáng tắt một lần** (hiện cùng chế độ nhấp): số phách, ô nhịp hoặc giây cho một chu kỳ. Ví dụ Nhấp theo giây với 4 là cứ 4 giây sáng rồi tắt một lần; Nhấp theo phách với 0,5 là mỗi nửa phách.
  - **Kiểu nhấp**: **Thở** (sáng dần rồi tối dần), **Loé** (sáng ngay ở đầu phách rồi tắt dần), **Bật tắt** (nửa đầu sáng, nửa sau tắt).
- **Viết tay từng nốt**: ở tiêu đề nhóm, chọn **Cách nốt hiện**.
  - **Hiện sẵn**: mọi nốt của trang hiện ngay khi sang trang.
  - **Viết khi tới lượt**: mỗi nốt (đầu nốt, thân, cờ, dấu hoá, dấu lặng, gạch nối móc) chỉ hiện khi tới lượt, được viết dần từ trái sang phải trong **Thời gian viết một nốt**. Nốt bắt đầu được viết sớm hơn lúc vang nửa khoảng thời gian đó. Khuông, khoá, hoá biểu và vạch nhịp hiện sẵn. Dùng cùng **Nét run tay** và kiểu chữ **Viết tay** để trông như đang viết tay.
- **Xoá nốt**: ở tiêu đề nhóm, chọn khi nào nốt bị xoá.
  - **Không xoá**: nốt ở lại tới khi sang trang.
  - **Sau vài ô nhịp**: mọi nốt bị xoá sau **Xoá sau … ô nhịp** kể từ khi nốt hết vang; 0 là xoá ngay khi hết vang.
  - **Ngẫu nhiên một phần**: như trên nhưng chỉ xoá một phần số nốt theo **Tỉ lệ nốt bị xoá** (0,3 là khoảng ba phần mười). Nốt nào bị xoá là cố định: phát lại, tua hay xuất video đều giống nhau.
  - **Kiểu xoá**: **Mờ dần** hoặc **Lau đi** (nốt biến mất từ phải sang trái).

## Ở chế độ Nâng cao

- **Nốt ngắn nhất** (móc đơn, móc kép, móc ba), **Cho phép liên ba**, **Ưu tiên nhịp đơn giản**: quyết định cách làm tròn nhịp khi viết. Số **Ưu tiên nhịp đơn giản** lớn hơn thì ít nốt lẻ hơn.
- **Số bè mỗi khuông** (1 hoặc 2) và **Nốt thấp nhất lên khuông Sol** (số MIDI, 60 là nốt Đô giữa).
- **Giọng**: **Tự đoán** hoặc **Tự đặt**. Khi tự đặt, chọn **Hoá biểu** và bật **Giọng thứ** nếu cần.
- **Số ô nhịp**, **Cỡ số ô nhịp** (1 là mặc định, nhỏ; 2 là gấp đôi; chỉnh được từ 0,5 đến 4) và **Ghi tempo** ở đầu bài. Số ô nhịp hiện ở đầu mỗi hàng.
- Màu và độ đục của nốt đã phát, độ đục của nốt sắp tới, **Độ đục khuông và ký hiệu tĩnh** (dòng kẻ, khoá, số ô nhịp, dấu nối): giảm để khuông mờ mà nốt vẫn rõ.
- **Cách đổi cỡ**: **Nảy** (to lên rồi về cỡ cũ trong **Thời gian nảy**) hoặc **Giữ khi ngân** (to suốt lúc nốt còn vang).
- **Độ rộng quầng sáng**, **Kiểu sáng**: **Quầng** hoặc **Mềm (chậm hơn)**. Kiểu Mềm làm xuất video chậm hơn, nhất là trên Firefox.
- Màu và độ dày của vạch phát.
- **Thời gian xoá (ms)** của nhóm Xoá nốt, và **Hạt giống xoá ngẫu nhiên**: đổi số này để chọn một nhóm nốt khác bị xoá.
- **Số lần nét đổi mỗi giây**: 0 là nét run đứng yên; 8 đến 12 cho cảm giác hình vẽ tay đang "sống". **Hạt giống nét run**: đổi để có kiểu run khác.
- **Vị trí trong khung** (trên hoặc giữa) và **Mờ dần khi sang trang**.
- Với **Sáng cả bản nhạc**:
  - **Độ sáng cả bản nhạc** và **Mức sáng thấp nhất**. Mức thấp nhất lớn hơn 0 thì lúc tắt vẫn còn sáng nhẹ.
  - **Màu sáng cả bản nhạc**: bỏ chọn thì mỗi nét sáng theo màu của nó. Trên nền sáng, ứng dụng chọn sẵn màu nốt đang phát, vì quầng màu mực tối trông như nét bị nhoè.
  - Sáng cả bản nhạc làm xuất video chậm hơn: Luôn sáng chậm hơn khoảng một nửa; kiểu nhấp tốn ít hơn.

Các thiết lập ở phần đầu danh sách (kiểu chữ nhạc, số ô, cỡ số ô nhịp, nốt ngắn nhất, liên ba, giọng…) làm ứng dụng viết lại bản nhạc. Màu, cỡ, phát sáng, vạch phát, nét run, viết tay và xoá nốt đổi ngay.

## Khi bản nhạc trông sai

- **Nốt vẫn sáng đúng lúc nghe.** Ứng dụng làm tròn nhịp chỉ để viết cho dễ đọc. Thời điểm sáng lấy từ nốt thật, nên hình không bao giờ lệch tiếng.
- **"Chỉ …% nốt nằm đúng lưới phách"**: bài được chơi tự do, không theo nhịp đếm (ví dụ thu từ đàn mà không bật metronome). Bản nhạc sẽ sai nhịp. Hãy dựng tempo theo bài trong DAW (tempo map) rồi xuất lại tệp.
- **Nhịp rối, nhiều liên ba và dấu nối lạ**: bài được chơi lệch nhịp một chút. Ở Nâng cao, chọn **Nốt ngắn nhất** là móc đơn hoặc móc kép, tắt **Cho phép liên ba**, tăng **Ưu tiên nhịp đơn giản**.
- **"Không chắc giọng của bài"** hoặc hoá biểu trông sai: chọn **Giọng** → **Tự đặt** rồi chọn hoá biểu.
- Nốt rất cao hoặc rất thấp hiện nhiều dòng kẻ phụ; bản này chưa có ký hiệu 8va.

## Xuất video

Bản nhạc trong video giống hệt Xem trước. Nếu bản nhạc còn đang được viết, hộp thoại Xuất video báo "Bản nhạc vẫn đang được viết" và chờ xong mới cho bấm **Bắt đầu xuất**.
