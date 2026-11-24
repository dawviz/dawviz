// Sân khấu (UI-DIRECTION 5.3, hướng E): khung video do Render Core vẽ, đặt như một bản in thử. Dấu cắt ở bốn góc,
// thông số chạy dọc mép trên/dưới, dải xám bên cạnh. Toàn bộ lớp đóng khung nằm NGOÀI canvas: không bao giờ vào video xuất.
// Khung video luôn theo preset (D-51), không theo theme app. fps chưa hiện vì chỉ chốt khi xuất (M3).
// Một lưới duy nhất chứa cả thanh phát (`children`), nên thanh phát luôn rộng đúng bằng khung, không cần số bù.
import type { ReactNode } from 'react';
import type { Derived, SceneDocument, UnifiedProjectAST } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { usePlayback, type Playback } from '../lib/playback.ts';
import { SceneCanvas } from './SceneCanvas.tsx';
import { AspectSwitch, frameInfo } from './AspectSwitch.tsx';
import type { FontsStatus } from '../lib/fonts.ts';

interface Props {
  scene: SceneDocument; derived: Derived; ast: UnifiedProjectAST; playback: Playback; styleName: string; proof: boolean;
  /** Trạng thái phông của khung video: chưa 'ready' thì không vẽ (hiện chữ chờ/lỗi). */
  fonts?: FontsStatus;
  /** Chiều rộng của khung (px), từ useStageWidth. */
  width: number;
  /** Đổi tỉ lệ khung (bộ chọn 9:16 / 1:1 / 16:9 ở đầu sân khấu); thiếu thì không hiện bộ chọn. */
  onAspect?(aspect: string): void;
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

export function Stage({ scene, derived, ast, playback, styleName, proof, width, fonts, onAspect, children }: Props) {
  const { i18n } = useI18n();
  const { designWidth: w, designHeight: h, aspectRatio } = scene.canvas;
  const canvas = <LiveCanvas scene={scene} derived={derived} ast={ast} playback={playback} fonts={fonts} />;
  const bar = children && <div className="border border-line bg-surface" style={{ gridColumn: 1 }}>{children}</div>;
  if (!proof) {
    return (
      <div className="mx-auto grid gap-y-2" style={{ width, gridTemplateColumns: `${width}px` }}>
        {onAspect && <div className="flex justify-end"><AspectSwitch value={aspectRatio} onChange={onAspect} /></div>}
        <figure aria-label={i18n.t('web.stage')} className="border border-line">{canvas}</figure>
        {bar}
      </div>
    );
  }
  return (
    <div className="mx-auto grid gap-y-2" style={{ width, gridTemplateColumns: `${width}px` }} data-testid="stage-proof">
      {/* Một dòng cố định (STAGE_CHROME đã tính chiều cao này): thông số và tên phong cách rút gọn bên trái, bộ chọn tỉ lệ bên phải. */}
      <div className="flex items-center justify-between gap-3 text-xs tabular-nums text-muted" style={{ gridColumn: 1 }}>
        <span className="min-w-0 truncate" title={`${frameInfo(i18n, w, h, aspectRatio)} · ${i18n.t('web.stage.style', { name: styleName })}`}>{frameInfo(i18n, w, h, aspectRatio)}<span aria-hidden> · </span>{styleName}</span>
        {onAspect && <AspectSwitch value={aspectRatio} onChange={onAspect} />}
      </div>
      <figure aria-label={i18n.t('web.stage')} className="relative outline outline-1 outline-line" style={{ gridColumn: 1, gridRow: 2 }}>
        {/* Dấu cắt nằm ngoài mép khung, cách 4 px, như trên tờ in thử. */}
        <Crop className="-left-5 -top-5" /><Crop className="-right-5 -top-5 -scale-x-100" />
        <Crop className="-bottom-5 -left-5 -scale-y-100" /><Crop className="-bottom-5 -right-5 -scale-100" />
        {canvas}
      </figure>
      {bar && <div className="border border-line bg-surface" style={{ gridColumn: 1, gridRow: 3 }}>{children}</div>}
    </div>
  );
}
