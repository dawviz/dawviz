// Hộp thoại Chữ (D-78, T-138): mẫu hợp lệ, menu Thêm không còn loại chữ, ảnh xem trước có nội dung trên dự án mẫu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADDABLE_WIDGETS, defaultScene, layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, type TextPrim } from '@dawviz/render-core';
import { TEXT_TEMPLATES, TEXT_WIDGET_TYPES, menuWidgets, previewOf, widgetFromTemplate } from './textTemplates.ts';
import { addWidget, initialDoc } from './commands.ts';

const base = defaultScene();

test('mẫu: id không trùng, loại có trong menu cũ, thuộc tính qua bộ kiểm không cảnh báo', () => {
  assert.equal(new Set(TEXT_TEMPLATES.map((t) => t.id)).size, TEXT_TEMPLATES.length);
  for (const tpl of TEXT_TEMPLATES) {
    assert.ok((ADDABLE_WIDGETS as readonly string[]).includes(tpl.type), tpl.id);
    const w = widgetFromTemplate(base, tpl);
    const { warnings, scene } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: base.canvas, widgets: [w] });
    assert.deepEqual(warnings, [], tpl.id);
    assert.deepEqual(scene.widgets[0].properties, w.properties, tpl.id);
  }
});

test('menu Thêm: không còn loại chữ (đi qua hộp thoại), các loại khác giữ thứ tự; Khung ô ở ngoài hộp thoại', () => {
  const m = menuWidgets(ADDABLE_WIDGETS);
  for (const t of m) assert.ok(!TEXT_WIDGET_TYPES.has(t), t);
  for (const t of ['TEXT', 'TRACK_INFO', 'EVENT_COUNTER', 'TIME_BAR', 'LIVE_TRIGGER', 'CHORD_DETECTION', 'LYRICS', 'SECTION', 'BAR_BEAT', 'KEY_SCALE', 'TEMPO_INFO']) assert.ok(!m.includes(t as never), t);
  for (const t of ['PIANO_ROLL', 'NOTATION', 'PANEL', 'NOTE_GRID', 'PROGRESS_BAR', 'IMAGE']) assert.ok(m.includes(t as never), t);
  assert.deepEqual(m, ADDABLE_WIDGETS.filter((t) => m.includes(t)));
});

test('ảnh xem trước: mỗi mẫu vẽ ra hình trên dự án mẫu; chữ có chỗ giữ được thay bằng số liệu thật', () => {
  const texts: Record<string, string> = {};
  for (const tpl of TEXT_TEMPLATES) {
    const p = previewOf(tpl, base), frame = layoutFrame(p.scene, p.derived, p.ast, p.t)[0];
    assert.ok(frame && frame.prims.length > 0, tpl.id);
    texts[tpl.id] = frame.prims.filter((x): x is TextPrim => x.kind === 'text').map((x) => x.text).join('|');
    assert.ok(p.scene.canvas.designWidth <= 720 + 48, tpl.id);
  }
  assert.match(texts.titleArtist, /Song title/); assert.match(texts.titleArtist, /Artist/);
  assert.match(texts.tempo, /120/);
  assert.match(texts.chord, /Am/);
  assert.match(texts.CHORD_DETECTION, /Am/);
  assert.match(texts.SECTION, /Verse/);
  assert.match(texts.LYRICS, /night|song/);
  assert.doesNotMatch(Object.values(texts).join('|'), /\{(title|artist|bpm|chord|played|total|elapsed|key)\}/);
});

test('thêm theo mẫu: mốc ↺ là thuộc tính của mẫu (không phải mặc định của Ô chữ); không có mẫu thì vẫn là mặc định', () => {
  const d = initialDoc('paper'), tpl = TEXT_TEMPLATES.find((t) => t.id === 'titleArtist')!;
  const w = widgetFromTemplate(d.scene, tpl), d1 = addWidget(d, w, JSON.parse(JSON.stringify(w.properties)))!.redo(d);
  assert.equal((d1.propsRef[w.id] as { text: string }).text, '{title}\n{artist}');
  const plain = widgetFromTemplate(d1.scene, TEXT_TEMPLATES[0]), d2 = addWidget(d1, plain)!.redo(d1);
  assert.equal((d2.propsRef[plain.id] as { text: string }).text, 'Text');
});
