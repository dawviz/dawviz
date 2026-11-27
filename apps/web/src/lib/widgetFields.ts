// Bảng khai báo mục Thiết lập của từng loại widget (T-73 bổ sung, REQ-UI-13/15, D-57): MỖI thiết lập khai báo MỘT lần ở đây;
// `WidgetSettings` vẽ điều khiển, nút ↺ và dấu "đã chỉnh nâng cao" từ chính bảng này, nên thêm một thiết lập mới là tự có ↺
// (test `widgetFields.test.ts` bắt thiết lập có trong mặc định mà thiếu trong bảng). Hàm thuần, không DOM.
import { NOTE_TRANSITION_NAMES, type WidgetSpec, type WidgetType } from '@dawviz/render-core';
import { ANIM_EFFECTS, ANIM_ORDERS, ANIM_UNITS, DEFAULT_TEXT_ANIMATOR, EASING_NAMES, PEAK_STYLES, SPECTRUM_STYLES } from '@dawviz/render-core';
import { DEFAULT_KEYBOARD_STYLE, DEFAULT_ROLL_GRID, KEYBOARD_SCALES, KEYBOARD_SHAPES, KEY_LABEL_MODES, PLAYHEAD_HITS, PLAYHEAD_STYLES, widgetDefaults } from '@dawviz/render-core';

type Obj = Record<string, unknown>;
export type FieldKind = 'check' | 'num' | 'choice' | 'select' | 'color' | 'colorOpt' | 'text' | 'asset';

export interface FieldDef {
  /** Đường dẫn tới giá trị trong `properties` (có thể lồng: ['lines', 'played', 'enabled']). */
  path: readonly string[];
  kind: FieldKind;
  /** Khoá con của `web.ws.*` làm nhãn. */
  label: string;
  /** Khoá con của `web.ws.*` của nhóm chứa nó (ví dụ dòng "Số nốt đã phát"): ghép vào tên cho đọc màn hình và chú thích ↺. */
  group?: string;
  /** Chỉ hiện ở Nâng cao. */
  adv?: boolean;
  /** Điều kiện hiện (theo thuộc tính hiện tại của widget). */
  when?: (P: Obj) => boolean;
  /** kind 'num': giới hạn cứng và `range` mềm cho tốc độ kéo. */
  num?: { min: number; max: number; step: number; range?: [number, number] };
  /** kind 'choice' | 'select': giá trị và tiền tố khoá nhãn (`${prefix}${giá trị}`). */
  options?: readonly (string | number)[];
  prefix?: string;
  /** Lựa chọn hiện đúng giá trị (tên kỹ thuật như tên easing), không dịch qua `prefix`. */
  raw?: boolean;
  /** kind 'select': thêm các lane automation của dự án đang mở (T-66) vào `options`, gọi theo tên lane. */
  lanes?: boolean;
  /** kind 'text'. `placeholder`: khoá con của `web.ws.*` khi để trống. */
  text?: { max?: number; multiline?: boolean; placeholder?: string };
  testId?: string;
}

/**
 * Nhóm thiết lập (D-71, T-124): tiêu đề con gấp được trong mục Thiết lập và nhóm cùng tên trên Timeline keyframe.
 * `fields`: đường dẫn (nối bằng dấu chấm) của các ô thuộc nhóm, theo thứ tự của bảng WIDGET_FIELDS.
 * `head`: ô đứng ở tiêu đề nhóm (công tắc bool, hoặc danh sách có giá trị "Tắt"); `on` cho biết nhóm đang bật (mặc định: giá trị của `head` là true).
 * Nhóm tắt thì ẩn các ô con (giữ giá trị), trừ ô đang có hoạt hình.
 */
export interface SectionDef { id: string; fields: readonly string[]; head?: string; on?: (P: Obj) => boolean }
const SEC = (id: string, fields: readonly string[], rest: Omit<SectionDef, 'id' | 'fields'> = {}): SectionDef => ({ id, fields, ...rest });

const L = (path: string[], kind: FieldKind, label: string, rest: Partial<FieldDef> = {}): FieldDef => ({ path, kind, label, ...rest });
/** Kiểu của Phổ tần (vắng = Cột). */
const spStyle = (P: Obj) => String(P.style ?? 'BARS');
/** Lưới nốt: quanh vạch phát, hàng theo cao độ, hình chấm (vuông/tròn). */
const win = (P: Obj) => P.span === 'WINDOW';
const byPitch = (P: Obj) => P.rows === 'PITCH';
const dotShape = (P: Obj) => P.shape === 'SQUARE' || P.shape === 'ROUND';
/** Kiểu phổ đọc dải tần tại t (cột, vùng, đường, chấm): dùng thang, dải Hz, attack/release, đảo chiều. */
const spectral = (P: Obj) => ['BARS', 'AREA', 'LINE', 'DOTS'].includes(spStyle(P));
/** Phổ tần: nhóm Đỉnh (T-130) chỉ hiện khi kiểu Cột/Chấm và công tắc `peakCap` bật (D-71). */
const peakOn = (P: Obj) => (spStyle(P) === 'BARS' || spStyle(P) === 'DOTS') && !!P.peakCap;
/** Đồng hồ luôn vẽ theo đường thẳng (bỏ qua hình dạng): góc và chiều dài dùng được, bán kính/góc bắt đầu thì không. */
const spOnCircle = (P: Obj) => P.shape === 'CIRCLE' && spStyle(P) !== 'METER';
const spOnLine = (P: Obj) => !spOnCircle(P);
/** Kiểu tô theo dải màu hai đầu (Vùng, Đường, Dao động ký, Sóng âm chỉ dùng một màu). */
const spGradient = (P: Obj) => ['BARS', 'DOTS', 'METER'].includes(spStyle(P));
/** Kiểu đọc mức theo sàn/trần dB. */
const spLevels = (P: Obj) => spectral(P) || spStyle(P) === 'METER';
const ta = (P: Obj) => (P.animator ?? {}) as Obj;
const taOn = (P: Obj) => !!ta(P).enabled;
const taCustom = (P: Obj) => taOn(P) && ta(P).effect === 'custom';
/** Đối tượng lồng tuỳ chọn và giá trị mặc định của nó: bảng Thiết lập đọc/ghi trên bản đã trộn, nên bật lần đầu ghi đủ trường. */
const NESTED_DEFAULTS: Partial<Record<WidgetType, Obj>> = { TEXT: { animator: DEFAULT_TEXT_ANIMATOR as unknown as Obj }, PIANO_ROLL: { keyboard: DEFAULT_KEYBOARD_STYLE as unknown as Obj, grid: DEFAULT_ROLL_GRID as unknown as Obj } };
/** Piano Roll của tài liệu cũ có thể thiếu các trường phẳng mới (T-58/T-59): lấy mặc định của loại. */
const FLAT_DEFAULTS: Partial<Record<WidgetType, () => Obj>> = { PIANO_ROLL: () => widgetDefaults('PIANO_ROLL') };
export function withNestedDefaults(type: WidgetType, P0: Obj): Obj {
  const d = NESTED_DEFAULTS[type]; if (!d) return P0;
  const flat = FLAT_DEFAULTS[type], P = flat && Object.keys(flat()).some((k) => !(k in P0)) ? { ...flat(), ...P0 } : P0;
  let out = P;
  for (const [k, v] of Object.entries(d)) out = { ...out, [k]: { ...(v as Obj), ...((P[k] as Obj | undefined) ?? {}) } };
  return out;
}
const LINES = ['played', 'total', 'progress', 'tempo'] as const;
const kb = (P: Obj) => (P.keyboard ?? {}) as Obj;
const kbOn = (P: Obj) => !!kb(P).enabled;
const gridOn = (P: Obj) => { const g = (P.grid ?? {}) as Obj; return !!(g.bars || g.beats || g.numbers); };
/** Số chữ số tối thiểu của mỗi nhóm trong kiểu "nhóm số" (001 35 083): 1–8, như lược đồ preset. */
const DIGITS = { min: 1, max: 8, step: 1 } as const;

/** Thiết lập của từng loại, theo thứ tự hiển thị. Loại không có thiết lập: không có mặt. */
export const WIDGET_FIELDS: Readonly<Partial<Record<WidgetType, readonly FieldDef[]>>> = {
  TRACK_INFO: [
    L(['titleText'], 'text', 'title', { text: { placeholder: 'fromProject' } }),
    L(['artistText'], 'text', 'artist', { text: { placeholder: 'fromProject' } }),
  ],
  EVENT_COUNTER: [
    ...LINES.flatMap((k) => [
      L(['lines', k, 'enabled'], 'check', `line.${k}`, { testId: `ws-line-${k}` }),
      L(['lines', k, 'template'], 'text', 'template', { group: `line.${k}`, adv: true, when: (P) => !!((P.lines as Obj)[k] as Obj).enabled }),
    ]),
    L(['decimals'], 'num', 'decimals', { adv: true, num: { min: 0, max: 4, step: 1 } }),
    // Khoảng cách dòng chỉ có tác dụng khi bật từ hai dòng trở lên (D-72).
    L(['lineHeight'], 'num', 'lineHeight', { adv: true, when: (P) => LINES.filter((k) => !!(((P.lines as Obj | undefined)?.[k] ?? {}) as Obj).enabled).length >= 2, num: { min: 1, max: 3, step: 0.05 } }),
  ],
  LIVE_TRIGGER: [
    L(['mode'], 'choice', 'layout', { options: ['list', 'inline'], prefix: 'web.ws.mode.' }),
    L(['maxLines'], 'num', 'maxLines', { when: (P) => P.mode === 'list', num: { min: 1, max: 32, step: 1 } }),
    L(['showTrack'], 'check', 'showTrack'),
    L(['template'], 'text', 'template', { adv: true }),
    L(['trackTemplate'], 'text', 'trackTemplate', { adv: true, when: (P) => !!P.showTrack }),
    L(['separator'], 'text', 'separator', { adv: true, when: (P) => P.mode === 'inline', text: { max: 16 } }),
    L(['tailMs'], 'num', 'tailMs', { adv: true, num: { min: 0, max: 1000, step: 10, range: [0, 1000] } }),
    L(['lineHeight'], 'num', 'lineHeight', { adv: true, when: (P) => P.mode === 'list', num: { min: 1, max: 3, step: 0.05 } }),
  ],
  TIME_BAR: [
    L(['time', 'enabled'], 'check', 'showTime'),
    L(['time', 'format'], 'choice', 'timeFormat', { when: (P) => !!(P.time as Obj).enabled, options: ['grouped', 'clock'], prefix: 'web.ws.format.' }),
    L(['beat', 'enabled'], 'check', 'showBeat'),
    L(['beat', 'format'], 'choice', 'beatFormat', { when: (P) => !!(P.beat as Obj).enabled, options: ['grouped', 'bbs'], prefix: 'web.ws.format.' }),
    L(['showBars'], 'check', 'showBars'),
    L(['time', 'label'], 'text', 'timeLabel', { adv: true, when: (P) => !!(P.time as Obj).enabled, text: { max: 40 } }),
    L(['beat', 'label'], 'text', 'beatLabel', { adv: true, when: (P) => !!(P.beat as Obj).enabled, text: { max: 40 } }),
    L(['timeGroups', '0'], 'num', 'timeDigitsMin', { adv: true, when: (P) => !!(P.time as Obj).enabled && (P.time as Obj).format === 'grouped', num: DIGITS }),
    L(['timeGroups', '1'], 'num', 'timeDigitsSec', { adv: true, when: (P) => !!(P.time as Obj).enabled && (P.time as Obj).format === 'grouped', num: DIGITS }),
    L(['timeGroups', '2'], 'num', 'timeDigitsMs', { adv: true, when: (P) => !!(P.time as Obj).enabled && (P.time as Obj).format === 'grouped', num: DIGITS }),
    L(['beatGroups', '0'], 'num', 'beatDigitsBar', { adv: true, when: (P) => !!(P.beat as Obj).enabled && (P.beat as Obj).format === 'grouped', num: DIGITS }),
    L(['beatGroups', '1'], 'num', 'beatDigitsBeat', { adv: true, when: (P) => !!(P.beat as Obj).enabled && (P.beat as Obj).format === 'grouped', num: DIGITS }),
    L(['beatGroups', '2'], 'num', 'beatDigitsTick', { adv: true, when: (P) => !!(P.beat as Obj).enabled && (P.beat as Obj).format === 'grouped', num: DIGITS }),
    L(['rowGap'], 'num', 'rowGap', { adv: true, num: { min: 1, max: 5, step: 0.05 } }),
    L(['barLength'], 'num', 'barLength', { adv: true, when: (P) => !!P.showBars, num: { min: 4, max: 1000, step: 1, range: [8, 400] } }),
    L(['barThickness'], 'num', 'barThickness', { adv: true, when: (P) => !!P.showBars, num: { min: 0.5, max: 40, step: 0.5, range: [0.5, 10] } }),
    L(['barColor'], 'color', 'barColor', { adv: true, when: (P) => !!P.showBars }),
    L(['barTrackColor'], 'colorOpt', 'barTrackColor', { adv: true, when: (P) => !!P.showBars }),
  ],
  CHORD_DETECTION: [
    L(['mode'], 'choice', 'chordMode', { options: ['sustained', 'strike'], prefix: 'web.ws.chordMode.' }),
    L(['alwaysShowNotes'], 'check', 'alwaysShowNotes', { testId: 'ws-always-notes' }),
    L(['unrecognized'], 'select', 'unrecognized', { options: ['nc', 'notes'], prefix: 'web.ws.unrecognized.' }),
    L(['noChordText'], 'text', 'noChordText', { adv: true, when: (P) => P.unrecognized === 'nc', text: { max: 20 } }),
    L(['notesTemplate'], 'text', 'notesTemplate', { adv: true, when: (P) => !!P.alwaysShowNotes || P.unrecognized === 'notes' }),
  ],
  // Phổ tần (T-53, T-130): nhóm Kiểu, Hình học, Cột, Đỉnh, Màu, Phản hồi (D-71). Ô không có tác dụng với kiểu/hình đang chọn thì ẩn hẳn (D-72);
  // mỗi điều kiện có test trong packages/render-core/test/inert-props.test.ts (đổi giá trị không đổi chuỗi hình).
  AUDIO_SPECTRUM: [
    L(['style'], 'select', 'spStyle', { options: SPECTRUM_STYLES, prefix: 'web.ws.spStyle.', testId: 'ws-sp-style' }),
    L(['bars'], 'num', 'spBars', { when: (P) => spStyle(P) !== 'OSCILLOSCOPE' && spStyle(P) !== 'METER', num: { min: 8, max: 256, step: 1 } }),
    L(['scale'], 'choice', 'spScale', { adv: true, when: spectral, options: ['LOG', 'LINEAR', 'MEL'], prefix: 'web.ws.spScale.' }),
    L(['scopeMs'], 'num', 'spScopeMs', { when: (P) => spStyle(P) === 'OSCILLOSCOPE', num: { min: 5, max: 500, step: 1, range: [5, 100] } }),
    L(['shape'], 'choice', 'spShape', { when: (P) => spStyle(P) !== 'METER', options: ['LINE', 'CIRCLE'], prefix: 'web.ws.shape.', testId: 'ws-sp-shape' }),
    L(['angle'], 'num', 'spAngle', { when: spOnLine, num: { min: -360, max: 360, step: 1, range: [-180, 180] } }),
    L(['length'], 'num', 'spLength', { when: spOnLine, num: { min: 16, max: 8192, step: 1, range: [100, 1920] } }),
    L(['radius'], 'num', 'spRadius', { when: spOnCircle, num: { min: 0, max: 4096, step: 1, range: [20, 600] } }),
    L(['startAngle'], 'num', 'spStartAngle', { adv: true, when: spOnCircle, num: { min: -360, max: 360, step: 1, range: [-180, 180] } }),
    L(['thickness'], 'num', 'spThickness', { num: { min: 1, max: 4096, step: 1, range: [10, 600] } }),
    L(['mirror'], 'check', 'spMirror', { adv: true, when: (P) => spStyle(P) !== 'METER' && (!spOnCircle(P) || spStyle(P) === 'BARS') }),
    L(['reverse'], 'check', 'spReverse', { adv: true, when: spectral }),
    L(['barWidth'], 'num', 'spBarWidth', { adv: true, when: (P) => spStyle(P) !== 'AREA' && spStyle(P) !== 'METER', num: { min: 0.1, max: 1, step: 0.05 } }),
    L(['roundness'], 'num', 'spRoundness', { adv: true, when: (P) => ['BARS', 'WAVEFORM', 'METER'].includes(spStyle(P)), num: { min: 0, max: 1, step: 0.05 } }),
    L(['minLen'], 'num', 'spMinLen', { adv: true, when: (P) => spStyle(P) !== 'OSCILLOSCOPE' && spStyle(P) !== 'METER', num: { min: 0, max: 100, step: 1, range: [0, 20] } }),
    L(['peakCap'], 'check', 'spPeakCap', { when: (P) => spStyle(P) === 'BARS' || spStyle(P) === 'DOTS' }),
    L(['capFall'], 'num', 'spCapFall', { adv: true, when: peakOn, num: { min: 0.05, max: 10, step: 0.05, range: [0.1, 3] } }),
    L(['peakStyle'], 'choice', 'spPeakStyle', { when: peakOn, options: PEAK_STYLES, prefix: 'web.ws.spPeakStyle.' }),
    L(['peakHold'], 'num', 'spPeakHold', { adv: true, when: peakOn, num: { min: 0, max: 5, step: 0.05, range: [0, 2] } }),
    L(['peakGravity'], 'num', 'spPeakGravity', { adv: true, when: peakOn, num: { min: 0, max: 20, step: 0.1, range: [0, 8] } }),
    L(['peakColor'], 'colorOpt', 'spPeakColor', { adv: true, when: peakOn }),
    L(['color'], 'color', 'spColor'),
    L(['colorMode'], 'choice', 'spColorMode', { adv: true, when: spGradient, options: ['SOLID', 'GRADIENT'], prefix: 'web.ws.colorMode.' }),
    L(['colorB'], 'color', 'spColorB', { adv: true, when: (P) => spGradient(P) && P.colorMode === 'GRADIENT' }),
    L(['playedColor'], 'color', 'spPlayed', { when: (P) => spStyle(P) === 'WAVEFORM' || spStyle(P) === 'METER' }),
    L(['opacity'], 'num', 'spOpacity', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['glow'], 'num', 'spGlow', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['attackMs'], 'num', 'spAttack', { adv: true, when: spectral, num: { min: 0, max: 1000, step: 5, range: [0, 300] } }),
    L(['releaseMs'], 'num', 'spRelease', { adv: true, when: spectral, num: { min: 0, max: 3000, step: 10, range: [0, 1000] } }),
    L(['floorDb'], 'num', 'spFloorDb', { adv: true, when: spLevels, num: { min: -80, max: -10, step: 1 } }),
    L(['ceilDb'], 'num', 'spCeilDb', { adv: true, when: spLevels, num: { min: -60, max: 0, step: 1 } }),
    L(['minHz'], 'num', 'spMinHz', { adv: true, when: spectral, num: { min: 20, max: 20000, step: 10, range: [20, 2000] } }),
    L(['maxHz'], 'num', 'spMaxHz', { adv: true, when: spectral, num: { min: 20, max: 20000, step: 100, range: [1000, 20000] } }),
  ],
  PARTICLES: [
    L(['perNote'], 'num', 'ptPerNote', { num: { min: 1, max: 24, step: 1 } }),
    L(['life'], 'num', 'ptLife', { num: { min: 0.2, max: 10, step: 0.1, range: [0.2, 5] } }),
    L(['speed'], 'num', 'ptSpeed', { num: { min: 0, max: 3000, step: 5, range: [0, 800] } }),
    L(['angle'], 'num', 'ptAngle', { num: { min: -360, max: 360, step: 1, range: [-180, 180] } }),
    L(['spread'], 'num', 'ptSpread', { num: { min: 0, max: 360, step: 1 } }),
    L(['gravity'], 'num', 'ptGravity', { num: { min: -3000, max: 3000, step: 10, range: [-600, 600] } }),
    L(['sizeStart'], 'num', 'ptSizeStart', { num: { min: 0, max: 200, step: 0.5, range: [0, 40] } }),
    L(['sizeEnd'], 'num', 'ptSizeEnd', { num: { min: 0, max: 200, step: 0.5, range: [0, 40] } }),
    L(['colorMode'], 'choice', 'ptColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.ptColor.' }),
    L(['color'], 'color', 'ptColor', { when: (P) => P.colorMode === 'SOLID' }),
    L(['velocityScale'], 'check', 'ptVelocityScale', { adv: true }),
    L(['speedSpread'], 'num', 'ptSpeedSpread', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['shape'], 'choice', 'ptShape', { adv: true, options: ['CIRCLE', 'SQUARE'], prefix: 'web.ws.ptShape.' }),
    L(['opacity'], 'num', 'ptOpacity', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['fade'], 'check', 'ptFade', { adv: true }),
    L(['glow'], 'num', 'ptGlow', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['originX'], 'select', 'ptOriginX', { adv: true, options: ['NOTE', 'PITCH', 'CENTER', 'SPREAD'], prefix: 'web.ws.ptOrigin.' }),
    L(['originY'], 'num', 'ptOriginY', { adv: true, when: (P) => P.originX !== 'NOTE', num: { min: 0, max: 1, step: 0.05 } }),
    L(['pitchMin'], 'num', 'ptPitchMin', { adv: true, when: (P) => P.originX === 'PITCH', num: { min: 0, max: 127, step: 1 } }),
    L(['pitchMax'], 'num', 'ptPitchMax', { adv: true, when: (P) => P.originX === 'PITCH', num: { min: 0, max: 127, step: 1 } }),
    L(['seed'], 'num', 'ptSeed', { adv: true, num: { min: 0, max: 999999, step: 1 } }),
    L(['maxParticles'], 'num', 'ptMax', { adv: true, num: { min: 50, max: 4000, step: 50 } }),
  ],
  PROGRESS_BAR: [
    L(['orientation'], 'choice', 'orientation', { options: ['HORIZONTAL', 'VERTICAL'], prefix: 'web.ws.orientation.' }),
    L(['thickness'], 'num', 'thickness', { num: { min: 1, max: 200, step: 1, range: [1, 40] } }),
    L(['progressColor'], 'color', 'progressColor'),
    L(['showTime'], 'check', 'showTimeText', { when: (P) => P.orientation === 'HORIZONTAL' }),
    L(['trackColor'], 'colorOpt', 'trackColor', { adv: true }),
    L(['radius'], 'num', 'radius', { adv: true, num: { min: 0, max: 100, step: 1, range: [0, 20] } }),
    L(['timeTemplate'], 'text', 'template', { adv: true, when: (P) => P.orientation === 'HORIZONTAL' && !!P.showTime }),
  ],
  TEMPO_INFO: [
    L(['template'], 'text', 'template', { text: { max: 200 } }),
    L(['showCurve'], 'check', 'inShowCurve'),
    L(['curveHeight'], 'num', 'inCurveHeight', { when: (P) => !!P.showCurve, num: { min: 8, max: 400, step: 1, range: [8, 120] } }),
    L(['curveColor'], 'color', 'inCurveColor', { when: (P) => !!P.showCurve }),
    L(['flash'], 'check', 'inFlash'),
    L(['flashColor'], 'color', 'inFlashColor', { adv: true, when: (P) => !!P.flash }),
    L(['flashMs'], 'num', 'inFlashMs', { adv: true, when: (P) => !!P.flash, num: { min: 50, max: 3000, step: 10, range: [50, 1500] } }),
  ],
  BAR_BEAT: [
    L(['format'], 'choice', 'inBarFormat', { options: ['PERCENT', 'SIXTEENTH'], prefix: 'web.ws.inBarFormat.' }),
    L(['dots'], 'check', 'inDots'),
    L(['pulse'], 'check', 'inPulse', { when: (P) => !!P.dots }),
    L(['dotActiveColor'], 'color', 'inDotActive', { when: (P) => !!P.dots }),
    L(['dotColor'], 'color', 'inDotColor', { adv: true, when: (P) => !!P.dots }),
    L(['dotSize'], 'num', 'inDotSize', { adv: true, when: (P) => !!P.dots, num: { min: 2, max: 60, step: 1, range: [4, 30] } }),
    L(['barDigits'], 'num', 'inBarDigits', { adv: true, num: { min: 1, max: 4, step: 1 } }),
  ],
  KEY_SCALE: [
    L(['template'], 'text', 'template', { text: { max: 200 } }),
    L(['showConfidence'], 'check', 'inShowConf'),
    L(['windowSec'], 'num', 'inKeyWindow', { num: { min: 2, max: 120, step: 1, range: [4, 60] } }),
    L(['minConfidence'], 'num', 'inMinConf', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['confTemplate'], 'text', 'inConfTemplate', { adv: true, when: (P) => !!P.showConfidence, text: { max: 200 } }),
    L(['majorLabel'], 'text', 'inMajorLabel', { adv: true, text: { max: 24 } }),
    L(['minorLabel'], 'text', 'inMinorLabel', { adv: true, text: { max: 24 } }),
    L(['noKeyText'], 'text', 'inNoKey', { adv: true, text: { max: 40 } }),
  ],
  VELOCITY: [
    L(['mode'], 'choice', 'inVelMode', { options: ['LEVEL', 'HISTOGRAM'], prefix: 'web.ws.inVelMode.' }),
    L(['perTrack'], 'check', 'inPerTrack', { when: (P) => P.mode === 'LEVEL' }),
    L(['decayMs'], 'num', 'inDecay', { when: (P) => P.mode === 'LEVEL', num: { min: 50, max: 5000, step: 10, range: [100, 2000] } }),
    L(['windowSec'], 'num', 'inVelWindow', { when: (P) => P.mode === 'HISTOGRAM', num: { min: 1, max: 120, step: 1, range: [2, 30] } }),
    // Biểu đồ phân bố chỉ dùng một màu; một cột chung (không tách track) dùng màu riêng trừ khi chỉ có một track, nên vẫn hiện cả hai.
    L(['colorMode'], 'choice', 'inColorMode', { when: (P) => P.mode !== 'HISTOGRAM', options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
    L(['color'], 'color', 'inColor', { when: (P) => P.colorMode === 'SOLID' || P.mode === 'HISTOGRAM' || !P.perTrack }),
    L(['bins'], 'num', 'inBins', { adv: true, when: (P) => P.mode === 'HISTOGRAM', num: { min: 4, max: 16, step: 1 } }),
    L(['gap'], 'num', 'inGap', { adv: true, when: (P) => P.mode === 'HISTOGRAM' || !!P.perTrack, num: { min: 0, max: 40, step: 1, range: [0, 16] } }),
    L(['trackColor'], 'colorOpt', 'inBackColor', { adv: true }),
    L(['radius'], 'num', 'radius', { adv: true, num: { min: 0, max: 50, step: 1, range: [0, 12] } }),
  ],
  PITCH_WHEEL: [
    L(['order'], 'choice', 'inWheelOrder', { options: ['CHROMATIC', 'FIFTHS'], prefix: 'web.ws.inWheelOrder.' }),
    L(['showNames'], 'check', 'inShowNames'),
    L(['showChord'], 'check', 'inShowChord'),
    L(['litColor'], 'color', 'inLitColor'),
    L(['dimColor'], 'color', 'inDimColor', { adv: true }),
    L(['dimAlpha'], 'num', 'inDimAlpha', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['ring'], 'num', 'inRing', { adv: true, num: { min: 0.1, max: 0.5, step: 0.01 } }),
    // Kiểu bảng phân tích (REFERENCE-VIDEOS video 3): bậc La Mã, nút tròn, đa giác nối nốt, cung tiến độ, số phách.
    L(['labels'], 'choice', 'inWheelLabels', { when: (P) => !!P.showNames, options: ['NAMES', 'DEGREES'], prefix: 'web.ws.inWheelLabels.' }),
    L(['nodeShape'], 'choice', 'inNodeShape', { options: ['TILE', 'CIRCLE'], prefix: 'web.ws.inNodeShape.' }),
    L(['chordAs'], 'choice', 'inChordAs', { when: (P) => !!P.showChord, options: ['NAME', 'DEGREE'], prefix: 'web.ws.inChordAs.' }),
    L(['subTemplate'], 'text', 'inSubTemplate', { text: { max: 200 } }),
    L(['polygon'], 'check', 'inPolygon'),
    L(['progress'], 'choice', 'inProgressRing', { options: ['OFF', 'BAR', 'SONG'], prefix: 'web.ws.inProgressRing.' }),
    L(['beatMarks'], 'check', 'inBeatMarks'),
    L(['rootColor'], 'colorOpt', 'inRootColor', { adv: true }),
    L(['polygonColor'], 'colorOpt', 'inPolygonColor', { adv: true, when: (P) => !!P.polygon }),
    L(['polygonAlpha'], 'num', 'inPolygonAlpha', { adv: true, when: (P) => !!P.polygon, num: { min: 0, max: 1, step: 0.05 } }),
    L(['progressColor'], 'colorOpt', 'inProgressColor', { adv: true, when: (P) => P.progress !== 'OFF' }),
    L(['progressWidth'], 'num', 'inProgressWidth', { adv: true, when: (P) => P.progress !== 'OFF', num: { min: 0.5, max: 40, step: 0.5, range: [1, 12] } }),
    L(['outlineColor'], 'colorOpt', 'inOutlineColor', { adv: true }),
    L(['litTextColor'], 'colorOpt', 'inLitTextColor', { adv: true, when: (P) => P.nodeShape === 'CIRCLE' }),
    L(['romanStyle'], 'choice', 'inRomanStyle', { adv: true, when: (P) => P.labels === 'DEGREES' || P.chordAs === 'DEGREE', options: ['SUFFIX', 'CASE'], prefix: 'web.ws.inRomanStyle.' }),
    L(['windowSec'], 'num', 'inKeyWindow', { adv: true, when: (P) => P.labels === 'DEGREES' || P.chordAs === 'DEGREE', num: { min: 2, max: 120, step: 1, range: [4, 60] } }),
    L(['glow'], 'num', 'inWheelGlow', { num: { min: 0, max: 1, step: 0.05 } }),
    L(['glowColor'], 'colorOpt', 'inWheelGlowColor', { adv: true, when: (P) => Number(P.glow) > 0 }),
  ],
  // Bảng phân tích (dashboard.ts, T-107/T-109).
  PANEL: [
    L(['number'], 'text', 'pnNumber', { text: { max: 8 } }),
    L(['title'], 'text', 'pnTitle', { text: { max: 60 } }),
    L(['numberColor'], 'colorOpt', 'pnNumberColor'),
    L(['frame'], 'check', 'pnFrame'),
    L(['frameColor'], 'color', 'pnFrameColor', { when: (P) => !!P.frame }),
    ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
      const shown = (P: Obj) => i === 0 || (() => { const s = ((P.stats as Obj[] | undefined) ?? [])[i - 1] ?? {}; return !!(s.label || s.value); })();
      return [
        L(['stats', String(i), 'label'], 'text', 'pnStatLabel', { group: `pnStat${i + 1}`, when: shown, text: { max: 60 } }),
        L(['stats', String(i), 'value'], 'text', 'pnStatValue', { group: `pnStat${i + 1}`, when: shown, text: { max: 120 } }),
      ];
    }),
    L(['frameWidth'], 'num', 'pnFrameWidth', { adv: true, when: (P) => !!P.frame, num: { min: 0, max: 20, step: 0.5, range: [0, 4] } }),
    L(['fillColor'], 'colorOpt', 'pnFillColor', { adv: true, when: (P) => !!P.frame }),
    L(['fillAlpha'], 'num', 'pnFillAlpha', { adv: true, when: (P) => !!P.frame && !!P.fillColor, num: { min: 0, max: 1, step: 0.05 } }),
  ],
  DEGREE: [
    L(['windowBars'], 'num', 'dgWindowBars', { num: { min: 1, max: 64, step: 1, range: [2, 16] } }),
    L(['resolution'], 'choice', 'dgResolution', { options: ['BAR', 'HALF', 'BEAT', 'CHANGE'], prefix: 'web.ws.dgResolution.' }),
    L(['showDetail'], 'check', 'dgShowDetail'),
    L(['showFunction'], 'check', 'dgShowFunction'),
    L(['showBars'], 'check', 'dgShowBars'),
    L(['romanStyle'], 'choice', 'inRomanStyle', { options: ['SUFFIX', 'CASE'], prefix: 'web.ws.inRomanStyle.' }),
    L(['labelAlign'], 'choice', 'dgLabelAlign', { options: ['START', 'CENTER', 'END'], prefix: 'web.ws.dgLabelAlign.' }),
    L(['labelSticky'], 'check', 'dgLabelSticky', { when: (P) => P.labelAlign !== 'END' }),
    L(['showChordName'], 'check', 'dgShowChordName'),
    L(['accentColor'], 'color', 'dgAccent'),
    L(['playheadRatio'], 'num', 'dgPlayhead', { adv: true, num: { min: 0, max: 1, step: 0.01 } }),
    L(['detailColor'], 'color', 'dgDetailColor', { adv: true, when: (P) => !!P.showDetail }),
    L(['blockColor'], 'color', 'dgBlockColor', { adv: true }),
    L(['activeTextColor'], 'color', 'dgActiveText', { adv: true }),
    L(['pastAlpha'], 'num', 'dgPastAlpha', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['tonicColor'], 'color', 'dgTonic', { adv: true, when: (P) => !!P.showFunction }),
    L(['subdominantColor'], 'color', 'dgSubdominant', { adv: true, when: (P) => !!P.showFunction }),
    L(['dominantColor'], 'color', 'dgDominant', { adv: true, when: (P) => !!P.showFunction }),
    L(['playheadColor'], 'colorOpt', 'inPlayheadColor', { adv: true }),
    L(['radius'], 'num', 'radius', { adv: true, num: { min: 0, max: 40, step: 1, range: [0, 16] } }),
    L(['gap'], 'num', 'dgGap', { adv: true, num: { min: 0, max: 40, step: 1, range: [0, 12] } }),
    L(['keyWindowSec'], 'num', 'inKeyWindow', { adv: true, num: { min: 2, max: 120, step: 1, range: [4, 60] } }),
  ],
  // Lưới nốt (noteGrid.ts, D-77): thay Mật độ nốt, Tổng quan bản phối, Lưới chấm. Ô không áp dụng với Hàng theo / Khoảng hiện / Ô sáng theo / Hình ô thì ẩn (D-72).
  NOTE_GRID: [
    L(['rows'], 'choice', 'ngRows', { options: ['TRACK', 'PITCH'], prefix: 'web.ws.ngRows.' }),
    L(['span'], 'choice', 'ngSpan', { options: ['SONG', 'WINDOW'], prefix: 'web.ws.ngSpan.' }),
    L(['light'], 'choice', 'ngLight', { options: ['NOTES', 'DENSITY', 'VELOCITY'], prefix: 'web.ws.ngLight.' }),
    L(['cols'], 'num', 'dtCols', { num: { min: 8, max: 600, step: 1, range: [16, 300] } }),
    L(['grid'], 'choice', 'dtGrid', { when: win, options: [4, 8, 16, 32], prefix: 'web.ws.dtGrid.' }),
    L(['maxRows'], 'num', 'dtMaxRows', { adv: true, num: { min: 1, max: 128, step: 1, range: [4, 64] } }),
    L(['pitchRangeMode'], 'choice', 'dtRange', { when: byPitch, options: ['FIT_CONTENT', 'CUSTOM'], prefix: 'web.ws.dtRange.' }),
    L(['pitchMin'], 'num', 'dtPitchMin', { when: (P) => byPitch(P) && P.pitchRangeMode === 'CUSTOM', num: { min: 0, max: 127, step: 1 } }),
    L(['pitchMax'], 'num', 'dtPitchMax', { when: (P) => byPitch(P) && P.pitchRangeMode === 'CUSTOM', num: { min: 0, max: 127, step: 1 } }),
    L(['shape'], 'choice', 'ngShape', { options: ['FILL', 'SQUARE', 'ROUND', 'BAR'], prefix: 'web.ws.ngShape.' }),
    L(['dotSize'], 'num', 'ngSize', { when: (P) => P.shape !== 'FILL', num: { min: 0.05, max: 1, step: 0.05 } }),
    L(['cellGap'], 'num', 'inCellGap', { adv: true, when: (P) => P.shape === 'FILL' || P.shape === 'BAR', num: { min: 0, max: 10, step: 0.5 } }),
    L(['rowGap'], 'num', 'inRowGap', { adv: true, num: { min: 0, max: 20, step: 1 } }),
    L(['activeScale'], 'num', 'dtActiveScale', { adv: true, when: dotShape, num: { min: 1, max: 3, step: 0.1 } }),
    L(['velocitySize'], 'check', 'dtVelocitySize', { when: dotShape }),
    L(['velocityMin'], 'num', 'dtVelocityMin', { when: (P) => dotShape(P) && !!P.velocitySize, num: { min: 0.05, max: 1, step: 0.05 } }),
    L(['beatLines'], 'check', 'dtBeatLines', { when: win }),
    L(['rowLabels'], 'check', 'ngRowLabels'),
    L(['colorMode'], 'choice', 'inColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
    // Hàng theo cao độ: ô trống không đặt màu thì lấy màu này, nên vẫn hiện khi tô theo track.
    L(['color'], 'color', 'dtColor', { when: (P) => P.colorMode === 'SOLID' || byPitch(P) }),
    L(['minAlpha'], 'num', 'inMinAlpha', { when: (P) => P.light !== 'NOTES', num: { min: 0, max: 1, step: 0.01 } }),
    L(['upcomingAlpha'], 'num', 'inUpcomingAlpha', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['emptyColor'], 'colorOpt', 'ngEmpty', { adv: true }),
    L(['emptyColorB'], 'colorOpt', 'dtEmptyB', { adv: true, when: (P) => !!P.emptyColor }),
    L(['emptyAlpha'], 'num', 'ngEmptyAlpha', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['playheadRatio'], 'num', 'dgPlayhead', { adv: true, when: win, num: { min: 0, max: 1, step: 0.01 } }),
    L(['playheadColor'], 'colorOpt', 'inPlayheadColor'),
    L(['playheadMark'], 'choice', 'ngMark', { when: (P) => !!P.playheadColor, options: ['LINE', 'COLUMN'], prefix: 'web.ws.ngMark.' }),
    L(['playheadWidth'], 'num', 'inPlayheadWidth', { adv: true, when: (P) => !!P.playheadColor, num: { min: 0, max: 20, step: 0.5 } }),
    L(['showPolyphony'], 'check', 'inShowPoly'),
    L(['polyTemplate'], 'text', 'inPolyTemplate', { adv: true, when: (P) => !!P.showPolyphony, text: { max: 200 } }),
  ],
  DRUM_PAD: [
    L(['source'], 'choice', 'inPadSource', { options: ['DRUMS', 'ALL'], prefix: 'web.ws.inPadSource.' }),
    L(['cols'], 'num', 'inPadCols', { num: { min: 1, max: 8, step: 1 } }),
    L(['labels'], 'check', 'inPadLabels'),
    L(['colorMode'], 'choice', 'inColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
    L(['hitColor'], 'color', 'inHitColor', { when: (P) => P.colorMode === 'SOLID' }),
    L(['padColor'], 'color', 'inPadColor', { adv: true }),
    L(['decayMs'], 'num', 'inDecay', { adv: true, num: { min: 50, max: 3000, step: 10, range: [100, 1000] } }),
    L(['maxPads'], 'num', 'inMaxPads', { adv: true, num: { min: 4, max: 32, step: 1 } }),
    L(['gap'], 'num', 'inPadGap', { adv: true, num: { min: 0, max: 40, step: 1 } }),
    L(['radius'], 'num', 'radius', { adv: true, num: { min: 0, max: 100, step: 1, range: [0, 30] } }),
  ],
  SECTION: [
    L(['template'], 'text', 'template', { text: { max: 200 } }),
    L(['showNext'], 'check', 'inShowNext'),
    L(['nextTemplate'], 'text', 'inNextTemplate', { when: (P) => !!P.showNext, text: { max: 200 } }),
    L(['fadeMs'], 'num', 'inFadeIn', { adv: true, num: { min: 0, max: 3000, step: 10, range: [0, 1000] } }),
  ],
  LYRICS: [
    L(['showNext'], 'check', 'inShowNextLine'),
    L(['hideAfterSec'], 'num', 'inHideAfter', { num: { min: 0, max: 60, step: 0.5, range: [0, 15] } }),
    L(['maxChars'], 'num', 'inMaxChars', { adv: true, num: { min: 20, max: 200, step: 1 } }),
    L(['gapSec'], 'num', 'inGapSec', { adv: true, num: { min: 0.5, max: 10, step: 0.1 } }),
  ],
  AUTOMATION: [
    L(['lane'], 'select', 'inLane', { options: ['volume', 'pan'], prefix: 'web.ws.inLane.', lanes: true, testId: 'ws-lane' }),
    L(['windowSec'], 'num', 'inAutoWindow', { num: { min: 0, max: 1800, step: 1, range: [0, 120] } }),
    L(['playheadRatio'], 'num', 'inAutoRatio', { when: (P) => Number(P.windowSec) > 0, num: { min: 0, max: 1, step: 0.05 } }),
    L(['colorMode'], 'choice', 'inColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
    L(['color'], 'color', 'inColor', { when: (P) => P.colorMode === 'SOLID' }),
    L(['fill'], 'check', 'inFill'),
    L(['showValue'], 'check', 'inShowValue'),
    L(['thickness'], 'num', 'thickness', { adv: true, num: { min: 1, max: 20, step: 1, range: [1, 8] } }),
    L(['fillAlpha'], 'num', 'inFillAlpha', { adv: true, when: (P) => !!P.fill, num: { min: 0, max: 1, step: 0.05 } }),
    L(['floorDb'], 'num', 'inFloorDb', { adv: true, when: (P) => P.lane === 'volume', num: { min: -120, max: 24, step: 1, range: [-80, 0] } }),
    L(['ceilDb'], 'num', 'inCeilDb', { adv: true, when: (P) => P.lane === 'volume', num: { min: -120, max: 24, step: 1, range: [-24, 12] } }),
    L(['playheadColor'], 'colorOpt', 'inPlayheadColor', { adv: true }),
  ],
  // Piano Roll: hình thức nốt, dải cao độ, bật bàn phím, vị trí vạch phát ở mục Hình thức (StylePanel); ở đây là phần còn lại (T-58, T-51, T-59, lưới ô nhịp).
  // Hiện vạch phát và bàn phím còn là công tắc ở tiêu đề nhóm Vạch phát/Bàn phím (D-71), cùng thuộc tính với ô tick ở Hình thức.
  PIANO_ROLL: [
    L(['transition'], 'select', 'pianoTransition', { options: NOTE_TRANSITION_NAMES, prefix: 'web.ws.pianoTransition.' }),
    // Hướng chảy (T-59)
    L(['flowAngle'], 'num', 'prFlowAngle', { num: { min: 0, max: 360, step: 1 }, testId: 'ws-pr-angle' }),
    L(['flowMirror'], 'check', 'prFlowMirror'),
    L(['labelsUpright'], 'check', 'prLabelsUpright', { adv: true, when: (P) => Number(P.flowAngle) % 360 !== 0 }),
    // Vạch phát (T-58): công tắc ở tiêu đề nhóm (D-71)
    L(['playheadVisible'], 'check', 'prPhVisible'),
    L(['playheadStyle'], 'select', 'prPhStyle', { when: (P) => !!P.playheadVisible, options: PLAYHEAD_STYLES, prefix: 'web.ws.prPhStyle.', testId: 'ws-pr-ph-style' }),
    L(['playheadWidth'], 'num', 'prPhWidth', { when: (P) => !!P.playheadVisible, num: { min: 0, max: 40, step: 0.5, range: [0, 12] } }),
    L(['playheadColor'], 'color', 'prPhColor', { when: (P) => !!P.playheadVisible }),
    L(['playheadArrows'], 'check', 'prPhArrows', { when: (P) => !!P.playheadVisible }),
    L(['playheadHit'], 'choice', 'prPhHit', { when: (P) => !!P.playheadVisible, options: PLAYHEAD_HITS, prefix: 'web.ws.prPhHit.' }),
    L(['playheadHitMs'], 'num', 'prPhHitMs', { adv: true, when: (P) => !!P.playheadVisible && P.playheadHit !== 'OFF', num: { min: 30, max: 2000, step: 10, range: [50, 800] } }),
    L(['playheadLength'], 'num', 'prPhLength', { adv: true, when: (P) => !!P.playheadVisible, num: { min: 0.05, max: 1, step: 0.05 } }),
    L(['playheadGlow'], 'num', 'prPhGlow', { adv: true, when: (P) => !!P.playheadVisible, num: { min: 0, max: 1, step: 0.05 } }),
    // Bàn phím (T-51): công tắc ở tiêu đề nhóm (D-71)
    L(['keyboard', 'enabled'], 'check', 'prKbOn'),
    L(['keyboard', 'shape'], 'choice', 'prKbShape', { when: kbOn, options: KEYBOARD_SHAPES, prefix: 'web.ws.prKbShape.' }),
    L(['keyboard', 'labels'], 'select', 'prKbLabels', { when: kbOn, options: KEY_LABEL_MODES, prefix: 'web.ws.prKbLabels.', testId: 'ws-pr-kb-labels' }),
    L(['keyboard', 'labelOctave'], 'check', 'prKbLabelOctave', { when: (P) => kbOn(P) && kb(P).labels !== 'NONE' }),
    L(['keyboard', 'labelColor'], 'colorOpt', 'prKbLabelColor', { adv: true, when: (P) => kbOn(P) && kb(P).labels !== 'NONE' }),
    L(['keyboard', 'scale'], 'select', 'prKbScale', { when: kbOn, options: KEYBOARD_SCALES, prefix: 'web.ws.prKbScale.' }),
    L(['keyboard', 'scaleColor'], 'color', 'prKbScaleColor', { when: (P) => kbOn(P) && kb(P).scale !== 'OFF' }),
    L(['keyboard', 'scaleOpacity'], 'num', 'prKbScaleOpacity', { adv: true, when: (P) => kbOn(P) && kb(P).scale !== 'OFF', num: { min: 0, max: 1, step: 0.05 } }),
    L(['keyboard', 'useTrackColor'], 'check', 'prKbTrackColor', { when: kbOn }),
    L(['keyboard', 'pressedColor'], 'color', 'prKbPressed', { when: (P) => kbOn(P) && !kb(P).useTrackColor }),
    L(['keyboard', 'whiteColor'], 'color', 'prKbWhite', { adv: true, when: kbOn }),
    L(['keyboard', 'blackColor'], 'color', 'prKbBlack', { adv: true, when: kbOn }),
    // Lưới ô nhịp
    L(['grid', 'bars'], 'check', 'prGridBars', { testId: 'ws-pr-grid-bars' }),
    L(['grid', 'beats'], 'check', 'prGridBeats'),
    L(['grid', 'numbers'], 'check', 'prGridNumbers'),
    L(['grid', 'color'], 'color', 'prGridColor', { when: gridOn }),
    L(['grid', 'opacity'], 'num', 'prGridOpacity', { when: gridOn, num: { min: 0, max: 1, step: 0.05 } }),
  ],
  // Ảnh của phiên (T-21): chọn ảnh/SVG, cách khớp; sprite sheet (lưới, số khung, tốc độ) ở Nâng cao.
  IMAGE: [
    L(['asset'], 'asset', 'imgAsset', { testId: 'ws-img-asset' }),
    L(['fit'], 'choice', 'imgFit', { options: ['contain', 'cover', 'stretch'], prefix: 'web.ws.imgFit.' }),
    L(['smooth'], 'check', 'imgSmooth', { adv: true }),
    L(['cols'], 'num', 'imgCols', { adv: true, num: { min: 1, max: 64, step: 1 } }),
    L(['rows'], 'num', 'imgRows', { adv: true, num: { min: 1, max: 64, step: 1 } }),
    L(['frames'], 'num', 'imgFrames', { adv: true, when: (P) => Number(P.cols) * Number(P.rows) > 1, num: { min: 1, max: 4096, step: 1 } }),
    L(['fps'], 'num', 'imgFps', { adv: true, when: (P) => Number(P.cols) * Number(P.rows) > 1, num: { min: 0, max: 120, step: 1, range: [0, 60] } }),
    L(['loop'], 'check', 'imgLoop', { adv: true, when: (P) => Number(P.cols) * Number(P.rows) > 1 }),
  ],
  TEXT: [
    L(['text'], 'text', 'boxText', { text: { max: 2000, multiline: true } }),
    // Text animator (T-35): hiện các ô khi bật; trạng thái "từ" chỉ khi hiệu ứng Tuỳ chỉnh.
    L(['animator', 'enabled'], 'check', 'taOn', { testId: 'ws-ta-on' }),
    L(['animator', 'effect'], 'select', 'taEffect', { when: taOn, options: ANIM_EFFECTS, prefix: 'web.ws.taEffect.', testId: 'ws-ta-effect' }),
    L(['animator', 'unit'], 'choice', 'taUnit', { when: taOn, options: ANIM_UNITS, prefix: 'web.ws.taUnit.' }),
    L(['animator', 'order'], 'select', 'taOrder', { when: taOn, options: ANIM_ORDERS, prefix: 'web.ws.taOrder.' }),
    L(['animator', 'direction'], 'choice', 'taDir', { when: taOn, options: ['in', 'out'], prefix: 'web.ws.taDir.' }),
    L(['animator', 'start'], 'num', 'taStart', { when: taOn, num: { min: 0, max: 86400, step: 0.1, range: [0, 60] } }),
    L(['animator', 'duration'], 'num', 'taDuration', { when: (P) => taOn(P) && ta(P).effect !== 'typewriter', num: { min: 0, max: 30, step: 0.05, range: [0, 3] } }),
    L(['animator', 'stagger'], 'num', 'taStagger', { when: taOn, num: { min: 0, max: 10, step: 0.01, range: [0, 0.5] } }),
    L(['animator', 'ease'], 'select', 'taEase', { adv: true, when: (P) => taOn(P) && ta(P).effect !== 'typewriter', options: EASING_NAMES, raw: true }),
    L(['animator', 'fromOpacity'], 'num', 'taFromOpacity', { when: taCustom, num: { min: 0, max: 1, step: 0.05 } }),
    L(['animator', 'fromX'], 'num', 'taFromX', { when: taCustom, num: { min: -2000, max: 2000, step: 1, range: [-200, 200] } }),
    L(['animator', 'fromY'], 'num', 'taFromY', { when: taCustom, num: { min: -2000, max: 2000, step: 1, range: [-200, 200] } }),
    L(['animator', 'fromScale'], 'num', 'taFromScale', { when: taCustom, num: { min: 0, max: 10, step: 0.05, range: [0, 3] } }),
    L(['animator', 'fromColor'], 'colorOpt', 'taFromColor', { when: taCustom }),
    L(['animator', 'countUp'], 'check', 'taCount', { when: taOn }),
    L(['animator', 'seed'], 'num', 'taSeed', { adv: true, when: (P) => taOn(P) && ta(P).order === 'random', num: { min: 0, max: 1e9, step: 1, range: [0, 100] } }),
  ],
  // Bản nhạc (D-63): nhóm "bản nhạc" (đổi thì dựng lại, vài trăm ms) rồi nhóm "hình vẽ" (đổi ngay).
  NOTATION: [
    L(['musicFont'], 'select', 'ntFont', { options: ['BRAVURA', 'PETALUMA', 'GONVILLE'], prefix: 'web.ws.ntFont.' }),
    L(['barsPerSystem'], 'num', 'ntBars', { num: { min: 0, max: 8, step: 1 } }),
    L(['systemsPerPage'], 'num', 'ntSystems', { num: { min: 1, max: 4, step: 1 } }),
    L(['inkColor'], 'color', 'ntInk'),
    L(['activeColor'], 'color', 'ntActive', { when: (P) => P.colorMode === 'SOLID' }),
    L(['colorMode'], 'choice', 'ntColorMode', { options: ['SOLID', 'TRACK'], prefix: 'web.ws.ntColorMode.' }),
    L(['zoom'], 'num', 'ntZoom', { num: { min: 1, max: 3, step: 0.05, range: [1, 2] } }),
    L(['glow'], 'num', 'ntGlow', { num: { min: 0, max: 1, step: 0.05 } }),
    L(['playhead'], 'choice', 'ntPlayhead', { options: ['NONE', 'LINE'], prefix: 'web.ws.ntPlayhead.' }),
    L(['opacity'], 'num', 'ntOpacity', { num: { min: 0, max: 1, step: 0.05 } }),
    L(['rough'], 'num', 'ntRough', { num: { min: 0, max: 6, step: 0.1, range: [0, 4] } }),
    L(['aura'], 'select', 'ntAura', { options: ['OFF', 'STEADY', 'BEAT', 'BAR', 'TIME'], prefix: 'web.ws.ntAura.' }),
    L(['auraEvery'], 'num', 'ntAuraEveryBeat', { when: (P) => P.aura === 'BEAT', num: { min: 0.25, max: 64, step: 0.25, range: [0.25, 8] } }),
    L(['auraEvery'], 'num', 'ntAuraEveryBar', { when: (P) => P.aura === 'BAR', num: { min: 0.25, max: 64, step: 0.25, range: [0.25, 8] } }),
    L(['auraEvery'], 'num', 'ntAuraEveryTime', { when: (P) => P.aura === 'TIME', num: { min: 0.25, max: 64, step: 0.25, range: [0.25, 16] } }),
    L(['auraShape'], 'choice', 'ntAuraShape', { when: (P) => P.aura === 'BEAT' || P.aura === 'BAR' || P.aura === 'TIME', options: ['SMOOTH', 'FLASH', 'BLINK'], prefix: 'web.ws.ntAuraShape.' }),
    // Viết tay từng nốt và xoá nốt (T-132)
    L(['reveal'], 'choice', 'ntReveal', { options: ['NONE', 'WRITE'], prefix: 'web.ws.ntReveal.' }),
    L(['writeMs'], 'num', 'ntWriteMs', { when: (P) => P.reveal === 'WRITE', num: { min: 20, max: 5000, step: 10, range: [50, 1000] } }),
    L(['erase'], 'select', 'ntErase', { options: ['NONE', 'AFTER', 'RANDOM'], prefix: 'web.ws.ntErase.' }),
    L(['eraseAmount'], 'num', 'ntEraseAmount', { when: (P) => P.erase === 'RANDOM', num: { min: 0, max: 1, step: 0.05 } }),
    L(['eraseAfterBars'], 'num', 'ntEraseAfter', { when: (P) => P.erase !== 'NONE', num: { min: 0, max: 64, step: 0.25, range: [0, 8] } }),
    L(['eraseStyle'], 'choice', 'ntEraseStyle', { when: (P) => P.erase !== 'NONE', options: ['FADE', 'WIPE'], prefix: 'web.ws.ntEraseStyle.' }),
    L(['division'], 'select', 'ntDivision', { adv: true, options: [8, 16, 32], prefix: 'web.ws.ntDivision.' }),
    L(['triplets'], 'check', 'ntTriplets', { adv: true }),
    L(['simplify'], 'num', 'ntSimplify', { adv: true, num: { min: 0.5, max: 4, step: 0.1 } }),
    L(['voices'], 'choice', 'ntVoices', { adv: true, options: [1, 2], prefix: 'web.ws.ntVoices.' }),
    L(['splitPitch'], 'num', 'ntSplit', { adv: true, num: { min: 21, max: 108, step: 1 } }),
    L(['keyMode'], 'choice', 'ntKeyMode', { adv: true, options: ['AUTO', 'MANUAL'], prefix: 'web.ws.ntKeyMode.' }),
    L(['keyFifths'], 'select', 'ntKey', { adv: true, when: (P) => P.keyMode === 'MANUAL', options: [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7], prefix: 'web.ws.ntKey.' }),
    L(['keyMinor'], 'check', 'ntKeyMinor', { adv: true, when: (P) => P.keyMode === 'MANUAL' }),
    L(['measureNumbers'], 'check', 'ntMeasureNumbers', { adv: true }),
    L(['measureNumberSize'], 'num', 'ntMeasureNumberSize', { adv: true, when: (P) => !!P.measureNumbers, num: { min: 0.5, max: 4, step: 0.1, range: [0.5, 3] } }),
    L(['tempoMark'], 'check', 'ntTempoMark', { adv: true }),
    L(['playedColor'], 'color', 'ntPlayed', { adv: true }),
    L(['playedOpacity'], 'num', 'ntPlayedOpacity', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['staticOpacity'], 'num', 'ntStaticOpacity', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['upcomingOpacity'], 'num', 'ntUpcomingOpacity', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['zoomMode'], 'choice', 'ntZoomMode', { adv: true, when: (P) => Number(P.zoom) > 1, options: ['PULSE', 'HOLD'], prefix: 'web.ws.ntZoomMode.' }),
    L(['zoomMs'], 'num', 'ntZoomMs', { adv: true, when: (P) => Number(P.zoom) > 1 && P.zoomMode === 'PULSE', num: { min: 20, max: 3000, step: 10, range: [50, 1000] } }),
    L(['glowSize'], 'num', 'ntGlowSize', { adv: true, when: (P) => Number(P.glow) > 0, num: { min: 0, max: 20, step: 0.5, range: [0, 10] } }),
    L(['glowMode'], 'choice', 'ntGlowMode', { adv: true, when: (P) => Number(P.glow) > 0, options: ['HALO', 'SOFT'], prefix: 'web.ws.ntGlowMode.' }),
    L(['playheadColor'], 'color', 'ntPlayheadColor', { adv: true, when: (P) => P.playhead === 'LINE' }),
    L(['playheadWidth'], 'num', 'ntPlayheadWidth', { adv: true, when: (P) => P.playhead === 'LINE', num: { min: 0, max: 40, step: 0.5, range: [0, 8] } }),
    L(['boilFps'], 'num', 'ntBoil', { adv: true, when: (P) => Number(P.rough) > 0, num: { min: 0, max: 24, step: 1 } }),
    L(['seed'], 'num', 'ntSeed', { adv: true, when: (P) => Number(P.rough) > 0, num: { min: 0, max: 999999, step: 1 } }),
    L(['align'], 'choice', 'ntAlign', { adv: true, options: ['TOP', 'CENTER'], prefix: 'web.ws.ntAlign.' }),
    L(['pageFadeMs'], 'num', 'ntPageFade', { adv: true, num: { min: 0, max: 2000, step: 10, range: [0, 1000] } }),
    L(['auraGlow'], 'num', 'ntAuraGlow', { adv: true, when: (P) => P.aura !== 'OFF', num: { min: 0, max: 1, step: 0.05 } }),
    L(['auraMin'], 'num', 'ntAuraMin', { adv: true, when: (P) => P.aura === 'BEAT' || P.aura === 'BAR' || P.aura === 'TIME', num: { min: 0, max: 1, step: 0.05 } }),
    L(['auraColor'], 'colorOpt', 'ntAuraColor', { adv: true, when: (P) => P.aura !== 'OFF' }),
    L(['eraseMs'], 'num', 'ntEraseMs', { adv: true, when: (P) => P.erase !== 'NONE', num: { min: 20, max: 5000, step: 10, range: [50, 2000] } }),
    L(['eraseSeed'], 'num', 'ntEraseSeed', { adv: true, when: (P) => P.erase === 'RANDOM', num: { min: 0, max: 999999, step: 1 } }),
  ],
};


/** Nhóm thiết lập theo loại widget (D-71). Loại chưa có ở đây: một danh sách phẳng như trước. Ô không thuộc nhóm nào đứng đầu, không tiêu đề. */
export const WIDGET_SECTIONS: Readonly<Partial<Record<WidgetType, readonly SectionDef[]>>> = {
  TIME_BAR: [
    SEC('time', ['time.enabled', 'time.format', 'time.label', 'timeGroups.0', 'timeGroups.1', 'timeGroups.2'], { head: 'time.enabled' }),
    SEC('beat', ['beat.enabled', 'beat.format', 'beat.label', 'beatGroups.0', 'beatGroups.1', 'beatGroups.2'], { head: 'beat.enabled' }),
    SEC('bar', ['showBars', 'barLength', 'barThickness', 'barColor', 'barTrackColor'], { head: 'showBars' }),
  ],
  PARTICLES: [
    SEC('emit', ['perNote', 'velocityScale', 'maxParticles', 'seed']),
    SEC('motion', ['life', 'speed', 'speedSpread', 'angle', 'spread', 'gravity']),
    SEC('size', ['sizeStart', 'sizeEnd', 'shape']),
    SEC('colour', ['colorMode', 'color', 'opacity', 'fade', 'glow']),
    SEC('origin', ['originX', 'originY', 'pitchMin', 'pitchMax']),
  ],
  TEMPO_INFO: [
    SEC('curve', ['showCurve', 'curveHeight', 'curveColor'], { head: 'showCurve' }),
    SEC('flash', ['flash', 'flashColor', 'flashMs'], { head: 'flash' }),
  ],
  AUDIO_SPECTRUM: [
    SEC('style', ['style', 'bars', 'scale', 'scopeMs']),
    SEC('geometry', ['shape', 'angle', 'length', 'radius', 'startAngle', 'thickness', 'mirror', 'reverse']),
    SEC('columns', ['barWidth', 'roundness', 'minLen']),
    SEC('peaks', ['peakCap', 'capFall', 'peakStyle', 'peakHold', 'peakGravity', 'peakColor'], { head: 'peakCap' }),
    SEC('colour', ['color', 'colorMode', 'colorB', 'playedColor', 'opacity', 'glow']),
    SEC('response', ['attackMs', 'releaseMs', 'floorDb', 'ceilDb', 'minHz', 'maxHz']),
  ],
  PIANO_ROLL: [
    SEC('flow', ['flowAngle', 'flowMirror', 'labelsUpright']),
    SEC('playhead', ['playheadVisible', 'playheadStyle', 'playheadWidth', 'playheadColor', 'playheadArrows', 'playheadHit', 'playheadHitMs', 'playheadLength', 'playheadGlow'], { head: 'playheadVisible' }),
    SEC('keyboard', ['keyboard.enabled', 'keyboard.shape', 'keyboard.labels', 'keyboard.labelOctave', 'keyboard.labelColor', 'keyboard.scale', 'keyboard.scaleColor', 'keyboard.scaleOpacity',
      'keyboard.useTrackColor', 'keyboard.pressedColor', 'keyboard.whiteColor', 'keyboard.blackColor'], { head: 'keyboard.enabled' }),
    SEC('grid', ['grid.bars', 'grid.beats', 'grid.numbers', 'grid.color', 'grid.opacity']),
  ],
  DEGREE: [
    SEC('labels', ['labelAlign', 'labelSticky', 'showChordName']),
    SEC('detail', ['showDetail', 'detailColor'], { head: 'showDetail' }),
    SEC('function', ['showFunction', 'tonicColor', 'subdominantColor', 'dominantColor'], { head: 'showFunction' }),
    SEC('colour', ['accentColor', 'blockColor', 'activeTextColor', 'pastAlpha']),
    SEC('blocks', ['radius', 'gap']),
    SEC('playhead', ['playheadRatio', 'playheadColor']),
  ],
  PANEL: [
    SEC('frame', ['frame', 'frameColor', 'frameWidth', 'fillColor', 'fillAlpha'], { head: 'frame' }),
    SEC('stats', [0, 1, 2, 3, 4, 5].flatMap((i) => [`stats.${i}.label`, `stats.${i}.value`])),
  ],
  VELOCITY: [
    SEC('colour', ['colorMode', 'color', 'trackColor']),
    SEC('columns', ['gap', 'radius']),
  ],
  NOTE_GRID: [
    SEC('range', ['pitchRangeMode', 'pitchMin', 'pitchMax']),
    SEC('cells', ['shape', 'dotSize', 'cellGap', 'rowGap', 'activeScale', 'velocitySize', 'velocityMin']),
    SEC('grid', ['beatLines'], { head: 'beatLines' }),
    SEC('labels', ['rowLabels'], { head: 'rowLabels' }),
    SEC('colour', ['colorMode', 'color', 'minAlpha', 'upcomingAlpha', 'emptyColor', 'emptyColorB', 'emptyAlpha']),
    SEC('playhead', ['playheadRatio', 'playheadColor', 'playheadMark', 'playheadWidth']),
    SEC('polyphony', ['showPolyphony', 'polyTemplate'], { head: 'showPolyphony' }),
  ],
  DRUM_PAD: [
    SEC('colour', ['colorMode', 'hitColor', 'padColor']),
    SEC('pads', ['gap', 'radius']),
  ],
  AUTOMATION: [
    SEC('colour', ['colorMode', 'color', 'playheadColor']),
    SEC('fill', ['fill', 'fillAlpha'], { head: 'fill' }),
  ],
  KEY_SCALE: [
    SEC('confidence', ['showConfidence', 'confTemplate'], { head: 'showConfidence' }),
  ],
  LIVE_TRIGGER: [
    SEC('trackName', ['showTrack', 'trackTemplate'], { head: 'showTrack' }),
  ],
  EVENT_COUNTER: [
    ...LINES.map((k) => SEC(`line${k[0].toUpperCase()}${k.slice(1)}`, [`lines.${k}.enabled`, `lines.${k}.template`], { head: `lines.${k}.enabled` })),
    SEC('format', ['decimals', 'lineHeight']),
  ],
  IMAGE: [
    SEC('sprite', ['cols', 'rows', 'frames', 'fps', 'loop']),
  ],
  BAR_BEAT: [
    SEC('dots', ['dots', 'pulse', 'dotActiveColor', 'dotColor', 'dotSize'], { head: 'dots' }),
  ],
  PITCH_WHEEL: [
    SEC('ring', ['order', 'nodeShape', 'ring', 'beatMarks']),
    SEC('labels', ['showNames', 'labels', 'romanStyle', 'windowSec'], { head: 'showNames' }),
    SEC('chord', ['showChord', 'chordAs'], { head: 'showChord' }),
    SEC('colour', ['litColor', 'dimColor', 'dimAlpha', 'rootColor', 'outlineColor', 'litTextColor']),
    SEC('glow', ['glow', 'glowColor']),
    SEC('polygon', ['polygon', 'polygonColor', 'polygonAlpha'], { head: 'polygon' }),
    SEC('progress', ['progress', 'progressColor', 'progressWidth'], { head: 'progress', on: (P) => P.progress !== 'OFF' }),
  ],
  TEXT: [
    SEC('animator', ['animator.enabled', 'animator.effect', 'animator.unit', 'animator.order', 'animator.direction', 'animator.start', 'animator.duration', 'animator.stagger', 'animator.ease',
      'animator.fromOpacity', 'animator.fromX', 'animator.fromY', 'animator.fromScale', 'animator.fromColor', 'animator.countUp', 'animator.seed'], { head: 'animator.enabled' }),
  ],
  NOTATION: [
    SEC('score', ['musicFont', 'barsPerSystem', 'systemsPerPage', 'division', 'triplets', 'simplify', 'voices', 'splitPitch', 'keyMode', 'keyFifths', 'keyMinor',
      'measureNumbers', 'measureNumberSize', 'tempoMark', 'align', 'pageFadeMs']),
    SEC('colour', ['colorMode', 'inkColor', 'activeColor', 'playedColor', 'opacity', 'playedOpacity', 'staticOpacity', 'upcomingOpacity']),
    SEC('zoom', ['zoom', 'zoomMode', 'zoomMs']),
    SEC('glow', ['glow', 'glowSize', 'glowMode']),
    SEC('aura', ['aura', 'auraEvery', 'auraShape', 'auraGlow', 'auraMin', 'auraColor'], { head: 'aura', on: (P) => P.aura !== 'OFF' }),
    SEC('playhead', ['playhead', 'playheadColor', 'playheadWidth'], { head: 'playhead', on: (P) => P.playhead !== 'NONE' }),
    SEC('reveal', ['reveal', 'writeMs'], { head: 'reveal', on: (P) => P.reveal !== 'NONE' }),
    SEC('erase', ['erase', 'eraseAmount', 'eraseAfterBars', 'eraseStyle', 'eraseMs', 'eraseSeed'], { head: 'erase', on: (P) => P.erase !== 'NONE' }),
    SEC('rough', ['rough', 'boilFps', 'seed']),
  ],
};

/** Một nhóm khi vẽ: `sec` vắng = các ô không thuộc nhóm nào (đứng đầu, không tiêu đề). */
export interface FieldGroup { sec?: SectionDef; head?: FieldDef; fields: FieldDef[] }
/** Chia ô của loại widget thành nhóm theo WIDGET_SECTIONS (ô ngoài nhóm đứng đầu). Thứ tự ô trong nhóm theo WIDGET_FIELDS. */
export function fieldGroups(type: WidgetType): FieldGroup[] {
  const fields = WIDGET_FIELDS[type] ?? [], secs = WIDGET_SECTIONS[type] ?? [];
  const owner = new Map<string, SectionDef>();
  for (const s of secs) for (const p of s.fields) owner.set(p, s);
  const loose = fields.filter((f) => !owner.has(f.path.join('.')));
  const out: FieldGroup[] = loose.length ? [{ fields: loose }] : [];
  for (const s of secs) {
    const mine = fields.filter((f) => owner.get(f.path.join('.')) === s);
    if (!mine.length) continue;
    const head = s.head ? mine.find((f) => f.path.join('.') === s.head) : undefined;
    out.push({ sec: s, head, fields: mine.filter((f) => f !== head) });
  }
  return out;
}
/** Nhóm của một đường dẫn thuộc tính (id nhóm), nếu loại widget có khai báo nhóm. */
export const sectionOf = (type: WidgetType, path: string): string | undefined => (WIDGET_SECTIONS[type] ?? []).find((s) => s.fields.includes(path))?.id;
/** Nhóm đang bật theo thuộc tính hiện tại (nhóm không có công tắc luôn bật). */
export function sectionOn(s: SectionDef, P: Obj): boolean {
  if (s.on) return s.on(P);
  return s.head ? !!getIn(P, s.head.split('.')) : true;
}

/** Thuộc tính KHÔNG nằm ở mục Thiết lập (kiểu chữ, căn lề ở mục Chữ; vài thuộc tính chưa có giao diện). Test dùng để bắt thiết lập bị bỏ sót. */
export const SETTINGS_EXEMPT: Readonly<Record<string, readonly string[]>> = {
  TRACK_INFO: ['align', 'titleStyle', 'artistStyle'],
  EVENT_COUNTER: ['align', 'style', 'valueStyle'],
  LIVE_TRIGGER: ['align', 'style', 'valueStyle'],
  TIME_BAR: ['style', 'labelStyle'],
  CHORD_DETECTION: ['align', 'nameStyle', 'bassStyle', 'notesStyle', 'notesValueStyle'],
  PROGRESS_BAR: ['timeStyle', 'timeValueStyle', 'timeAlign'],
  TEXT: ['align', 'style', 'valueStyle'],
  TEMPO_INFO: ['align', 'style'],
  BAR_BEAT: ['align', 'style'],
  KEY_SCALE: ['align', 'nameStyle', 'confStyle'],
  PITCH_WHEEL: ['nameStyle', 'chordStyle', 'subStyle'],
  PANEL: ['titleStyle', 'labelStyle', 'valueStyle'],
  DEGREE: ['labelStyle', 'smallStyle'],
  NOTE_GRID: ['polyStyle', 'labelStyle'],
  DRUM_PAD: ['labelStyle'],
  SECTION: ['align', 'style', 'nextStyle'],
  LYRICS: ['align', 'style', 'unsungStyle', 'nextStyle'],
  AUTOMATION: ['valueStyle'],
};

export const hasWidgetFields = (type: string): boolean => !!WIDGET_FIELDS[type as WidgetType]?.length;

export function getIn(o: unknown, path: readonly string[]): unknown {
  let v = o;
  for (const k of path) { if (typeof v !== 'object' || v === null) return undefined; v = (v as Obj)[k]; }
  return v;
}
/** Bản sao có giá trị mới ở `path` (các cấp trên đường đi được sao chép, phần còn lại dùng chung). Chỉ số mảng viết là chuỗi số: ['timeGroups', '0']. */
export function setIn<T extends Obj | unknown[]>(o: T, path: readonly string[], value: unknown): T {
  const [k, ...rest] = path;
  const child = (o as Obj)[k];
  const next = rest.length ? setIn((child ?? {}) as Obj, rest, value) : value;
  if (Array.isArray(o)) { const a = o.slice(); a[Number(k)] = next; return a as T; }
  return { ...(o as Obj), [k]: next } as T;
}
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Giá trị đang khác mốc tham chiếu (có mốc để quay về). */
export function fieldChanged(f: FieldDef, P: Obj, R: Obj | undefined): boolean {
  if (!R) return false;
  const ref = getIn(R, f.path);
  return ref !== undefined && !same(getIn(P, f.path), ref);
}
/** Bản vá `properties` đưa thiết lập về mốc tham chiếu (một khoá cấp trên cùng, đúng dạng `patchWidgetProps`). */
export function resetPatch(f: FieldDef, P: Obj, R: Obj): Obj {
  const top = f.path[0];
  return { [top]: setIn(P, f.path, getIn(R, f.path))[top] };
}
/** Có thiết lập nâng cao nào của widget khác mốc không (không tính điều kiện hiện, để chấm báo "đã chỉnh nâng cao" không phụ thuộc trạng thái ẩn). */
export function advancedEdited(widget: Pick<WidgetSpec, 'type' | 'trackMappingMode'>, P: Obj, R: Obj | undefined): boolean {
  const adv = (WIDGET_FIELDS[widget.type] ?? []).some((f) => f.adv && fieldChanged(f, P, R));
  return adv || (widget.type !== 'TEXT' && widget.type !== 'NOTATION' && TRACK_WIDGETS.includes(widget.type) && widget.trackMappingMode === 'MANUAL');
}
/** Widget đọc số liệu từ các track nên có mục chọn track (Ô chữ ở Cơ bản, còn lại ở Nâng cao). */
export const TRACK_WIDGETS: readonly string[] = ['TEXT', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'CHORD_DETECTION', 'PARTICLES', 'NOTATION', 'KEY_SCALE', 'VELOCITY', 'PITCH_WHEEL', 'DRUM_PAD', 'AUTOMATION', 'PANEL', 'DEGREE', 'NOTE_GRID'];
