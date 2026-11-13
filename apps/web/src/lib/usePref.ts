// Tuỳ chọn giao diện lưu theo trình duyệt (không vào preset video). Đọc một lần, ghi lại mỗi khi đổi.
import { VIDEO_STYLES } from './videoScenes.ts';
import { useEffect, useState } from 'react';
import { loadPref, savePref } from './prefs.ts';

export function usePref<T extends object>(name: string, fallback: T, sanitize: (raw: Partial<T>) => T = (r) => ({ ...fallback, ...r })): [T, (v: T | ((p: T) => T)) => void] {
  const [v, setV] = useState<T>(() => sanitize(loadPref<Partial<T>>(name, {})));
  useEffect(() => savePref(name, v), [name, v]);
  return [v, setV];
}

export type UiMode = 'basic' | 'advanced';
/** Tuỳ chọn bố cục T-70: chế độ (REQ-UI-13, mặc định Cơ bản cho người dùng chính), mục đang mở "Thêm tuỳ chọn",
 *  khung bản in thử quanh sân khấu (UI-DIRECTION 5.3, mặc định bật) và phong cách video đã chọn gần nhất. */
export interface UiPrefs { mode: UiMode; more: Record<string, boolean>; proofFrame: boolean; videoStyle: string }
export const DEFAULT_UI: UiPrefs = { mode: 'basic', more: {}, proofFrame: true, videoStyle: 'paper' }; // D-51: Paper là phong cách mặc định khi mở tệp
export function sanitizeUi(r: Partial<UiPrefs>): UiPrefs {
  return {
    mode: r.mode === 'advanced' ? 'advanced' : 'basic',
    more: r.more && typeof r.more === 'object' ? Object.fromEntries(Object.entries(r.more).filter(([, b]) => b === true)) : {},
    proofFrame: r.proofFrame !== false,
    videoStyle: typeof r.videoStyle === 'string' && VIDEO_STYLES.includes(r.videoStyle) ? r.videoStyle : DEFAULT_UI.videoStyle,
  };
}
