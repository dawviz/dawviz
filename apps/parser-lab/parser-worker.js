// Worker: nạp thư viện đã bundle (một file ES module) rồi phân tích. Không có logic parser nào nằm ở đây.
import * as P from '../../dist/dawviz-parser.bundle.js';

self.onmessage = async (e) => {
  const { id, type = 'parse', name, buffer, schemas, tempo, showMuted, alsIndex, extraFiles, posUnit, numerator, denominator } = e.data;
  const t0 = performance.now();
  try {
    if (type === 'list') { // gói .alp: liệt kê các .als bên trong để người dùng chọn
      const list = await P.listAlp(buffer);
      self.postMessage({ id, ok: true, list, ms: performance.now() - t0 });
      return;
    }
    if (type === 'probe') { // dò xem file cần thêm đầu vào nào (.mid ngoài, schema)
      const p = P.probeProject(name, buffer, { schemas: (schemas || []).map((s) => JSON.parse(s)) });
      self.postMessage({ id, ok: true, probe: p, ms: performance.now() - t0 });
      return;
    }
    if (type === 'inventory') {
      const ext = name.split('.').pop().toLowerCase();
      let text;
      if (ext === 'alp') text = '(inventory chưa hỗ trợ .alp: chọn một file .als rồi phân tích thường)';
      else if (ext === 'als') text = P.formatInventory(await P.alsInventory(buffer));
      else if (ext === 'dawproject') text = P.formatInventory(await P.dawprojectInventory(buffer));
      else if (ext === 'rpp') text = JSON.stringify(P.inspectRpp(buffer), null, 2);
      else text = `(chưa có inventory cho .${ext})`;
      self.postMessage({ id, ok: true, inventory: text, ms: performance.now() - t0 });
      return;
    }
    const options = { showMuted, schemas: (schemas || []).map((s) => JSON.parse(s)) };
    if (tempo !== undefined && tempo !== null) { // số BPM hoặc [{pos, bpm, sig?}]: đổi vị trí gõ theo kiểu DAW + dấu nhịp thành điểm tempoOverride
      options.tempoOverride = Array.isArray(tempo)
        ? P.resolveTempoRows(tempo, { unit: posUnit || 'time', base: { num: numerator || 4, den: denominator || 4 } })
        : tempo;
    }
    if (extraFiles && Object.keys(extraFiles).length) options.files = extraFiles; // { tên_file: ArrayBuffer }
    if (alsIndex !== undefined && alsIndex !== null) options.alsIndex = alsIndex;
    const r = await P.parseProject(name, buffer, options);
    self.postMessage({ id, ok: true, ast: r.ast, warnings: r.warnings, format: r.format, info: r.info, ms: performance.now() - t0 });
  } catch (err) {
    self.postMessage({ id, ok: false, code: err.code || 'ERR_UNKNOWN', msg: err.message, details: err.details });
  }
};
