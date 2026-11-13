// Sân khấu (UI-DIRECTION 5.3, hướng E): khung video do Render Core vẽ, đặt như một bản in thử. Dấu cắt ở bốn góc,
// thông số chạy dọc mép trên/dưới, dải xám bên cạnh. Toàn bộ lớp đóng khung nằm NGOÀI canvas: không bao giờ vào video xuất.
// Khung video luôn theo preset (D-51), không theo theme app. fps chưa hiện vì chỉ chốt khi xuất (M3).
// Một lưới duy nhất chứa cả thanh phát (`children`), nên thanh phát luôn rộng đúng bằng khung, không cần số bù.
import type { ReactNode } from 'react';
import type { Derived, SceneDocument, UnifiedProjectAST } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { usePlayback, type Playback } from '../lib/playback.ts';
import { SceneCanvas } from './SceneCanvas.tsx';
import type { FontsStatus } from '../lib/fonts.ts';

interface Props {
  scene: SceneDocument; derived: Derived; ast: UnifiedProjectAST; playback: Playback; styleName: string; proof: boolean;
  /** Trạng thái phông của khung video: chưa 'ready' thì không vẽ (hiện chữ chờ/lỗi). */
  fonts?: FontsStatus;
  /** Chiều rộng của khung (px), từ useStageWidth. */
  width: number;
  /** Thanh phát, đặt ngay dưới khung. */
  children?: ReactNode;
}

/** Canvas tự theo dõi `t`: chỉ phần này vẽ lại mỗi khung hình. */
export function LiveCanvas({ scene, derived, ast, playback, fonts = 'ready' }: Pick<Props, 'scene' | 'derived' | 'ast' | 'playback' | 'fonts'>) {
  const { i18n } = useI18n();
  const t = usePlayback(playback, (s) => s.t);
  return (
    <div className="relative">
      <SceneCanvas scene={scene} derived={derived} ast={ast} t={t} blocked={fonts !== 'ready'} />
      {fonts !== 'ready' && (
        <p role="status" data-testid="fonts-status" className="absolute inset-0 grid place-items-center bg-white px-6 text-center text-[13px] text-neutral-600">
          {i18n.t(fonts === 'error' ? 'web.stage.fontsError' : 'web.stage.fontsLoading')}
        </p>
      )}
    </div>
  );
}

export const Crop = ({ className }: { className: string }) => (
  <svg viewBox="0 0 16 16" className={`absolute h-4 w-4 text-faint ${className}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="1"><path d="M0 8h7M8 0v7" /></svg>
);
const GREYS = [0.95, 0.8, 0.65, 0.5, 0.35, 0.2, 0.08];

export function Stage({ scene, derived, ast, playback, styleName, proof, width, fonts, children }: Props) {
  const { i18n } = useI18n();
  const { designWidth: w, designHeight: h, aspectRatio } = scene.canvas;
  const canvas = <LiveCanvas scene={scene} derived={derived} ast={ast} playback={playback} fonts={fonts} />;
  const bar = children && <div className="border border-line bg-surface" style={{ gridColumn: 1 }}>{children}</div>;
  if (!proof) {
    return (
      <div className="mx-auto grid gap-y-2" style={{ width, gridTemplateColumns: `${width}px` }}>
        <figure aria-label={i18n.t('web.stage')} className="border border-line">{canvas}</figure>
        {bar}
      </div>
    );
  }
  return (
    <div className="mx-auto grid gap-x-4 gap-y-2" style={{ width: width + 26, gridTemplateColumns: `${width}px 0.625rem` }} data-testid="stage-proof">
      <p className="flex justify-between gap-3 text-xs tabular-nums text-muted" style={{ gridColumn: 1 }}>
        <span>{i18n.t('web.stage.size', { w, h, aspect: aspectRatio })}</span>
        <span className="truncate">{i18n.t('web.stage.style', { name: styleName })}</span>
      </p>
      <figure aria-label={i18n.t('web.stage')} className="relative outline outline-1 outline-line" style={{ gridColumn: 1, gridRow: 2 }}>
        {/* Dấu cắt nằm ngoài mép khung, cách 4 px, như trên tờ in thử. */}
        <Crop className="-left-5 -top-5" /><Crop className="-right-5 -top-5 -scale-x-100" />
        <Crop className="-bottom-5 -left-5 -scale-y-100" /><Crop className="-bottom-5 -right-5 -scale-100" />
        {canvas}
      </figure>
      {/* Dải xám kiểm độ sáng của bản in thử, cao đúng bằng khung; chỉ để tham chiếu thị giác. */}
      <div aria-hidden className="flex flex-col border border-line" style={{ gridColumn: 2, gridRow: 2 }}>
        {GREYS.map((g) => <span key={g} className="flex-1" style={{ background: `hsl(0 0% ${g * 100}%)` }} />)}
      </div>
      {bar && <div className="border border-line bg-surface" style={{ gridColumn: 1, gridRow: 3 }}>{children}</div>}
    </div>
  );
}
