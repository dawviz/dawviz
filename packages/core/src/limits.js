// REQ-PARSER-00 [PROVISIONAL]. Có thể ghi đè qua options.limits.
export const DEFAULT_LIMITS = Object.freeze({
  maxFileBytes: 100e6,       // dự án / gói nén
  maxUnzippedBytes: 300e6,   // tổng byte được phép giải nén (SRS: 500e6; hạ để không vượt giới hạn chuỗi V8 ~512 MB khi decode UTF-8)
  maxRatio: 30,              // tỉ lệ giải nén tối đa
  maxXmlDepth: 64,
  maxXmlNodes: 5e6,
  maxNotes: 500000,
  maxZipEntries: 20000,
  maxRppLines: 5e6,
  maxBinaryNodes: 5e6,
  maxBinaryDepth: 64,
});
export const resolveLimits = (o) => ({ ...DEFAULT_LIMITS, ...(o || {}) });
