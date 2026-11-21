// Bảng khai báo mục Thiết lập của từng loại widget (T-73 bổ sung, REQ-UI-13/15, D-57): MỖI thiết lập khai báo MỘT lần ở đây;
// `WidgetSettings` vẽ điều khiển, nút ↺ và dấu "đã chỉnh nâng cao" từ chính bảng này, nên thêm một thiết lập mới là tự có ↺
// (test `widgetFields.test.ts` bắt thiết lập có trong mặc định mà thiếu trong bảng). Hàm thuần, không DOM.
import type { WidgetSpec, WidgetType } from '@dawviz/render-core';

type Obj = Record<string, unknown>;
export type FieldKind = 'check' | 'num' | 'choice' | 'select' | 'color' | 'colorOpt' | 'text';

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
  /** kind 'text'. `placeholder`: khoá con của `web.ws.*` khi để trống. */
  text?: { max?: number; multiline?: boolean; placeholder?: string };
  testId?: string;
}

const L = (path: string[], kind: FieldKind, label: string, rest: Partial<FieldDef> = {}): FieldDef => ({ path, kind, label, ...rest });
const LINES = ['played', 'total', 'progress', 'tempo'] as const;
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
    L(['shape'], 'choice', 'spShape', { options: ['LINE', 'CIRCLE'], prefix: 'web.ws.shape.', testId: 'ws-sp-shape' }),
    L(['bars'], 'num', 'spBars', { num: { min: 8, max: 128, step: 1 } }),
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
    L(['lane'], 'choice', 'inLane', { options: ['volume', 'pan'], prefix: 'web.ws.inLane.' }),
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
  TEXT: [
    L(['text'], 'text', 'boxText', { text: { max: 2000, multiline: true } }),
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
  PITCH_WHEEL: ['nameStyle', 'chordStyle'],
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
export const TRACK_WIDGETS: readonly string[] = ['TEXT', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'CHORD_DETECTION', 'PARTICLES', 'NOTATION', 'KEY_SCALE', 'VELOCITY', 'DENSITY', 'PITCH_WHEEL', 'ARRANGEMENT', 'DRUM_PAD', 'AUTOMATION'];
