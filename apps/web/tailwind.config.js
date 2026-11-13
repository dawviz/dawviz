/** @type {import('tailwindcss').Config} */
// Màu giao diện đọc từ token CSS (src/index.css, UI-DIRECTION 5.2) nên đổi theme không cần sửa class trong component (D-52).
// Tên lớp ↔ token: page=bg, surface, raised=surface-raised, line, control=line-control, line-strong, fg=text,
// muted=text-muted, faint=text-faint, accent, on-accent=accent-text, focus, selection, danger, warning, success,
// scrub-played, scrub-rest, waveform, guide. Không dùng màu Tailwind có sẵn (red-500, amber-…) trong giao diện app.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: v('bg'), surface: v('surface'), raised: v('surface-raised'),
        line: v('line'), control: v('line-control'), 'line-strong': v('line-strong'),
        fg: v('text'), muted: v('text-muted'), faint: v('text-faint'),
        accent: v('accent'), 'on-accent': v('accent-text'), focus: v('focus'), selection: v('selection'),
        danger: v('danger'), warning: v('warning'), success: v('success'),
        'scrub-played': v('scrub-played'), 'scrub-rest': v('scrub-rest'), waveform: v('waveform'), guide: v('guide'),
      },
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
