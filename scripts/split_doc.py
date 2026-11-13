#!/usr/bin/env python3
"""Tách tài liệu Markdown (SRS/SDD/TDD...) thành các mảnh nhỏ để đưa cho AI tham chiếu.

Mỗi mảnh = một mục theo cấp tiêu đề (mặc định `##`), có front-matter (tài liệu, đường dẫn mục,
dòng nguồn, các ID được nhắc tới). Mục dài hơn --max-chars được tách tiếp theo cấp tiêu đề kế tiếp.
Sinh thêm: <doc>/_index.md, INDEX.md (toàn bộ), index.json (máy đọc, có bản đồ ID -> file).

Ví dụ:
  python3 scripts/split_doc.py              # tách mọi tài liệu mặc định -> docs/split/
  python3 scripts/split_doc.py product/SRS.md --level 3     # chi tiết hơn (### )
  python3 scripts/split_doc.py --max-chars 4000     # mảnh nhỏ hơn
  python3 scripts/split_doc.py --find REQ-ALS-02    # in các mảnh nhắc tới ID (không ghi file)
  python3 scripts/split_doc.py --list               # liệt kê mục/độ dài của từng tài liệu
  python3 scripts/split_doc.py --check              # báo nếu split/ đã cũ so với nguồn (exit 1)
Chỉ dùng thư viện chuẩn (Python >= 3.8).
"""
import argparse
import hashlib
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
HERE = DOCS  # đường dẫn tương đối của file .md tính từ docs/
# Tài liệu sản phẩm (BRD, SRS), thiết kế ứng dụng (SDD, TDD), thư viện parser (PARSER-*), i18n. Tên (stem) phải duy nhất.
DEFAULT_DOCS = ["product/BRD.md", "product/SRS.md", "design/SDD.md", "design/TECHNICAL-DESIGN.md", "design/TDD.md", "design/ANIMATION.md", "design/CUSTOMIZATION.md", "design/ANIMATION-CATALOG.md", "design/EXPRESSIONS.md", "design/UI-DIRECTION.md",
                "parser/PARSER-SRS.md", "parser/PARSER-SDD.md", "parser/PARSER-TDD.md", "I18N.md", "PUBLISHING.md", "COMMUNITY-CONTENT.md",
                "spikes/SPIKE-1-EXPORT.md", "spikes/SPIKE-2-PARSER.md"]
ID_RE = re.compile(r"\b(?:REQ-[A-Z]+-\d+|PD-\d+|AD-\d+|BR-\d+|D-\d+|OI-\d+|SOI-\d+|AT-\d+|NFR-[A-Z]+-\d+|ARC-\d+|P-\d+|KPI-\d+|(?:ERR|WARN)_[A-Z0-9_]+)\b")
HEAD_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")


def slugify(text: str, limit: int = 48) -> str:
    text = text.replace("đ", "d").replace("Đ", "D")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^A-Za-z0-9]+", "-", text).strip("-").lower()
    return (text[:limit].strip("-")) or "muc"


def parse_headings(lines):
    """Trả danh sách (index_dòng, cấp, tiêu đề), bỏ qua dòng trong khối code ```."""
    out, fence = [], None
    for i, line in enumerate(lines):
        m = re.match(r"^\s*(```+|~~~+)", line)
        if m:
            tok = m.group(1)[0]
            fence = None if fence == tok else (fence or tok)
            continue
        if fence:
            continue
        h = HEAD_RE.match(line)
        if h:
            out.append((i, len(h.group(1)), h.group(2).strip()))
    return out


def trail_at(heads, idx):
    """Đường dẫn tổ tiên (kể cả chính nó) của tiêu đề thứ idx trong heads, bỏ H1."""
    stack = []
    for (_, lv, t) in heads[: idx + 1]:
        while stack and stack[-1][0] >= lv:
            stack.pop()
        stack.append((lv, t))
    return [t for (lv, t) in stack if lv > 1]


def split_range(lines, heads, lo, hi, level, max_chars, cut_min=2):
    """Cắt lines[lo:hi] tại mọi tiêu đề có cấp trong [cut_min, level]; mảnh quá dài thì hạ `level` xuống 1 bậc."""
    pos = [k for k, (i, lv, _) in enumerate(heads) if lo <= i < hi and cut_min <= lv <= level]
    if not pos:
        return [dict(start=lo, end=hi, title="(nội dung)", trail=[], level=level)]
    chunks = []
    first_i = heads[pos[0]][0]
    if first_i > lo and "".join(lines[lo:first_i]).strip():
        chunks.append(dict(start=lo, end=first_i, title="(mở đầu)", trail=[], level=level))
    for n, k in enumerate(pos):
        i, lv, t = heads[k]
        end = heads[pos[n + 1]][0] if n + 1 < len(pos) else hi
        text = "".join(lines[i:end])
        deeper = any(i < hi2 < end and l2 == level + 1 for (hi2, l2, _) in heads)
        if len(text) > max_chars and level < 6 and deeper:
            chunks.extend(split_range(lines, heads, i, end, level + 1, max_chars, lv))
        else:
            chunks.append(dict(start=i, end=end, title=t, trail=trail_at(heads, k), level=lv))
    return chunks


def build_chunks(path: Path, level: int, max_chars: int):
    raw = path.read_text(encoding="utf-8")
    lines = raw.splitlines(keepends=True)
    heads = parse_headings(lines)
    doc_title = next((t for (_, lv, t) in heads if lv == 1), path.stem)
    first = next((i for (i, lv, _) in heads if 2 <= lv <= level), len(lines))
    chunks = []
    if "".join(lines[:first]).strip():
        chunks.append(dict(start=0, end=first, title=doc_title + " (mở đầu)", trail=[], level=1))
    if first < len(lines):
        chunks.extend(split_range(lines, heads, first, len(lines), level, max_chars, 2))
    # bỏ mảnh chỉ có đúng một dòng tiêu đề (đường dẫn đã nằm trong front-matter của mảnh con)
    chunks = [c for c in chunks if len([l for l in lines[c["start"]:c["end"]] if l.strip()]) > 1]
    for n, c in enumerate(chunks):
        c["n"] = n
        c["text"] = "".join(lines[c["start"]:c["end"]]).rstrip() + "\n"
        c["ids"] = sorted(set(ID_RE.findall(c["text"])))
    return doc_title, raw, chunks


LINK_RE = re.compile(r"(?<!\!)(\[[^\]]*\]\()([^)\s]+)((?:\s+\"[^\"]*\")?\))")


def fix_links(text, src: Path, chunk_dir: Path):
    """Liên kết tương đối trong mảnh phải đúng từ vị trí của mảnh: đổi sang đường dẫn tính từ thư mục mảnh;
    liên kết chỉ có #neo (trỏ heading ở mục khác của tài liệu gốc) trỏ về tệp nguồn kèm neo. Bỏ qua khối code."""
    import os
    out, fence = [], None
    for line in text.splitlines(keepends=True):
        m = re.match(r"^\s*(```+|~~~+)", line)
        if m:
            fence = None if fence == m.group(1)[0] else (fence or m.group(1)[0])
            out.append(line); continue
        if fence:
            out.append(line); continue

        def sub(mm):
            href = mm.group(2)
            if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", href):  # http:, mailto:...
                return mm.group(0)
            path_part, _, frag = href.partition("#")
            target = src if not path_part else (src.parent / path_part)
            rel = os.path.relpath(target.resolve(), chunk_dir.resolve()).replace(os.sep, "/")
            return f"{mm.group(1)}{rel}{'#' + frag if frag else ''}{mm.group(3)}"
        out.append(LINK_RE.sub(sub, line))
    return "".join(out)


def assign_names(chunks):
    """Tên mảnh = slug tiêu đề (ổn định khi thêm/xóa mục khác); trùng tên trong cùng tài liệu thì thêm -2, -3. Thứ tự đọc nằm ở _index.md."""
    used = {}
    for c in chunks:
        base = slugify(c["title"])
        used[base] = used.get(base, 0) + 1
        c["fname"] = f"{base}.md" if used[base] == 1 else f"{base}-{used[base]}.md"


def front_matter(doc, doc_title, c, fname, src_hash):
    path = " > ".join(c["trail"]) if c["trail"] else c["title"]
    fm = [
        "---",
        f"doc: {doc}",
        f"doc_title: {json.dumps(doc_title, ensure_ascii=False)}",
        f"section: {json.dumps(c['title'], ensure_ascii=False)}",
        f"path: {json.dumps(path, ensure_ascii=False)}",
        f"chunk: {fname}",
        f"source_lines: {c['start'] + 1}-{c['end']}",
        f"source_sha1: {src_hash}",
        f"ids: [{', '.join(c['ids'])}]",
        "---",
        "",
    ]
    return "\n".join(fm)


def sha(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]


def run_split(files, level, max_chars, out):
    if out.exists():
        for f in files:
            d = out / f.stem
            if d.exists():
                shutil.rmtree(d)
    out.mkdir(parents=True, exist_ok=True)
    index = {"level": level, "max_chars": max_chars, "docs": {}, "ids": {}}
    top = ["# Chỉ mục tài liệu đã tách", "", "Sinh tự động bởi `split_doc.py`. Không sửa tay; sửa file nguồn rồi chạy lại.", ""]
    for f in files:
        doc_title, raw, chunks = build_chunks(f, level, max_chars)
        h = sha(raw)
        d = out / f.stem
        d.mkdir(parents=True, exist_ok=True)
        entries, sub = [], [f"# Chỉ mục {f.name} — {doc_title}", "", f"nguồn: `{f.name}` (sha1 {h})", "", "| # | Mục | File | Ký tự | ID |", "|---|---|---|---|---|"]
        assign_names(chunks)
        for c in chunks:
            fname = c["fname"]
            (d / fname).write_text(front_matter(f.name, doc_title, c, fname, h) + fix_links(c["text"], f, d), encoding="utf-8")
            rel = f"{f.stem}/{fname}"
            entries.append(dict(n=c["n"], file=rel, title=c["title"], path=c["trail"], chars=len(c["text"]), lines=[c["start"] + 1, c["end"]], ids=c["ids"]))
            sub.append(f"| {c['n']} | {' > '.join(c['trail']) or c['title']} | [{fname}]({fname}) | {len(c['text'])} | {', '.join(c['ids'][:6])}{'…' if len(c['ids']) > 6 else ''} |")
            for i in c["ids"]:
                index["ids"].setdefault(i, [])
                if rel not in index["ids"][i]:
                    index["ids"][i].append(rel)
        (d / "_index.md").write_text("\n".join(sub) + "\n", encoding="utf-8")
        index["docs"][f.name] = dict(title=doc_title, sha1=h, chunks=entries)
        top += [f"## {f.name} — {doc_title}", ""] + [f"- [{e['title']}]({e['file']}) · {e['chars']} ký tự" for e in entries] + [""]
    (out / "INDEX.md").write_text("\n".join(top) + "\n", encoding="utf-8")
    (out / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=1), encoding="utf-8")
    return index


def cmd_find(files, level, max_chars, needle):
    pat = re.compile(re.escape(needle), re.I)
    hits = 0
    for f in files:
        doc_title, _, chunks = build_chunks(f, level, max_chars)
        for c in chunks:
            if pat.search(c["text"]):
                hits += 1
                print(f"=== {f.name} › {' > '.join(c['trail']) or c['title']}  (dòng {c['start'] + 1}-{c['end']})")
                print(c["text"])
    if not hits:
        print(f"không thấy '{needle}'", file=sys.stderr)
    return 0 if hits else 1


def cmd_list(files, level, max_chars):
    for f in files:
        doc_title, _, chunks = build_chunks(f, level, max_chars)
        print(f"{f.name}: {doc_title} — {len(chunks)} mảnh")
        for c in chunks:
            print(f"  {c['n']:02d} {len(c['text']):6d}  {' > '.join(c['trail']) or c['title']}")


def cmd_check(files, level, max_chars, out):
    idx = out / "index.json"
    if not idx.exists():
        print("chưa tách (thiếu index.json)")
        return 1
    old = json.loads(idx.read_text(encoding="utf-8"))
    bad = [f.name for f in files if old["docs"].get(f.name, {}).get("sha1") != sha(f.read_text(encoding="utf-8"))
           or old.get("level") != level or old.get("max_chars") != max_chars]
    if bad:
        print("đã cũ:", ", ".join(bad), "→ chạy lại split_doc.py")
        return 1
    print("split/ khớp với nguồn")
    return 0


def main():
    ap = argparse.ArgumentParser(description="Tách tài liệu Markdown thành các mảnh cho AI tham chiếu")
    ap.add_argument("files", nargs="*", help="file .md (mặc định: toàn bộ tài liệu trong docs/, xem DEFAULT_DOCS)")
    ap.add_argument("--level", type=int, default=2, help="cấp tiêu đề dùng để cắt (mặc định 2 = '##')")
    ap.add_argument("--max-chars", type=int, default=6000, help="mảnh dài hơn sẽ cắt tiếp theo cấp kế (mặc định 6000)")
    ap.add_argument("--out", default=str(HERE / "split"), help="thư mục đầu ra (mặc định docs/split)")
    ap.add_argument("--find", metavar="TEXT", help="in các mảnh chứa TEXT (ví dụ REQ-ALS-02), không ghi file")
    ap.add_argument("--list", action="store_true", help="liệt kê mảnh và độ dài, không ghi file")
    ap.add_argument("--check", action="store_true", help="kiểm tra split/ còn khớp nguồn không")
    a = ap.parse_args()
    if not 1 <= a.level <= 5:
        ap.error("--level phải từ 1 đến 5")
    files = [Path(x) if Path(x).is_absolute() or Path(x).exists() else HERE / x for x in (a.files or DEFAULT_DOCS)]
    missing = [str(f) for f in files if not f.exists()]
    if missing:
        sys.exit("không thấy: " + ", ".join(missing))
    out = Path(a.out)
    if a.find:
        sys.exit(cmd_find(files, a.level, a.max_chars, a.find))
    if a.list:
        return cmd_list(files, a.level, a.max_chars)
    if a.check:
        sys.exit(cmd_check(files, a.level, a.max_chars, out))
    idx = run_split(files, a.level, a.max_chars, out)
    n = sum(len(d["chunks"]) for d in idx["docs"].values())
    print(f"đã tách {len(files)} tài liệu thành {n} mảnh, {len(idx['ids'])} ID → {out}")


if __name__ == "__main__":
    main()
