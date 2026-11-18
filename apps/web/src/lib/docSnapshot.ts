// Tài liệu (Doc) ⇄ JSON để lưu phiên và Project Pack (T-10). Nạp lại luôn kiểm: scene qua `sanitizeScene`, id track phải có trong dự án,
// độ sáng qua `sanitizeBrightness`, tham chiếu ↺ chỉ nhận khoá/kiểu giống bản hiện tại. Không tin dữ liệu đọc từ kho hay từ tệp.
import { DEFAULT_BRIGHTNESS, sanitizeBrightness, sanitizeScene, type BrightnessConfig, type SceneWarning } from '@dawviz/render-core';
import type { Doc } from './commands.ts';
import { sanitizeDraft, type TempoDraft } from './tempoRows.ts';

export interface WorkspaceJson {
  videoStyle: string; brightness: Record<string, BrightnessConfig>; order: string[]; hidden: string[]; solo: string[];
  audioOffsetMs: number; lookRef: Doc['lookRef']; layoutRef: Doc['layoutRef']; propsRef: Doc['propsRef'];
  tempoDraft?: TempoDraft;
}

export const toWorkspaceJson = (d: Doc, tempoDraft?: TempoDraft | null): WorkspaceJson => ({
  videoStyle: d.videoStyle, brightness: d.brightness, order: d.order, hidden: d.hidden, solo: d.solo, audioOffsetMs: d.audioOffsetMs,
  lookRef: d.lookRef, layoutRef: d.layoutRef, propsRef: d.propsRef, ...(tempoDraft ? { tempoDraft } : {}),
});

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const strList = (v: unknown, allowed: ReadonlySet<string>): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && allowed.has(x)))] : []);
/** Chỉ giữ khoá đã có ở `base` và đúng kiểu nguyên thuỷ của nó. */
const likeBase = <T extends object>(base: T, v: unknown): T => {
  if (!isObj(v)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(base)) if (typeof v[k] === typeof (base as Record<string, unknown>)[k]) out[k] = v[k];
  return out as T;
};

export interface Applied { doc: Doc; warnings: SceneWarning[]; tempoDraft: TempoDraft | null }

/**
 * Dựng Doc từ JSON đã lưu. `base` cho các giá trị mặc định (store hiện tại); `trackIds` là track của dự án vừa phân tích lại.
 * Ném `SceneError` nếu scene không đọc được.
 */
export function applyWorkspace(base: Doc, sceneRaw: unknown, wsRaw: unknown, trackIds: string[]): Applied {
  const { scene, warnings } = sanitizeScene(sceneRaw);
  const ws = isObj(wsRaw) ? wsRaw : {};
  const ids = new Set(trackIds);
  const order = strList(ws.order, ids);
  for (const id of trackIds) if (!order.includes(id)) order.push(id);
  const bIn = isObj(ws.brightness) ? ws.brightness : {};
  const brightness = Object.fromEntries(trackIds.map((id) => [id, isObj(bIn[id]) ? sanitizeBrightness(bIn[id] as unknown as BrightnessConfig) : { ...DEFAULT_BRIGHTNESS } as BrightnessConfig]));
  const off = typeof ws.audioOffsetMs === 'number' && Number.isFinite(ws.audioOffsetMs) ? Math.round(Math.max(-60000, Math.min(60000, ws.audioOffsetMs))) : 0;
  const layoutRef = isObj(ws.layoutRef) ? Object.fromEntries(Object.entries(ws.layoutRef).filter(([, v]) => isObj(v)).slice(0, 128)) as Doc['layoutRef'] : base.layoutRef;
  const propsRef = isObj(ws.propsRef) ? Object.fromEntries(Object.entries(ws.propsRef).filter(([, v]) => isObj(v)).slice(0, 128)) as Doc['propsRef'] : base.propsRef;
  const doc: Doc = {
    ...base, scene, videoStyle: typeof ws.videoStyle === 'string' && ws.videoStyle ? ws.videoStyle.slice(0, 40) : 'custom',
    brightness, order, hidden: strList(ws.hidden, ids), solo: strList(ws.solo, ids), audioOffsetMs: off,
    lookRef: likeBase(base.lookRef, ws.lookRef), layoutRef, propsRef,
  };
  return { doc, warnings, tempoDraft: ws.tempoDraft ? sanitizeDraft(ws.tempoDraft) : null };
}
