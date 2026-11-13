// Phong cách video = một scene hoàn chỉnh (D-51): "Paper" là preset đọc từ presets/scene/paper-1x1.json (phong cách mặc định khi mở tệp);
// các phong cách còn lại là scene mặc định (Piano Roll phủ kín khung) với bộ kiểu nốt dựng sẵn. Kiểu nốt và bàn phím người dùng chỉnh
// ở inspector được ghép vào Piano Roll của scene (T-07 sẽ đưa scene vào store + hoàn tác + Preset).
import { DEFAULT_NOTE_STYLE, STYLE_PRESETS, defaultScene, sanitizeScene, type KeyboardStyle, type NoteStyle, type PianoRollProps, type SceneDocument, type StyleConfig, type WidgetSpec } from '@dawviz/render-core';
import paperJson from '../../../../presets/scene/paper-1x1.json' with { type: 'json' };

export const PAPER_SCENE: SceneDocument = sanitizeScene(paperJson).scene;
const pianoOf = (s: SceneDocument) => s.widgets.find((w) => w.type === 'PIANO_ROLL') as WidgetSpec<PianoRollProps>;

export const DEFAULT_VIDEO_STYLE = 'paper';
/** Phong cách video = scene hoàn chỉnh (cột "Video styles"). Bộ kiểu nốt dựng sẵn KHÔNG nằm ở đây mà ở mục 02 Hình thức (NOTE_PRESETS). */
export const VIDEO_STYLES = [DEFAULT_VIDEO_STYLE, 'default'];
/** Kiểu nốt dựng sẵn của Render Core: chỉ đổi NoteStyle của Piano Roll trong scene hiện tại, không đổi scene. */
export const NOTE_PRESETS = ['default', ...Object.keys(STYLE_PRESETS)];
export const noteStylePreset = (id: string): NoteStyle => ({ ...DEFAULT_NOTE_STYLE, ...(STYLE_PRESETS[id] ?? {}) });
/** Bộ kiểu nốt dựng sẵn khớp đúng NoteStyle hiện tại (so toàn bộ trường), hoặc 'custom'. */
export function matchNotePreset(base: NoteStyle): string {
  const b = base as unknown as Record<string, unknown>;
  return NOTE_PRESETS.find((id) => Object.entries(noteStylePreset(id)).every(([k, v]) => b[k] === v)) ?? 'custom';
}
/** Kiểu nốt gốc của một phong cách (để biết "đã chỉnh"). */
export function videoStyleBase(id: string): NoteStyle {
  return id === 'paper' ? { ...DEFAULT_NOTE_STYLE, ...pianoOf(PAPER_SCENE).properties.noteStyle.base } : { ...DEFAULT_NOTE_STYLE, ...(STYLE_PRESETS[id] ?? {}) };
}
/** Bàn phím piano có bật sẵn không (Paper không có bàn phím). */
export const videoStyleKeyboard = (id: string): boolean => id !== 'paper';

/** Scene của phong cách `id` với kiểu nốt và bàn phím hiện tại. Trả bản sao mới, không đụng PAPER_SCENE. */
export function sceneForStyle(id: string, style: StyleConfig, keyboard: Partial<Pick<KeyboardStyle, 'enabled'>> = {}): SceneDocument {
  const s: SceneDocument = id === 'paper' ? structuredClone(PAPER_SCENE) : defaultScene();
  const w = pianoOf(s);
  w.properties = { ...w.properties, noteStyle: style, keyboard: { ...w.properties.keyboard, enabled: keyboard.enabled ?? videoStyleKeyboard(id) } };
  return s;
}
