// Áp theme giao diện (REQ-UI-10) trước lần vẽ đầu để không nháy màu. Tệp tĩnh riêng vì CSP không cho script nội tuyến.
// Phải khớp src/lib/theme.ts (khoá, giá trị mặc định); sau khi React chạy, useTheme() tiếp quản và theo dõi hệ thống.
(function () {
  var mode = 'dark', palette = 'studio';
  try {
    var p = JSON.parse(localStorage.getItem('dawviz.prefs.v1.theme') || '{}');
    if (p.mode === 'light' || p.mode === 'dark' || p.mode === 'system') mode = p.mode;
    if (['studio', 'print', 'brass', 'riso'].indexOf(p.palette) >= 0) palette = p.palette;
  } catch (e) { /* chế độ riêng tư hoặc dữ liệu hỏng: dùng mặc định */ }
  if (mode === 'system') mode = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', mode);
  document.documentElement.setAttribute('data-palette', palette);
})();
