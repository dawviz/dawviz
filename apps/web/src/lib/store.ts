// Store có hoàn tác (T-07, Technical Design §6.4). TypeScript thuần, không React, không đọc đồng hồ thật (đồng hồ truyền vào để test).
// Mọi thay đổi do người dùng làm đi qua `dispatch(Command)`. Đồng hồ phát (lib/playback.ts) KHÔNG nằm ở đây.
//
// Mỗi lệnh giữ giá trị trước/sau của đúng phần nó đổi, nên `undo` luôn trả đúng trạng thái trước lệnh (ngăn xếp là LIFO).
// Gộp: trong một cử chỉ (beginGesture → endGesture) các lệnh cùng `mergeKey` thành một mục; ngoài cử chỉ (bàn phím trên thanh trượt)
// các lệnh cùng `mergeKey` cách nhau ≤ MERGE_WINDOW_MS cũng gộp.

export interface Command<D> {
  type: string;
  /** Khoá i18n của tên thao tác (hiện ở tooltip nút Hoàn tác/Làm lại). */
  label: string;
  mergeKey?: string;
  redo(d: D): D;
  undo(d: D): D;
  /** Giá trị trước/sau (JSON-hoá được) để biết lệnh đã gộp có thành no-op không, để gộp đúng và để dựng nhãn lịch sử "trước → sau". */
  before: unknown;
  after: unknown;
  /** Tham số để dựng nhãn lúc hiển thị (id track, id widget, id bộ dựng sẵn…); nhãn không lưu chuỗi đã dịch nên đổi ngôn ngữ thì nhãn đổi theo. */
  params?: Readonly<Record<string, unknown>>;
}

export interface History<D = unknown> {
  canUndo: boolean; canRedo: boolean;
  /** Tên (khoá i18n) của thao tác sẽ được hoàn tác / làm lại. */
  undoLabel?: string; redoLabel?: string;
  /** Số mục đang có (để test/hiển thị). */
  undoCount: number; redoCount: number;
  /** Toàn bộ dòng thời gian một nhánh: các bước đã làm (cũ → mới) rồi các bước có thể làm lại (gần → xa). `position` = số bước đã làm. */
  timeline: readonly Command<D>[];
  position: number;
}
export interface StoreState<D> { doc: D; history: History<D> }

export const HISTORY_LIMIT = 100;
export const MERGE_WINDOW_MS = 600;

interface Entry<D> { cmd: Command<D>; gesture: number | null; at: number }

export interface Store<D> {
  get(): D;
  /** Ảnh chụp ổn định cho useSyncExternalStore: đổi tham chiếu khi và chỉ khi doc hoặc lịch sử đổi. */
  state(): StoreState<D>;
  dispatch(cmd: Command<D> | null): void;
  undo(): void; redo(): void;
  /** Lùi/tiến liên tiếp tới `position` (0 = mốc đầu, trước mọi lệnh; `history.timeline.length` = bước mới nhất). Một lần cập nhật. */
  jumpTo(position: number): void;
  beginGesture(): void; endGesture(): void;
  /** Đặt lại tài liệu và xoá toàn bộ lịch sử (nạp dự án mới). */
  reset(doc: D): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<D>(initial: D, opts: { limit?: number; now?: () => number } = {}): Store<D> {
  const limit = opts.limit ?? HISTORY_LIMIT;
  const now = opts.now ?? (() => Date.now());
  let doc = initial;
  let past: Entry<D>[] = [], future: Entry<D>[] = [];
  let gesture: number | null = null, gestureSeq = 0;
  const subs = new Set<() => void>();
  let snap: StoreState<D>;
  const build = (): StoreState<D> => ({
    doc,
    history: {
      canUndo: past.length > 0, canRedo: future.length > 0,
      undoLabel: past[past.length - 1]?.cmd.label, redoLabel: future[future.length - 1]?.cmd.label,
      undoCount: past.length, redoCount: future.length,
      timeline: [...past.map((e) => e.cmd), ...future.map((e) => e.cmd).reverse()], position: past.length,
    },
  });
  snap = build();
  const emit = () => { snap = build(); for (const f of [...subs]) f(); };

  const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

  const endGesture = () => {
    if (gesture === null) return;
    const g = gesture; gesture = null;
    // Kéo ra rồi kéo về đúng chỗ cũ: mục gộp thành no-op, bỏ đi.
    const top = past[past.length - 1];
    if (top && top.gesture === g && same(top.cmd.before, top.cmd.after)) { past.pop(); emit(); }
  };

  return {
    get: () => doc,
    state: () => snap,
    dispatch(cmd) {
      if (!cmd) return;
      doc = cmd.redo(doc);
      const t = now();
      const top = past[past.length - 1];
      if (cmd.mergeKey && top && top.cmd.mergeKey === cmd.mergeKey && future.length === 0 &&
          (gesture !== null ? top.gesture === gesture : top.gesture === null && t - top.at <= MERGE_WINDOW_MS)) {
        past[past.length - 1] = { cmd: { ...cmd, before: top.cmd.before, undo: top.cmd.undo }, gesture, at: t };
      } else {
        past.push({ cmd, gesture, at: t });
        if (past.length > limit) past.splice(0, past.length - limit);
      }
      future = [];
      emit();
    },
    undo() {
      endGesture();
      const e = past.pop(); if (!e) return;
      doc = e.cmd.undo(doc); future.push(e); emit();
    },
    redo() {
      endGesture();
      const e = future.pop(); if (!e) return;
      doc = e.cmd.redo(doc); past.push({ ...e, gesture: null }); emit();
    },
    jumpTo(position) {
      endGesture();
      const target = Math.max(0, Math.min(past.length + future.length, Math.trunc(position)));
      if (target === past.length) return;
      while (past.length > target) { const e = past.pop()!; doc = e.cmd.undo(doc); future.push(e); }
      while (past.length < target) { const e = future.pop()!; doc = e.cmd.redo(doc); past.push({ ...e, gesture: null }); }
      emit();
    },
    beginGesture() { if (gesture === null) gesture = ++gestureSeq; },
    endGesture,
    reset(next) { doc = next; past = []; future = []; gesture = null; emit(); },
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
  };
}
