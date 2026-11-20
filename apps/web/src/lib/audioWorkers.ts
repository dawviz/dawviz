// Tạo Worker sóng âm qua chính sách Trusted Types (NFR-SEC-06), như parseInWorker.ts.
import workerUrl from '../workers/audioPeaks.worker.ts?worker&url';
import spectrumUrl from '../workers/spectrum.worker.ts?worker&url';
import { spectrumFor, type SpectrumWorkerLike } from './spectrumClient.ts';
import { peaksFor, type PeaksWorkerLike } from './peaksClient.ts';
import { trustedWorkerURL } from './trustedTypes.ts';
import type { PcmBuffer } from './audioAsset.ts';

export const peaksInWorker = (id: string, buf: PcmBuffer) =>
  peaksFor(id, buf, () => new Worker(trustedWorkerURL(workerUrl) as string, { type: 'module' }) as unknown as PeaksWorkerLike);

/** Bảng đặc trưng phổ cho widget Audio Spectrum (T-53); tính trong Worker, đệm theo định danh tệp. */
export const spectrumInWorker = (id: string, buf: PcmBuffer) =>
  spectrumFor(id, buf, () => new Worker(trustedWorkerURL(spectrumUrl) as string, { type: 'module' }) as unknown as SpectrumWorkerLike);
