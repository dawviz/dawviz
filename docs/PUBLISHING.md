# Xuất bản lần đầu lên GitHub

> Hướng dẫn từng bước: chuẩn bị, build và kiểm tra trên máy bạn, tạo repo, **commit đầu tiên**, bật CI và trang tài liệu. Các lệnh chạy ở thư mục gốc repo (`dawviz/`). Cần Node ≥ 22.18, Python ≥ 3.8, Git.

## 1. Giấy phép đã chọn và lý do

Repo dùng **Apache License 2.0** cho mã, tài liệu và bản dịch (tệp `LICENSE` ở gốc). Đây là khuyến nghị kỹ thuật, không phải tư vấn pháp lý.

| Lý do chọn Apache-2.0 | Ghi chú |
|---|---|
| Cho phép dùng, sửa, nhúng vào sản phẩm thương mại; hợp với thư viện parser muốn được dùng rộng | Khác với GPL/AGPL buộc mã dẫn xuất phải mở |
| Có **điều khoản cấp quyền sáng chế** (và chấm dứt quyền nếu kiện về sáng chế) | Hợp với lĩnh vực định dạng tệp và codec video, nơi có rủi ro sáng chế; MIT không có điều này |
| **Điều 5**: đóng góp được hiểu là cấp phép theo cùng giấy phép, không cần ký CLA | Dễ cho cộng đồng dịch và đóng góp |
| Một giấy phép duy nhất cho cả mã, tài liệu, bản dịch | Tránh trộn nhiều giấy phép (ví dụ thêm CC BY cho tài liệu) |

Phương án khác: **MIT** (ngắn hơn, không có điều khoản sáng chế); **AGPL-3.0** nếu bạn muốn ngăn người khác lấy mã làm dịch vụ web đóng nguồn (đổi lại ít doanh nghiệp dám dùng thư viện parser); **MPL-2.0** là mức giữa (chỉ tệp sửa đổi phải mở). Khi đã có người đóng góp thì rất khó đổi giấy phép, nên chọn trước khi công khai.

Cần làm thêm:
- **Thư viện bên thứ ba:** kiểm tra giấy phép từng thư viện sẽ dùng (React, Framer Motion, Dexie, fflate, Mediabunny, @tonaljs/chord-detect, font đóng gói) tương thích với Apache-2.0 (OI-07). Phần lớn là MIT/Apache; riêng thư viện có giấy phép copyleft yếu (như MPL-2.0) vẫn dùng được nhưng cần giữ nguyên thông báo của họ.
- **Tệp mẫu `test/fixtures`:** chỉ `BigProject*.rpp` (do chủ repo tự tạo) được commit; tệp bên thứ ba nằm ở `test/fixtures/third-party/` (gitignore, test tự bỏ qua khi thiếu). Xem `test/fixtures/README.md` trước khi thêm tệp mẫu.
- Tên chủ sở hữu bản quyền: README ghi "DAW Visualizer contributors"; có thể thay bằng tên bạn/tổ chức.

## 2. Build và kiểm tra trên máy bạn

```bash
cd dawviz
npm install                 # tạo package-lock.json và liên kết các package trong monorepo
npm test                    # kỳ vọng: parser 66 (21 bị bỏ qua nếu thiếu test/fixtures/third-party/), render-core 12, logic web 9, docs-site 6
npm run i18n:check          # "danh mục ngôn ngữ hợp lệ"
npm run typecheck           # tsc cho apps/web (đã xanh từ 2026-11-12; nếu lỗi xem mục 6)
npm run build               # build Vite vào apps/web/dist
npm run test:components     # Vitest + Testing Library (4 test)
npm run docs:sync           # tách tài liệu, sinh SKELETON và mục lục; phải kết thúc "đạt"
npm run docs:site           # dựng trang tài liệu vào dist-docs/
npm run dev                 # chạy thử ứng dụng ở http://localhost:5173, thả file mẫu như test/fixtures/BigProject4b.rpp
```

`apps/web` đã build và qua test lần đầu ngày 2026-11-12. Nếu máy bạn báo lỗi, sửa **trước khi** commit để lịch sử sạch.

## 3. Tạo repo trên GitHub

1. Vào github.com → **New repository**. Đặt tên (ví dụ `dawviz`), chọn Public.
2. **Đừng tick** "Add a README", "Add .gitignore", "Choose a license" (repo đã có sẵn; tick sẽ làm hai lịch sử xung đột).
3. Bấm Create. Copy địa chỉ repo, dạng `https://github.com/<tên>/<repo>.git`.

Hoặc dùng GitHub CLI: `gh repo create <repo> --public --source=. --remote=origin` (sau bước 4 bên dưới).

## 4. Commit đầu tiên

```bash
git init -b main
git config user.name  "Tên của bạn"
git config user.email "<id>+<username>@users.noreply.github.com"   # email ẩn của GitHub, tránh lộ email thật (Settings → Emails)

git add -A
git status --short | head -60          # SOÁT LẠI: không có node_modules/, dist/, dist-docs/, .env
git diff --cached --stat | tail -3     # tổng số tệp/dòng; mong đợi vài trăm tệp
git commit -m "chore: initial import — parser, render-core, web app, docs"

git remote add origin https://github.com/<tên>/<repo>.git
git push -u origin main
```

Nếu bạn muốn lịch sử gọn theo phần (tùy chọn): commit riêng lần lượt `LICENSE` + cấu hình gốc, `packages/`, `apps/web`, `docs/` + tài liệu gốc + `scripts/`. Một commit "initial import" cũng hoàn toàn bình thường.

Không dùng `git add -f` để ép thêm tệp bị `.gitignore` loại. Nếu `git push` hỏi mật khẩu: dùng Personal Access Token hoặc `gh auth login`.

## 5. Sau khi push

1. **Lockfile:** `package-lock.json` sinh ra ở bước 2 đã được commit. Sửa `.github/workflows/ci.yml`: đổi `npm install` thành `npm ci` và thêm `cache: npm` cho `actions/setup-node`.
2. **Bật trang tài liệu:** Settings → Pages → Source = **GitHub Actions**. Workflow `docs.yml` chạy khi `docs/**` đổi (hoặc Actions → Docs site → Run workflow). Địa chỉ: `https://<tên>.github.io/<repo>/`. Workflow tự đặt `repoUrl` để có nút "Chỉnh sửa trang này".
3. **Xem CI:** tab Actions → CI phải xanh. Hai workflow được viết tay và **chưa chạy thử**, lỗi ở lần đầu là bình thường; đọc log và sửa.
4. **Bảo vệ nhánh** (tùy chọn nhưng nên làm): Settings → Branches → rule cho `main`: yêu cầu pull request và CI xanh.
5. Bật Issues, Discussions (nếu muốn cộng đồng dịch/hỏi đáp); gắn nhãn `good first issue`, `translation`, `sample-needed`.
6. Tạo tag phát hành đầu: `git tag v0.1.0 && git push --tags` khi M1 chạy được.

## 6. Lỗi thường gặp khi build lần đầu

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| `npm test` báo `Unknown file extension ".ts"` | Node cũ hơn 22.18 | Cài Node 22 LTS mới nhất (`node -v`) |
| `Cannot find module '@dawviz/…'` | Chưa `npm install` ở **thư mục gốc**, hoặc chạy trong thư mục con | Chạy `npm install` ở gốc; kiểm tra `node_modules/@dawviz/` có các liên kết |
| `tsc` báo lỗi kiểu ở `apps/web` | Lần đầu chạy kiểu thật với `@types/react`; chỗ hay gặp: kiểu của `framer-motion`, `ParseResponse`, ref canvas | Sửa theo thông báo; kiểu cho gói JS khai báo ở `apps/web/src/types/dawviz.d.ts` |
| Vite báo không tìm thấy `locales/*.json` | Đường dẫn import từ `apps/web/src/i18n/I18nProvider.tsx` | Phải là `../../../../locales/…`; `vite.config.ts` đã cho phép đọc ngoài thư mục `apps/web` |
| Worker không chạy / lỗi import trong Worker | Trình duyệt cũ hoặc build chưa bật module worker | Dùng Chrome/Edge mới; `vite.config.ts` có `worker: { format: 'es' }` |
| Tailwind không có style | `tailwind.config.js` `content` sai hoặc `index.css` không nạp | Kiểm tra `content: ['./index.html','./src/**/*.{ts,tsx}']` và `import './index.css'` ở `main.tsx` |
| `npm run docs:sync` báo "không chạy được split_doc.py" | Không có `python3` | Cài Python ≥ 3.8 (Windows: `py`; đặt alias `python3`) |
| `docs:check` báo SKELETON/mục lục "đã cũ" | Đổi mã hoặc tài liệu mà chưa đồng bộ | Chạy `npm run docs:sync` rồi commit kết quả |
| Khác biệt xuống dòng trên Windows | CRLF | `.gitattributes` ép LF; nếu đã lỡ, `git add --renormalize .` |
| Workflow Docs báo `Get Pages site failed ... Not Found` | Repo chưa bật GitHub Pages | Settings → Pages → Source = **GitHub Actions**, rồi Actions → Docs site → Re-run |
| CI báo `Chạy 'npm run docs:sync' rồi commit kết quả` và `git diff` có `SKELETON.md` | `SKELETON.md`/mục lục đã commit không khớp bản sinh trên máy chủ (ví dụ cây thư mục lúc đó còn `dist-docs/` hoặc thiếu `package-lock.json`) | Kéo bản mới nhất, `npm run docs:sync`, commit lại các tệp sinh ra. Từ bản này `dist-docs/` và `package-lock.json` không còn nằm trong cây thư mục |

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

