// Bảng khai báo mục Thiết lập của từng loại widget (T-73 bổ sung, REQ-UI-13/15, D-57): MỖI thiết lập khai báo MỘT lần ở đây;
// `WidgetSettings` vẽ điều khiển, nút ↺ và dấu "đã chỉnh nâng cao" từ chính bảng này, nên thêm một thiết lập mới là tự có ↺
// (test `widgetFields.test.ts` bắt thiết lập có trong mặc định mà thiếu trong bảng). Hàm thuần, không DOM.
import { NOTE_TRANSITION_NAMES, type WidgetSpec, type WidgetType } from '@dawviz/render-core';
import { ANIM_EFFECTS, ANIM_ORDERS, ANIM_UNITS, DEFAULT_TEXT_ANIMATOR, EASING_NAMES, SPECTRUM_STYLES } from '@dawviz/render-core';
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

const L = (path: string[], kind: FieldKind, label: string, rest: Partial<FieldDef> = {}): FieldDef => ({ path, kind, label, ...rest });
/** Kiểu phổ đọc dải tần tại t (cột, vùng, đường, chấm). */
const spectral = (P: Obj) => P.style === undefined || ['BARS', 'AREA', 'LINE', 'DOTS'].includes(P.style as string);
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
    L(['lineHeight'], 'num', 'lineHeight', { adv: true, num: { min: 1, max: 3, step: 0.05 } }),
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
    L(['notesTemplate'], 'text', 'notesTemplate', { adv: true }),
  ],
  AUDIO_SPECTRUM: [
    L(['style'], 'select', 'spStyle', { options: SPECTRUM_STYLES, prefix: 'web.ws.spStyle.', testId: 'ws-sp-style' }),
    L(['shape'], 'choice', 'spShape', { options: ['LINE', 'CIRCLE'], prefix: 'web.ws.shape.', testId: 'ws-sp-shape' }),
    L(['bars'], 'num', 'spBars', { when: (P) => P.style !== 'OSCILLOSCOPE' && P.style !== 'METER', num: { min: 8, max: 256, step: 1 } }),
    L(['scale'], 'choice', 'spScale', { adv: true, when: (P) => spectral(P), options: ['LOG', 'LINEAR', 'MEL'], prefix: 'web.ws.spScale.' }),
    L(['peakCap'], 'check', 'spPeakCap', { when: (P) => P.style === 'BARS' || P.style === 'DOTS' }),
    L(['capFall'], 'num', 'spCapFall', { adv: true, when: (P) => (P.style === 'BARS' || P.style === 'DOTS') && !!P.peakCap, num: { min: 0.05, max: 10, step: 0.05, range: [0.1, 3] } }),
    L(['scopeMs'], 'num', 'spScopeMs', { when: (P) => P.style === 'OSCILLOSCOPE', num: { min: 5, max: 500, step: 1, range: [5, 100] } }),
    L(['playedColor'], 'color', 'spPlayed', { when: (P) => P.style === 'WAVEFORM' || P.style === 'METER' }),
    L(['angle'], 'num', 'spAngle', { when: (P) => P.shape === 'LINE', num: { min: -360, max: 360, step: 1, range: [-180, 180] } }),
    L(['length'], 'num', 'spLength', { when: (P) => P.shape === 'LINE', num: { min: 16, max: 8192, step: 1, range: [100, 1920] } }),
    L(['radius'], 'num', 'spRadius', { when: (P) => P.shape === 'CIRCLE', num: { min: 0, max: 4096, step: 1, range: [20, 600] } }),
    L(['thickness'], 'num', 'spThickness', { num: { min: 1, max: 4096, step: 1, range: [10, 600] } }),
    L(['color'], 'color', 'spColor'),
    L(['mirror'], 'check', 'spMirror', { adv: true }),
    L(['reverse'], 'check', 'spReverse', { adv: true }),
    L(['startAngle'], 'num', 'spStartAngle', { adv: true, when: (P) => P.shape === 'CIRCLE', num: { min: -360, max: 360, step: 1, range: [-180, 180] } }),
    L(['colorMode'], 'choice', 'spColorMode', { adv: true, options: ['SOLID', 'GRADIENT'], prefix: 'web.ws.colorMode.' }),
    L(['colorB'], 'color', 'spColorB', { adv: true, when: (P) => P.colorMode === 'GRADIENT' }),
    L(['barWidth'], 'num', 'spBarWidth', { adv: true, num: { min: 0.1, max: 1, step: 0.05 } }),
    L(['roundness'], 'num', 'spRoundness', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['minLen'], 'num', 'spMinLen', { adv: true, num: { min: 0, max: 100, step: 1, range: [0, 20] } }),
    L(['minHz'], 'num', 'spMinHz', { adv: true, num: { min: 20, max: 20000, step: 10, range: [20, 2000] } }),
    L(['maxHz'], 'num', 'spMaxHz', { adv: true, num: { min: 20, max: 20000, step: 100, range: [1000, 20000] } }),
    L(['attackMs'], 'num', 'spAttack', { adv: true, num: { min: 0, max: 1000, step: 5, range: [0, 300] } }),
    L(['releaseMs'], 'num', 'spRelease', { adv: true, num: { min: 0, max: 3000, step: 10, range: [0, 1000] } }),
    L(['floorDb'], 'num', 'spFloorDb', { adv: true, num: { min: -80, max: -10, step: 1 } }),
    L(['ceilDb'], 'num', 'spCeilDb', { adv: true, num: { min: -60, max: 0, step: 1 } }),
    L(['opacity'], 'num', 'spOpacity', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['glow'], 'num', 'spGlow', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
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
    L(['curveHeight'], 'num', 'inCurveHeight', { num: { min: 8, max: 400, step: 1, range: [8, 120] } }),
    L(['curveColor'], 'color', 'inCurveColor'),
    L(['flash'], 'check', 'inFlash'),
    L(['flashColor'], 'color', 'inFlashColor', { adv: true }),
    L(['flashMs'], 'num', 'inFlashMs', { adv: true, num: { min: 50, max: 3000, step: 10, range: [50, 1500] } }),
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
    L(['colorMode'], 'choice', 'inColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
    L(['color'], 'color', 'inColor', { when: (P) => P.colorMode === 'SOLID' || P.mode === 'HISTOGRAM' }),
    L(['bins'], 'num', 'inBins', { adv: true, when: (P) => P.mode === 'HISTOGRAM', num: { min: 4, max: 16, step: 1 } }),
    L(['gap'], 'num', 'inGap', { adv: true, num: { min: 0, max: 40, step: 1, range: [0, 16] } }),
    L(['trackColor'], 'colorOpt', 'inBackColor', { adv: true }),
    L(['radius'], 'num', 'radius', { adv: true, num: { min: 0, max: 50, step: 1, range: [0, 12] } }),
  ],
  DENSITY: [
    L(['cols'], 'num', 'inCols', { num: { min: 16, max: 400, step: 4, range: [32, 200] } }),
    L(['colorMode'], 'choice', 'inColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
    L(['color'], 'color', 'inColor', { when: (P) => P.colorMode === 'SOLID' }),
    L(['showPolyphony'], 'check', 'inShowPoly'),
    L(['polyTemplate'], 'text', 'inPolyTemplate', { adv: true, when: (P) => !!P.showPolyphony, text: { max: 200 } }),
    L(['minAlpha'], 'num', 'inMinAlpha', { adv: true, num: { min: 0, max: 1, step: 0.01 } }),
    L(['playheadColor'], 'colorOpt', 'inPlayheadColor', { adv: true }),
    L(['rowGap'], 'num', 'inRowGap', { adv: true, num: { min: 0, max: 20, step: 1 } }),
    L(['cellGap'], 'num', 'inCellGap', { adv: true, num: { min: 0, max: 10, step: 0.5 } }),
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
  DOTS: [
    L(['grid'], 'choice', 'dtGrid', { options: [4, 8, 16, 32], prefix: 'web.ws.dtGrid.' }),
    L(['cols'], 'num', 'dtCols', { num: { min: 8, max: 256, step: 1, range: [16, 128] } }),
    L(['pitchRangeMode'], 'choice', 'dtRange', { options: ['FIT_CONTENT', 'CUSTOM'], prefix: 'web.ws.dtRange.' }),
    L(['pitchMin'], 'num', 'dtPitchMin', { when: (P) => P.pitchRangeMode === 'CUSTOM', num: { min: 0, max: 127, step: 1 } }),
    L(['pitchMax'], 'num', 'dtPitchMax', { when: (P) => P.pitchRangeMode === 'CUSTOM', num: { min: 0, max: 127, step: 1 } }),
    L(['maxRows'], 'num', 'dtMaxRows', { adv: true, num: { min: 8, max: 128, step: 1, range: [12, 64] } }),
    L(['shape'], 'choice', 'dtShape', { options: ['ROUND', 'SQUARE'], prefix: 'web.ws.dtShape.' }),
    L(['dotSize'], 'num', 'dtDotSize', { num: { min: 0.05, max: 1, step: 0.05 } }),
    L(['colorMode'], 'choice', 'inColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
    L(['color'], 'color', 'dtColor', { when: (P) => P.colorMode === 'SOLID' }),
    L(['emptyColor'], 'color', 'dtEmpty'),
    L(['emptyColorB'], 'colorOpt', 'dtEmptyB', { adv: true }),
    L(['emptyAlpha'], 'num', 'dtEmptyAlpha', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['upcomingAlpha'], 'num', 'inUpcomingAlpha', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['activeScale'], 'num', 'dtActiveScale', { adv: true, num: { min: 1, max: 3, step: 0.1 } }),
    L(['playheadRatio'], 'num', 'dgPlayhead', { adv: true, num: { min: 0, max: 1, step: 0.01 } }),
    L(['playheadColor'], 'colorOpt', 'inPlayheadColor', { adv: true }),
    L(['playheadWidth'], 'num', 'inPlayheadWidth', { adv: true, num: { min: 0, max: 10, step: 0.5 } }),
  ],
  ARRANGEMENT: [
    L(['cols'], 'num', 'inCols', { num: { min: 16, max: 600, step: 4, range: [32, 300] } }),
    L(['colorMode'], 'choice', 'inColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
    L(['color'], 'color', 'inColor', { when: (P) => P.colorMode === 'SOLID' }),
    L(['playheadColor'], 'colorOpt', 'inPlayheadColor'),
    L(['upcomingAlpha'], 'num', 'inUpcomingAlpha', { adv: true, num: { min: 0, max: 1, step: 0.05 } }),
    L(['playheadWidth'], 'num', 'inPlayheadWidth', { adv: true, num: { min: 0, max: 20, step: 0.5 } }),
    L(['rowGap'], 'num', 'inRowGap', { adv: true, num: { min: 0, max: 20, step: 1 } }),
  ],
  DRUM_PAD: [
    L(['source'], 'choice', 'inPadSource', { options: ['DRUMS', 'ALL'], prefix: 'web.ws.inPadSource.' }),
    L(['cols'], 'num', 'inPadCols', { num: { min: 1, max: 8, step: 1 } }),
    L(['labels'], 'check', 'inPadLabels'),
    L(['hitColor'], 'color', 'inHitColor', { when: (P) => P.colorMode === 'SOLID' }),
    L(['colorMode'], 'choice', 'inColorMode', { options: ['TRACK', 'SOLID'], prefix: 'web.ws.inColor.' }),
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
  PIANO_ROLL: [
    L(['transition'], 'select', 'pianoTransition', { options: NOTE_TRANSITION_NAMES, prefix: 'web.ws.pianoTransition.' }),
    // Hướng chảy (T-59)
    L(['flowAngle'], 'num', 'prFlowAngle', { num: { min: 0, max: 360, step: 1 }, testId: 'ws-pr-angle' }),
    L(['flowMirror'], 'check', 'prFlowMirror'),
    L(['labelsUpright'], 'check', 'prLabelsUpright', { adv: true, when: (P) => Number(P.flowAngle) % 360 !== 0 }),
    // Vạch phát (T-58)
    L(['playheadStyle'], 'select', 'prPhStyle', { when: (P) => !!P.playheadVisible, options: PLAYHEAD_STYLES, prefix: 'web.ws.prPhStyle.', testId: 'ws-pr-ph-style' }),
    L(['playheadWidth'], 'num', 'prPhWidth', { when: (P) => !!P.playheadVisible, num: { min: 0, max: 40, step: 0.5, range: [0, 12] } }),
    L(['playheadColor'], 'color', 'prPhColor', { when: (P) => !!P.playheadVisible }),
    L(['playheadArrows'], 'check', 'prPhArrows', { when: (P) => !!P.playheadVisible }),
    L(['playheadHit'], 'choice', 'prPhHit', { when: (P) => !!P.playheadVisible, options: PLAYHEAD_HITS, prefix: 'web.ws.prPhHit.' }),
    L(['playheadHitMs'], 'num', 'prPhHitMs', { adv: true, when: (P) => !!P.playheadVisible && P.playheadHit !== 'OFF', num: { min: 30, max: 2000, step: 10, range: [50, 800] } }),
    L(['playheadLength'], 'num', 'prPhLength', { adv: true, when: (P) => !!P.playheadVisible, num: { min: 0.05, max: 1, step: 0.05 } }),
    L(['playheadGlow'], 'num', 'prPhGlow', { adv: true, when: (P) => !!P.playheadVisible, num: { min: 0, max: 1, step: 0.05 } }),
    // Bàn phím (T-51)
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
    L(['zoomMode'], 'choice', 'ntZoomMode', { adv: true, options: ['PULSE', 'HOLD'], prefix: 'web.ws.ntZoomMode.' }),
    L(['zoomMs'], 'num', 'ntZoomMs', { adv: true, when: (P) => P.zoomMode === 'PULSE', num: { min: 20, max: 3000, step: 10, range: [50, 1000] } }),
    L(['glowSize'], 'num', 'ntGlowSize', { adv: true, num: { min: 0, max: 20, step: 0.5, range: [0, 10] } }),
    L(['glowMode'], 'choice', 'ntGlowMode', { adv: true, options: ['HALO', 'SOFT'], prefix: 'web.ws.ntGlowMode.' }),
    L(['playheadColor'], 'color', 'ntPlayheadColor', { adv: true, when: (P) => P.playhead === 'LINE' }),
    L(['playheadWidth'], 'num', 'ntPlayheadWidth', { adv: true, when: (P) => P.playhead === 'LINE', num: { min: 0, max: 40, step: 0.5, range: [0, 8] } }),
    L(['boilFps'], 'num', 'ntBoil', { adv: true, when: (P) => Number(P.rough) > 0, num: { min: 0, max: 24, step: 1 } }),
    L(['seed'], 'num', 'ntSeed', { adv: true, when: (P) => Number(P.rough) > 0, num: { min: 0, max: 999999, step: 1 } }),
    L(['align'], 'choice', 'ntAlign', { adv: true, options: ['TOP', 'CENTER'], prefix: 'web.ws.ntAlign.' }),
    L(['pageFadeMs'], 'num', 'ntPageFade', { adv: true, num: { min: 0, max: 2000, step: 10, range: [0, 1000] } }),
    L(['auraGlow'], 'num', 'ntAuraGlow', { adv: true, when: (P) => P.aura !== 'OFF', num: { min: 0, max: 1, step: 0.05 } }),
    L(['auraMin'], 'num', 'ntAuraMin', { adv: true, when: (P) => P.aura === 'BEAT' || P.aura === 'BAR' || P.aura === 'TIME', num: { min: 0, max: 1, step: 0.05 } }),
    L(['auraColor'], 'colorOpt', 'ntAuraColor', { adv: true, when: (P) => P.aura !== 'OFF' }),
  ],
};

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
  DENSITY: ['polyStyle'],
  PITCH_WHEEL: ['nameStyle', 'chordStyle', 'subStyle'],
  PANEL: ['titleStyle', 'labelStyle', 'valueStyle'],
  DEGREE: ['labelStyle', 'smallStyle'],
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
export const TRACK_WIDGETS: readonly string[] = ['TEXT', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'CHORD_DETECTION', 'PARTICLES', 'NOTATION', 'KEY_SCALE', 'VELOCITY', 'DENSITY', 'PITCH_WHEEL', 'ARRANGEMENT', 'DRUM_PAD', 'AUTOMATION', 'PANEL', 'DEGREE', 'DOTS'];
