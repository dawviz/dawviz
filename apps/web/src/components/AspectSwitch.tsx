// Bộ chọn tỉ lệ khung ở đầu sân khấu (REQ-GRAPHICS-04): 9:16 / 1:1 / 16:9. Mỗi phong cách video giữ tỉ lệ riêng vì tỉ lệ nằm trong scene của nó.
// Kích thước khác (tuỳ biến, từ preset mở từ tệp) thì không ô nào được chọn.
import { ASPECTS } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';

const ORDER = ['9:16', '1:1', '16:9'] as const;

export function AspectSwitch({ value, onChange, disabled }: { value: string; onChange(aspect: string): void; disabled?: boolean }) {
  const { i18n } = useI18n();
  const any = ORDER.some((a) => a === value && ASPECTS[a]);
  return (
    <div className="seg shrink-0" role="radiogroup" aria-label={i18n.t('web.aspect.title')} onKeyDown={radioKeys} data-testid="aspect-switch">
      {ORDER.map((a, i) => (
        <button key={a} type="button" role="radio" aria-checked={value === a} tabIndex={radioTab(value === a, i === 0, any)} disabled={disabled}
          aria-label={i18n.t(`web.aspect.${a}`)} title={i18n.t(`web.aspect.${a}`)} className="seg-btn tabular-nums disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onChange(a)} data-testid={`aspect-${a}`}>{a}</button>
      ))}
    </div>
  );
}

/** Dòng thông số của khung: "1,080 × 1,920"; tỉ lệ chỉ ghi thêm khi không phải ba tỉ lệ dựng sẵn (đã có trên bộ chọn), ví dụ "1,000 × 1,250 · 4:5". */
export function frameInfo(i18n: ReturnType<typeof useI18n>['i18n'], w: number, h: number, aspect: string): string {
  const dims = i18n.t('web.stage.dims', { w, h });
  return ORDER.some((a) => a === aspect) ? dims : `${dims} · ${aspect}`;
}
