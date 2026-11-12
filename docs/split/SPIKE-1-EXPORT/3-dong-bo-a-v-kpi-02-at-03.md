---
doc: SPIKE-1-EXPORT.md
doc_title: "Spike 1: Đường ống xuất video (Export Pipeline)"
section: "3. Đồng bộ A/V (KPI-02, AT-03)"
path: "3. Đồng bộ A/V (KPI-02, AT-03)"
chunk: 3-dong-bo-a-v-kpi-02-at-03.md
source_lines: 26-31
source_sha1: cbc774f4af
ids: [AT-03, D-12, KPI-02]
---
## 3. Đồng bộ A/V (KPI-02, AT-03)

* **Máy tính LOQ:** `first audio ts − first video ts = 0,00 ms`, đạt ngưỡng ±2 ms.
* **Điện thoại Snapdragon 685:** **−42,67 ms**, không đạt. Nguyên nhân dự đoán: phần cứng tầm trung chậm khi chạy đồng thời `VideoEncoder` và `AudioEncoder` trong Worker, nên độ trễ chờ mẫu âm thanh đầu (audio priming) lớn hơn nhiều so với PC.
* **Hướng xử lý:** ghi nhận giới hạn trên di động; tập trung tối ưu cho desktop theo phạm vi ban đầu (A-03, D-12).
