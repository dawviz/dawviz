---
doc: PUBLISHING.md
doc_title: "Xuất bản lần đầu lên GitHub"
section: "7. Dọn lịch sử: xoá tệp mẫu bên thứ ba khỏi mọi commit"
path: "7. Dọn lịch sử: xoá tệp mẫu bên thứ ba khỏi mọi commit"
chunk: 7-don-lich-su-xoa-tep-mau-ben-thu-ba-khoi-moi-co.md
source_lines: 93-190
source_sha1: 02fa1bd49a
ids: [D-41]
---
## 7. Dọn lịch sử: xoá tệp mẫu bên thứ ba khỏi mọi commit

Dùng khi tệp bên thứ ba (danh sách `THIRD_PARTY` trong `test/helpers.mjs`: `Demo.als`, `Oboe_MIDI_001.mid`, 5 tệp `.RPP`/`.rpp` mẫu của Cockos, `bitwig-5.0-example.project.xml`, `reaper-doc-sample.txt`) **đã từng bị commit**. Chỉ chuyển chúng vào `third-party/` thì chúng vẫn còn trong các commit cũ, ai clone cũng lấy lại được. Phải **viết lại lịch sử** rồi đẩy đè.

> Viết lại lịch sử đổi mã (SHA) của mọi commit từ chỗ tệp xuất hiện. Ai đã clone phải clone lại; PR đang mở sẽ hỏng. Làm khi repo còn ít người dùng.

### 7.1 Chọn cách

| Tình huống | Cách nên dùng |
|---|---|
| Sắp chuyển sang tổ chức GitHub riêng (BRD D-41), repo cũ chưa có fork hay PR quan trọng | **Cách A:** dọn lịch sử trên máy, đẩy lên **repo mới** trong tổ chức, rồi xoá hoặc lưu trữ (archive) repo cũ. Sạch nhất, vì repo mới không có bản sao cũ nào trên GitHub. |
| Phải giữ nguyên repo hiện tại (đã có sao, issue, liên kết) | **Cách B:** dọn lịch sử rồi `push --force` vào chính repo đó, sau đó nhờ GitHub Support xoá phần còn lưu đệm (mục 7.5). |
| Repo chưa từng công khai và không cần giữ lịch sử | **Cách C:** xoá repo, tạo lại, đẩy một commit đầu tiên từ bản sạch theo mục 4. |

### 7.2 Chuẩn bị

```bash
pip install git-filter-repo                      # công cụ được GitHub khuyên dùng; cần Python ≥ 3.6
git clone --mirror https://github.com/<tên>/<repo>.git dawviz-backup.git   # bản sao lưu ĐẦY ĐỦ, chỉ để trên máy, KHÔNG đẩy đi đâu
git clone https://github.com/<tên>/<repo>.git dawviz-clean                  # filter-repo yêu cầu một bản clone mới
cd dawviz-clean
```

### 7.3 Tìm mọi đường dẫn từng có trong lịch sử

```bash
git log --all --format= --name-only | sort -u \
  | grep -iE '\.(als|alp|rpp|mid|midi|dawproject)$|project\.xml$|reaper-doc-sample'
```

Soát kết quả: **giữ** `BigProject*.rpp` (do chủ repo tự tạo); mọi tệp còn lại trong danh sách bên thứ ba phải xoá, **ở bất kỳ thư mục nào** chúng từng nằm.

### 7.4 Xoá khỏi lịch sử và kiểm tra

```bash
git filter-repo --invert-paths \
  --path-glob '*Demo.als' \
  --path-glob '*Oboe_MIDI_001.mid' \
  --path-glob '*ode_to_zb.RPP' \
  --path-glob '*prutypils.rpp' \
  --path-glob '*siderite_oneD-8.RPP' \
  --path-glob '*tmf-small.RPP' \
  --path-glob '*youdreamarked-midi.RPP' \
  --path-glob '*bitwig-5.0-example.project.xml' \
  --path-glob '*reaper-doc-sample.txt'

# Phải không in ra gì:
git log --all --format= --name-only | sort -u | grep -iE 'Demo\.als|Oboe_MIDI|ode_to_zb|prutypils|siderite|tmf-small|youdreamarked|bitwig-5\.0|reaper-doc-sample'
git count-objects -vH                            # dung lượng repo phải giảm (riêng Demo.als khoảng 4 MB)
```

`--path-glob '*Tên'` khớp cả khi tệp nằm ở gốc lẫn trong thư mục con. Nếu bước 7.3 thấy tệp khác cũng cần xoá, thêm một dòng `--path-glob` cho nó.

Sau đó đưa bản mã mới nhất vào (nếu chưa có trên GitHub): chép nội dung bản mới đè lên thư mục, **trừ** `.git/`; đặt các tệp bên thứ ba vào `test/fixtures/third-party/` để chạy đủ test trên máy (thư mục này bị gitignore). Rồi:

```bash
git add -A
git status --short | grep -i third-party        # phải không in ra gì
npm ci && npm test                               # 66/66 nếu có đủ tệp third-party trên máy
git commit -s -m "chore: move third-party fixtures out of the repo, CI and docs v1.1"
```

### 7.5 Đẩy lên GitHub

`filter-repo` gỡ remote `origin` để tránh đẩy nhầm, nên phải thêm lại.

**Cách A (repo mới trong tổ chức):**

```bash
git remote add origin https://github.com/<tổ-chức>/dawviz.git   # repo mới, tạo trống như mục 3
git push -u origin --all
git push origin --tags
```

Sau đó vào repo cũ → Settings → **Archive** (chỉ đọc) hoặc **Delete**. Xoá là sạch nhất; archive vẫn để lại tệp cũ trong lịch sử của repo cũ.

**Cách B (giữ repo cũ):**

```bash
git remote add origin https://github.com/<tên>/<repo>.git
git push origin --force --all                    # tạm tắt branch protection của main nếu có
git push origin --force --tags
```

Sau đó vẫn còn chỗ GitHub giữ bản cũ mà `push --force` không xoá được:

* **Commit cũ vẫn mở được bằng SHA** (trong một thời gian) và **tham chiếu của Pull Request** (`refs/pull/*`) vẫn trỏ vào commit cũ.
* **Fork** của người khác giữ bản sao riêng.

Nếu repo đã công khai, liên hệ **GitHub Support** (theo hướng dẫn "Removing sensitive data from a repository" trong GitHub Docs) để xoá lưu đệm và tham chiếu PR. Fork thì phải nhờ chủ fork xoá hoặc dọn.

### 7.6 Sau khi đẩy

* Mọi người (kể cả chính bạn trên máy khác) **xoá clone cũ và clone lại**. Đừng `git pull` hay `push` từ clone cũ, vì làm vậy sẽ đưa lịch sử cũ quay lại.
* Kiểm trên GitHub: tìm `Demo.als` trong ô tìm kiếm mã của repo; mở tab Actions xem CI xanh, gồm bước "Không commit tệp mẫu bên thứ ba".
* Giữ `dawviz-backup.git` ở nơi riêng tư (nó vẫn chứa tệp bên thứ ba); xoá khi chắc chắn không cần.
* Từ giờ, CI tự chặn nếu tệp bên thứ ba bị đặt lại vào `test/fixtures/` (`.github/workflows/ci.yml`).
