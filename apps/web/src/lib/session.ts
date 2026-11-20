// Keo dán giữa App, kho IndexedDB và Project Pack (T-10): đọc byte tệp (có nhớ), dựng Snapshot/Pack, đọc Pack thành dữ liệu mở phiên.
import { buildPack, readPack, safeName, type PackContents } from './projectPack.ts';
import type { StoredBlob, Snapshot } from './workspaceStore.ts';
import { hasImageExtension, imageExt } from './backgroundImage.ts';
import { sanitizeDraft, type TempoDraft, type TempoOverride } from './tempoRows.ts';

export interface SchemaItem { name: string; schema: object }
export interface SessionData {
  source: File; extras: File[]; schemas: SchemaItem[]; tempo: { override: TempoOverride; draft: TempoDraft } | null;
  scene: unknown; workspace: unknown; audio?: { file: File; offsetMs: number };
  /** Ảnh nền của phiên (T-21). */
  background?: File;
}
export interface SessionParts {
  title: string; source: File; extras: File[]; schemas: SchemaItem[]; tempo: { override: TempoOverride; draft: TempoDraft } | null;
  scene: unknown; workspace: unknown; audio: File | null; audioOffsetMs: number; background: File | null;
}

const cache = new WeakMap<Blob, Promise<Uint8Array>>();
/** Byte của tệp, đọc một lần cho mỗi đối tượng File (tự lưu mỗi 500 ms không được đọc lại tệp hàng chục MB). */
export const bytesOf = (f: Blob): Promise<Uint8Array> => {
  let p = cache.get(f);
  if (!p) { p = f.arrayBuffer().then((b) => new Uint8Array(b)); cache.set(f, p); }
  return p;
};

const SCHEMA_SUFFIX = '.schema.json';
const MIDI_RE = /\.midi?$/i;

export async function blobsOf(p: SessionParts): Promise<StoredBlob[]> {
  const out: StoredBlob[] = [];
  const add = async (id: string, f: File) => { const data = await bytesOf(f); out.push({ id, name: f.name, size: data.length, data }); };
  await add('source', p.source);
  if (p.audio) await add('audio', p.audio);
  if (p.background) await add('background', p.background);
  for (const [i, f] of p.extras.entries()) await add(`extra:${i}`, f);
  return out;
}

export async function snapshotOf(p: SessionParts): Promise<Snapshot> {
  return { title: p.title, ...(p.tempo ? { tempoOverride: p.tempo.override as never } : {}), audioOffsetMs: p.audioOffsetMs, scene: p.scene,
    workspace: { ...(p.workspace as object), schemas: p.schemas }, blobs: await blobsOf(p) };
}

export async function packOf(p: SessionParts, now: Date): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const assets = [
    ...(await Promise.all(p.extras.map(async (f) => ({ name: f.name, bytes: await bytesOf(f) })))),
    ...(p.background ? [{ name: `background.${imageExt(p.background.name)}`, bytes: await bytesOf(p.background) }] : []),
    ...p.schemas.map((s, i) => ({ name: `${safeName(s.name, 'schema')}-${i + 1}${SCHEMA_SUFFIX}`, bytes: enc.encode(JSON.stringify(s.schema)) })),
  ];
  return buildPack({
    title: p.title, now, scene: p.scene, workspace: { ...(p.workspace as object) }, source: { name: p.source.name, bytes: await bytesOf(p.source) },
    ...(p.tempo ? { tempoOverride: p.tempo.override as never } : {}),
    ...(p.audio ? { audio: { name: p.audio.name, bytes: await bytesOf(p.audio), offsetMs: p.audioOffsetMs } } : {}), assets,
  });
}

const toFile = (name: string, bytes: Uint8Array) => new File([bytes.slice().buffer as ArrayBuffer], name);

export async function sessionFromPack(bytes: Uint8Array): Promise<{ data: SessionData; warnings: PackContents['warnings'] }> {
  const c = await readPack(bytes);
  const dec = new TextDecoder();
  const extras: File[] = [], schemas: SchemaItem[] = [];
  let background: File | undefined;
  const warnings = [...c.warnings];
  for (const a of c.assets) {
    if (a.name.endsWith(SCHEMA_SUFFIX)) {
      try { const schema = JSON.parse(dec.decode(a.bytes)); if (schema && typeof schema === 'object') schemas.push({ name: String(schema.name ?? schema.id ?? a.name).slice(0, 60), schema }); } catch { warnings.push({ code: 'WARN_PACK_UNLISTED_FILE', message: `bỏ qua schema hỏng: ${a.name}`, details: { path: a.name } }); }
    } else if (MIDI_RE.test(a.name)) extras.push(toFile(a.name, a.bytes));
    else if (/^background\.[a-z]+$/.test(a.name) && hasImageExtension(a.name)) background = toFile(a.name, a.bytes);
  }
  const ws = (c.workspace ?? {}) as { tempoDraft?: unknown };
  const o = c.manifest.tempoOverride;
  return { warnings, data: {
    source: toFile(c.source.name, c.source.bytes), extras, schemas, scene: c.scene, workspace: c.workspace,
    tempo: o === undefined ? null : { override: o as TempoOverride, draft: sanitizeDraft(ws.tempoDraft) },
    ...(c.audio ? { audio: { file: toFile(c.audio.name, c.audio.bytes), offsetMs: c.audio.offsetMs } } : {}),
    ...(background ? { background } : {}),
  } };
}

/** Tải xuống một khối byte bằng Blob + liên kết (không cần quyền). */
export function downloadBytes(bytes: Uint8Array, fileName: string, type = 'application/zip'): void {
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
