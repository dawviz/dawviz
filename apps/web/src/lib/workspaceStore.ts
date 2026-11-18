// Tự lưu phiên (T-10, REQ-STORAGE-01): bảng `workspace_state` (JSON) + bảng `blobs` (tệp dự án, âm thanh, ảnh nền, phông).
// Phần quyết định (khi nào ghi Blob, suy thoái khi thiếu dung lượng, debounce) là hàm thuần nhận `Backend` và đồng hồ nhúng vào,
// nên test bằng backend trong bộ nhớ; `dexieBackend()` chỉ là lớp mỏng bọc Dexie.
import Dexie, { type Table } from 'dexie';

export const WORKSPACE_SCHEMA_VERSION = '1.0.0';
export const LOW_STORAGE_BYTES = 50e6;
export const AUTOSAVE_DELAY_MS = 500;
export const CURRENT_ID = 'current';

export interface BlobRef { id: string; name: string; size: number }
export interface WorkspaceState {
  id: typeof CURRENT_ID;
  schemaVersion: string;
  savedAt: number;
  title: string;
  /** Mọi Blob mà phiên có, kể cả khi lần ghi này không lưu được (để báo "cần nạp lại"). */
  blobs: BlobRef[];
  tempoOverride?: number | { tick: number; bpm: number; num?: number; den?: number }[];
  audioOffsetMs: number;
  scene: unknown;
  workspace: unknown;
}
export interface StoredBlob extends BlobRef { data: Uint8Array }

/** `keep` = không đụng tới Blob đã lưu; mảng = thay toàn bộ; `null` = xoá hết (chỉ giữ JSON). */
export type BlobWrite = 'keep' | StoredBlob[] | null;
export interface Backend {
  load(): Promise<{ state: WorkspaceState; blobs: StoredBlob[] } | null>;
  /** Một giao dịch duy nhất: lỗi thì bản lưu trước còn nguyên. */
  save(state: WorkspaceState, blobs: BlobWrite): Promise<void>;
  clear(): Promise<void>;
}
export interface StorageEstimate { quota?: number; usage?: number }

export const isQuotaError = (e: unknown): boolean => !!e && typeof e === 'object' && ((e as { name?: string }).name === 'QuotaExceededError' || (e as { inner?: { name?: string } }).inner?.name === 'QuotaExceededError');

/** Còn trống bao nhiêu byte theo `navigator.storage.estimate()`; không biết thì `Infinity` (không chặn). */
export const freeBytes = (e: StorageEstimate | null | undefined): number => (e && typeof e.quota === 'number' && typeof e.usage === 'number' ? Math.max(0, e.quota - e.usage) : Infinity);

/** Chữ ký của tập Blob: đổi khi thêm/bỏ/đổi tệp. Cùng chữ ký thì không ghi lại Blob (tránh ghi lại âm thanh hàng chục MB mỗi 500 ms). */
export const blobSignature = (blobs: BlobRef[]): string => blobs.map((b) => `${b.id}:${b.name}:${b.size}`).sort().join('|');

export interface Snapshot { title: string; tempoOverride?: WorkspaceState['tempoOverride']; audioOffsetMs: number; scene: unknown; workspace: unknown; blobs: StoredBlob[] }
export interface SaveResult { ok: boolean; /** Blob không lưu được: người dùng sẽ phải nạp lại ở phiên sau. */ degraded: boolean; wroteBlobs: boolean; error?: unknown }

export interface Saver {
  save(snap: Snapshot, estimate?: StorageEstimate | null): Promise<SaveResult>;
  /** Sau khi xoá kho: lần ghi kế tiếp phải ghi lại cả Blob. */
  reset(): void;
}

/** Bộ ghi có nhớ chữ ký Blob đã ghi và quy tắc suy thoái. */
export function createSaver(backend: Backend, now: () => number = Date.now): Saver {
  let lastSig: string | null = null;
  let lastDegraded = false;
  return {
    reset() { lastSig = null; lastDegraded = false; },
    async save(snap, estimate) {
      const refs: BlobRef[] = snap.blobs.map(({ id, name, size }) => ({ id, name, size }));
      const state: WorkspaceState = {
        id: CURRENT_ID, schemaVersion: WORKSPACE_SCHEMA_VERSION, savedAt: now(), title: snap.title, blobs: refs,
        ...(snap.tempoOverride !== undefined ? { tempoOverride: snap.tempoOverride } : {}), audioOffsetMs: snap.audioOffsetMs, scene: snap.scene, workspace: snap.workspace,
      };
      const sig = blobSignature(refs);
      const total = refs.reduce((s, b) => s + b.size, 0);
      const free = freeBytes(estimate);
      const tooBig = free < LOW_STORAGE_BYTES || total > free - LOW_STORAGE_BYTES / 2;
      const changed = sig !== lastSig;
      // Không có gì thay đổi về Blob: chỉ ghi JSON. Có thay đổi: ghi Blob nếu còn chỗ, không thì bỏ Blob (giữ JSON).
      let mode: BlobWrite = changed ? (tooBig && total > 0 ? null : snap.blobs) : 'keep';
      if (changed && snap.blobs.length === 0) mode = [];
      const attempt = async (m: BlobWrite) => { await backend.save(state, m); };
      try {
        await attempt(mode);
        if (changed) { lastSig = sig; lastDegraded = mode === null; }
        return { ok: true, degraded: changed ? mode === null : lastDegraded, wroteBlobs: Array.isArray(mode) && mode.length > 0 };
      } catch (e) {
        if (isQuotaError(e) && mode !== null && mode !== 'keep') {
          try { await attempt(null); lastSig = sig; lastDegraded = true; return { ok: true, degraded: true, wroteBlobs: false }; } catch (e2) { return { ok: false, degraded: true, wroteBlobs: false, error: e2 }; }
        }
        // Giao dịch bị huỷ: bản lưu trước còn nguyên (REQ-STORAGE-01).
        return { ok: false, degraded: lastDegraded, wroteBlobs: false, error: e };
      }
    },
  };
}

export interface Restored { state: WorkspaceState; blobs: StoredBlob[]; /** Blob đã có trong phiên nhưng không còn trong kho: cần nạp lại. */ missing: BlobRef[] }
export async function restoreWorkspace(backend: Backend): Promise<Restored | null> {
  let r: Awaited<ReturnType<Backend['load']>>;
  try { r = await backend.load(); } catch { return null; }
  if (!r || !r.state || r.state.id !== CURRENT_ID || typeof r.state.schemaVersion !== 'string') return null;
  const major = (v: string) => Number(v.split('.')[0]);
  // Phiên bản chính mới hơn: không đoán cấu trúc, coi như không có bản lưu (bản gốc vẫn nằm trong kho, không bị xoá).
  if (!(major(r.state.schemaVersion) <= major(WORKSPACE_SCHEMA_VERSION))) return null;
  const have = new Set(r.blobs.map((b) => b.id));
  return { state: r.state, blobs: r.blobs, missing: r.state.blobs.filter((b) => !have.has(b.id)) };
}

/** Debounce có đồng hồ nhúng vào: `push` hẹn ghi sau `delay` ms kể từ lần gọi cuối; `flush` ghi ngay (đóng thẻ). */
export interface Timers { set(fn: () => void, ms: number): unknown; clear(h: unknown): void }
export function createDebounced<T>(run: (v: T) => void | Promise<unknown>, delay = AUTOSAVE_DELAY_MS, timers: Timers = { set: (f, m) => setTimeout(f, m), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) }) {
  let handle: unknown = null, pending: { v: T } | null = null;
  const fire = () => { handle = null; const p = pending; pending = null; if (p) return run(p.v); };
  return {
    push(v: T) { pending = { v }; if (handle !== null) timers.clear(handle); handle = timers.set(fire, delay); },
    flush() { if (handle !== null) { timers.clear(handle); return fire(); } },
    cancel() { if (handle !== null) timers.clear(handle); handle = null; pending = null; },
    get pending() { return pending !== null; },
  };
}

// ── Dexie ──
class DawvizDb extends Dexie {
  workspace_state!: Table<WorkspaceState, string>;
  blobs!: Table<StoredBlob, string>;
  constructor(name = 'dawviz') {
    super(name);
    this.version(1).stores({ workspace_state: 'id', blobs: 'id' });
  }
}

export function dexieBackend(dbName?: string): Backend {
  const db = new DawvizDb(dbName);
  return {
    async load() {
      const state = await db.workspace_state.get(CURRENT_ID);
      if (!state) return null;
      return { state, blobs: await db.blobs.toArray() };
    },
    async save(state, blobs) {
      await db.transaction('rw', db.workspace_state, db.blobs, async () => {
        if (blobs !== 'keep') { await db.blobs.clear(); if (blobs && blobs.length) await db.blobs.bulkPut(blobs); }
        await db.workspace_state.put(state);
      });
    },
    async clear() { await db.transaction('rw', db.workspace_state, db.blobs, async () => { await db.workspace_state.clear(); await db.blobs.clear(); }); },
  };
}
