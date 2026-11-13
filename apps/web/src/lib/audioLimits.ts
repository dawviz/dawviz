// Giới hạn nạp tệp âm thanh (T-08, §6.2.1; REQ-PARSER-00 / NFR-SEC-04, REQ-WIDGET-07). Các số là [PROVISIONAL].
export const AUDIO_SAMPLE_RATE = 48_000;
export const MAX_AUDIO_BYTES = 300 * 1024 * 1024;
export const MAX_AUDIO_SECONDS = 20 * 60;
/** Nhánh không đọc được metadata (MP3 VBR…): 48 MB = 20 phút ở 320 kbps; lớn hơn thì không giải mã mù. */
export const MAX_UNKNOWN_DURATION_BYTES = 48 * 1024 * 1024;
export const AUDIO_EXTENSIONS = ['wav', 'mp3', 'ogg', 'flac', 'm4a'] as const;
export const AUDIO_ACCEPT = AUDIO_EXTENSIONS.map((e) => `.${e}`).join(',');
export const hasAudioExtension = (name: string): boolean => {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return !!m && (AUDIO_EXTENSIONS as readonly string[]).includes(m[1].toLowerCase());
};
