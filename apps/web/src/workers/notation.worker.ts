// Worker dựng bản nhạc (D-63): lượng tử + VexFlow engrave chạy ở đây để không chặn giao diện. Một yêu cầu một lần trả lời.
import { buildNotation, type NotationRequest } from '../lib/notation/buildNotation.ts';

export type NotationIn = { id: number; req: NotationRequest };
export type NotationOut = { id: number; layout?: ReturnType<typeof buildNotation>; error?: string };

self.onmessage = (e: MessageEvent<NotationIn>) => {
  const { id, req } = e.data;
  try { (self as unknown as Worker).postMessage({ id, layout: buildNotation(req) } satisfies NotationOut); }
  catch (err) { (self as unknown as Worker).postMessage({ id, error: err instanceof Error ? err.message : String(err) } satisfies NotationOut); }
};
