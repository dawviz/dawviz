// Giao diện trang tài liệu: đổi sáng/tối, mở menu trên di động, tìm kiếm phía máy khách (chỉ mục nằm trong search-index.js).
(function () {
  var root = document.documentElement;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var saved = store('docs.theme'); if (saved) root.setAttribute('data-theme', saved);
  document.getElementById('theme').addEventListener('click', function () {
    var dark = root.getAttribute('data-theme') ? root.getAttribute('data-theme') === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark'; root.setAttribute('data-theme', next); store('docs.theme', next);
  });
  document.getElementById('navbtn').addEventListener('click', function () { document.body.classList.toggle('navopen'); });

  var fold = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); };
  var q = document.getElementById('q'), box = document.getElementById('results'), on = -1, shown = [];
  var IDX = window.__DOCS_INDEX || [], base = document.documentElement.getAttribute('data-root') || '';
  IDX.forEach(function (e) { e.f = fold(e.t + ' ' + e.h + ' ' + e.x); e.ft = fold(e.h + ' ' + e.t); });
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function search() {
    var terms = fold(q.value).split(/\s+/).filter(Boolean); on = -1;
    if (!terms.length) { box.style.display = 'none'; return; }
    var hits = [];
    IDX.forEach(function (e) {
      var s = 0; for (var i = 0; i < terms.length; i++) { var t = terms[i]; if (e.f.indexOf(t) < 0) { s = -1; break; } s += e.ft.indexOf(t) >= 0 ? 5 : 1; if (e.h && fold(e.h).indexOf(t) === 0) s += 2; }
      if (s > 0) hits.push([s, e]);
    });
    hits.sort(function (a, b) { return b[0] - a[0]; }); shown = hits.slice(0, 14).map(function (h) { return h[1]; });
    box.innerHTML = shown.length ? shown.map(function (e, i) {
      var at = fold(e.x).indexOf(terms[0]); var snip = e.x.slice(Math.max(0, at - 40), Math.max(0, at - 40) + 130);
      return '<a href="' + base + e.u + '" data-i="' + i + '"><b>' + esc(e.h || e.t) + '</b><small>' + esc(e.t) + (snip ? ' — …' + esc(snip) + '…' : '') + '</small></a>';
    }).join('') : '<a><small>Không có kết quả</small></a>';
    box.style.display = 'block';
  }
  q.addEventListener('input', search);
  q.addEventListener('keydown', function (ev) {
    var items = box.querySelectorAll('a[data-i]');
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); if (!items.length) return; on = (on + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach(function (a, i) { a.classList.toggle('on', i === on); }); }
    else if (ev.key === 'Enter' && items[on < 0 ? 0 : on]) { location.href = items[on < 0 ? 0 : on].href; }
    else if (ev.key === 'Escape') { box.style.display = 'none'; q.blur(); }
  });
  document.addEventListener('click', function (ev) { if (!box.contains(ev.target) && ev.target !== q) box.style.display = 'none'; });
  document.addEventListener('keydown', function (ev) { if (ev.key === '/' && document.activeElement !== q && !/input|textarea/i.test(document.activeElement.tagName)) { ev.preventDefault(); q.focus(); } });
})();
