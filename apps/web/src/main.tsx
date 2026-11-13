// Điểm vào của ứng dụng web: dựng React root với I18nProvider.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { App } from './App.tsx';
// Phông tự host (CSP chỉ cho font-src 'self'): không nạp thì máy không cài Inter sẽ rơi về phông hệ thống.
import '@fontsource-variable/inter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><I18nProvider><App /></I18nProvider></StrictMode>,
);
