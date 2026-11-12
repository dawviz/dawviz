// Mã lỗi theo SRS mục 8 (ERR_*). Mọi parser chỉ ném DawParseError.
export class DawParseError extends Error {
  constructor(code, message, details) {
    super(`${code}: ${message || ''}`);
    this.name = 'DawParseError';
    this.code = code;
    this.details = details;
  }
}
export const fail = (code, message, details) => { throw new DawParseError(code, message, details); };

// Cảnh báo không làm dừng parse. { code, message, details? }
export const warn = (list, code, message, details) => { list.push(details ? { code, message, details } : { code, message }); };
