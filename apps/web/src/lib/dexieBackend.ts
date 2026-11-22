// Lớp mỏng bọc Dexie cho Backend lưu phiên (T-10). Chỉ nạp động qua lazyDexieBackend (workspaceStore.ts) để tách khỏi gói đầu (T-102).
import Dexie, { type Table } from 'dexie';
import { CURRENT_ID, type Backend, type StoredBlob, type WorkspaceState } from './workspaceStore.ts';

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
