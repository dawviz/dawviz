// Mẫu của hộp thoại Chữ (D-78, T-138): menu Thêm chỉ còn một mục Chữ; hộp thoại liệt kê Ô chữ điền sẵn chỗ giữ và các widget chữ có
// phần vẽ riêng mà Ô chữ chưa làm được (thanh tiến độ, đuôi mờ, dòng nốt, chữ chưa hát, chấm nhịp, độ tin cậy, đường tempo). Ảnh xem trước vẽ bằng
// Render Core trên một dự án mẫu nhỏ có sẵn ở đây (hợp âm, giai điệu, marker, lời), nên giống hệt khi thêm vào và không phụ thuộc dự án đang mở.
// Hàm thuần, không DOM.
import { buildIndex, buildSceneHud, createWidget, DEFAULT_BRIGHTNESS, type ASTNote, type Derived, type SceneDocument, type UnifiedProjectAST, type WidgetSpec, type WidgetType } from '@dawviz/render-core';

/** `box`: Ô chữ (`TEXT`) điền sẵn; `drawn`: widget chữ có phần vẽ riêng (vẫn là loại riêng, đọc preset cũ như trước). */
export interface TextTemplate { id: string; group: 'box' | 'drawn'; type: WidgetType; props?: Record<string, unknown> }

export const TEXT_TEMPLATES: readonly TextTemplate[] = [
  { id: 'blank', group: 'box', type: 'TEXT' },
  { id: 'titleArtist', group: 'box', type: 'TEXT', props: { text: '{title}\n{artist}', style: { styleId: 'heading' } } },
  { id: 'noteCount', group: 'box', type: 'TEXT', props: { text: '{played} / {total}' } },
  { id: 'time', group: 'box', type: 'TEXT', props: { text: '{elapsed} / {total_time}', style: { styleId: 'clock' } } },
  { id: 'tempo', group: 'box', type: 'TEXT', props: { text: '{bpm} BPM  {sig}' } },
  { id: 'key', group: 'box', type: 'TEXT', props: { text: '{key}' } },
  { id: 'chord', group: 'box', type: 'TEXT', props: { text: '{chord}', style: { styleId: 'heading' } } },
  { id: 'TIME_BAR', group: 'drawn', type: 'TIME_BAR' },
  { id: 'LIVE_TRIGGER', group: 'drawn', type: 'LIVE_TRIGGER' },
  { id: 'CHORD_DETECTION', group: 'drawn', type: 'CHORD_DETECTION' },
  { id: 'LYRICS', group: 'drawn', type: 'LYRICS' },
  { id: 'SECTION', group: 'drawn', type: 'SECTION' },
  { id: 'BAR_BEAT', group: 'drawn', type: 'BAR_BEAT' },
  { id: 'KEY_SCALE', group: 'drawn', type: 'KEY_SCALE' },
  { id: 'TEMPO_INFO', group: 'drawn', type: 'TEMPO_INFO' },
];

/**
 * Loại widget chữ: không hiện riêng ở menu Thêm nữa mà đi qua hộp thoại Chữ. Tên bài và nghệ sĩ (TRACK_INFO) và Đếm sự kiện (EVENT_COUNTER)
 * có mẫu Ô chữ thay thế nên không còn mục riêng; preset cũ dùng chúng vẫn mở được.
 */
export const TEXT_WIDGET_TYPES: ReadonlySet<WidgetType> = new Set<WidgetType>([...TEXT_TEMPLATES.map((t) => t.type), 'TRACK_INFO', 'EVENT_COUNTER']);
/** Các loại còn lại của menu Thêm, theo thứ tự cũ. */
export const menuWidgets = (all: readonly WidgetType[]): WidgetType[] => all.filter((t) => !TEXT_WIDGET_TYPES.has(t));

/** Widget mới theo mẫu: như `createWidget` rồi ghi đè thuộc tính của mẫu (sâu một tầng cho kiểu chữ). */
export function widgetFromTemplate(scene: SceneDocument, tpl: TextTemplate, center?: { x: number; y: number }): WidgetSpec {
  const w = createWidget(scene, tpl.type, center);
  return tpl.props ? { ...w, properties: { ...(w.properties as Record<string, unknown>), ...JSON.parse(JSON.stringify(tpl.props)) } } : w;
}

// ───────────────────────────── dự án mẫu cho ảnh xem trước ─────────────────────────────
const PPQ = 960, SPB = 0.5; // 120 BPM, 4/4: đen = 0,5 s
const note = (id: string, pitch: number, beat: number, beats: number, velocity = 90): ASTNote =>
  ({ id, pitch, velocity, startTick: beat * PPQ, endTick: (beat + beats) * PPQ, startTimeSeconds: beat * SPB, endTimeSeconds: (beat + beats) * SPB });
let demo: UnifiedProjectAST | null = null;
/** Bốn ô nhịp C – Am – F – G, giai điệu đen, hai marker và một dòng lời. Tất định, dựng một lần. */
export function demoAst(): UnifiedProjectAST {
  if (demo) return demo;
  const chords = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]];
  const piano = chords.flatMap((c, bar) => c.map((p, k) => note(`p${bar}-${k}`, p, bar * 4, 4, 70 + k * 6)));
  const tune = [72, 74, 76, 72, 69, 72, 76, 74, 72, 77, 76, 74, 71, 74, 79, 77];
  const lead = tune.map((p, i) => note(`l${i}`, p, i, 1, 80 + (i % 4) * 10));
  const words = ['Sing ', 'a ', 'song ', 'of ', 'the ', 'night ', 'and ', 'the ', 'light ', '/Hold ', 'on ', 'to ', 'the ', 'sound ', 'of ', 'it'];
  const range = (ns: ASTNote[]) => ({ min: Math.min(...ns.map((n) => n.pitch)), max: Math.max(...ns.map((n) => n.pitch)) });
  demo = {
    meta: { title: 'Song title', artist: 'Artist', totalDurationSeconds: 8, totalTicks: 16 * PPQ, internalPPQ: PPQ,
      markers: [{ tick: 0, timeSeconds: 0, name: 'Verse' }, { tick: 8 * PPQ, timeSeconds: 4, name: 'Chorus' }],
      lyrics: words.map((text, i) => ({ tick: i * PPQ, timeSeconds: i * SPB, text })) },
    tempoMap: [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }],
    tracks: [
      { id: 'demo-piano', index: 0, name: 'Piano', color: '#7aa2ff', isMuted: false, isVisible: true, notes: piano, pitchRange: range(piano) },
      { id: 'demo-lead', index: 1, name: 'Lead', color: '#ff9f6b', isMuted: false, isVisible: true, notes: lead, pitchRange: range(lead) },
    ],
  };
  return demo;
}
/** Thời điểm của ảnh xem trước: ô nhịp 2 (Am), phách 2, giữa một nốt giai điệu và một âm tiết. */
export const PREVIEW_T = 2.6;
/** Khoảng đệm quanh widget trong ảnh xem trước (pt). */
const PAD = 24;
/**
 * Scene của ảnh xem trước: chỉ một widget theo mẫu, cỡ như khi thêm vào khung `base` (bề rộng tối đa 720 pt để chữ không quá bé), nền và kiểu chữ
 * lấy từ `base` để giống cái người dùng sẽ thấy. Kèm `derived` dựng trên dự án mẫu.
 */
export function previewOf(tpl: TextTemplate, base: SceneDocument): { scene: SceneDocument; derived: Derived; ast: UnifiedProjectAST; t: number } {
  const w0 = widgetFromTemplate(base, tpl), wd = Math.min(720, w0.layout.width), ht = w0.layout.height;
  const w: WidgetSpec = { ...w0, id: 'preview', layout: { ...w0.layout, x: PAD, y: PAD, width: wd, height: ht, rotation: 0 } };
  const scene: SceneDocument = { ...base, canvas: { ...base.canvas, designWidth: wd + 2 * PAD, designHeight: ht + 2 * PAD }, widgets: [w], comps: undefined, phases: undefined };
  const ast = demoAst(), index = buildIndex(ast.tracks, ast.meta.totalDurationSeconds);
  const derived: Derived = { index, brightness: Object.fromEntries(ast.tracks.map((tr) => [tr.id, { ...DEFAULT_BRIGHTNESS }])), hud: buildSceneHud(scene, ast, index), fontsReady: true };
  return { scene, derived, ast, t: PREVIEW_T };
}
