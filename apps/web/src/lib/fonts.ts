// Nạp phông cho khung video ở Preview (TECHNICAL-DESIGN 5.7): FontFace + document.fonts, tự host cùng origin (CSP font-src 'self').
// Export Worker sẽ dùng cùng ensureFonts với self.fonts (M3). Chưa nạp xong thì không vẽ khung có chữ.
import { useEffect, useState } from 'react';
import { ensureFonts, needsFonts, requiredFonts, type FontFaceSpec, type FontLoader, type SceneDocument } from '@dawviz/render-core';

const inflight = new Map<string, Promise<void>>();
/** Nạp một mặt phông (một lần cho mỗi tệp, kể cả khi gọi lại). Lỗi được quên để lần sau thử lại. */
export const loadBundledFont: FontLoader = (spec: FontFaceSpec) => {
  let p = inflight.get(spec.file);
  if (!p) {
    p = (async () => {
      const face = new FontFace(spec.family, `url(${import.meta.env.BASE_URL}fonts/${spec.file})`, { weight: String(spec.weight), unicodeRange: spec.unicodeRange });
      await face.load();
      document.fonts.add(face);
    })();
    p.catch(() => inflight.delete(spec.file));
    inflight.set(spec.file, p);
  }
  return p;
};

export type FontsStatus = 'ready' | 'loading' | 'error';
/** Trạng thái phông của scene: scene không có chữ thì luôn sẵn sàng. */
export function useFontsStatus(scene: SceneDocument, loader: FontLoader = loadBundledFont): FontsStatus {
  const need = needsFonts(scene) ? requiredFonts(scene) : [];
  const key = need.map((f) => f.file).join('|');
  const [state, setState] = useState<{ key: string; status: FontsStatus }>({ key: '', status: 'loading' });
  useEffect(() => {
    if (!key) return;
    let live = true;
    ensureFonts(need, loader).then(() => live && setState({ key, status: 'ready' }), () => live && setState({ key, status: 'error' }));
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return !key ? 'ready' : state.key === key ? state.status : 'loading';
}
