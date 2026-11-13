/** @type {import('tailwindcss').Config} */
// Màu giao diện đọc từ biến CSS (src/index.css) để có thể thêm theme sáng/tối và theme cộng đồng (REQ-UI-10)
// mà không sửa class trong component. Dạng "r g b" cho phép dùng độ đục kiểu `bg-ink-900/60`.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 50: v('ink-50'), 100: v('ink-100'), 300: v('ink-300'), 500: v('ink-500'), 700: v('ink-700'), 800: v('ink-800'), 900: v('ink-900'), 950: v('ink-950') },
        accent: { 300: v('accent-300'), 400: v('accent-400'), 500: v('accent-500'), 600: v('accent-600') },
      },
      fontFamily: { sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        panel: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 8px 24px -12px rgb(0 0 0 / 0.6)',
        stage: '0 0 0 1px rgb(var(--ink-700) / 0.8), 0 24px 60px -24px rgb(0 0 0 / 0.8)',
      },
    },
  },
  plugins: [],
};
