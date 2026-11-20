/**
 * Client for the in-browser DAX engine (public/dax/worker.js).
 *
 * The engine is databites' Python DAX engine running on Pyodide. The worker
 * is created on first use, so nobody downloads the ~12 MB runtime unless they
 * actually run a formula.
 */

export interface DaxGrid {
  header: string[];
  rows: (string | null)[][];
  align: ('l' | 'r')[];
  count: number;
  total?: boolean;
}

export interface DaxRunResult {
  ok: boolean;
  summary: string;
  error?: string;
  measure?: string;
  expected?: DaxGrid;
  got?: DaxGrid;
  cells?: number;
  wrongRows?: string[];
}

export interface DaxModelInfo {
  tables: { name: string; count: number; header: string[]; rows: (string | number | null)[][] }[];
  relationships: string[];
  measures: string[];
}

export interface DaxRunPayload {
  code: string;
  reference: string;
  rows?: string[];
  kind?: 'measure' | 'rls';
}

export type DaxEngineState = 'idle' | 'loading' | 'ready' | 'error';

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();
const listeners = new Set<(state: DaxEngineState, text: string) => void>();
let state: DaxEngineState = 'idle';
let statusText = '';

function setState(next: DaxEngineState, text: string) {
  state = next;
  statusText = text;
  listeners.forEach((l) => l(state, statusText));
}

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(`${import.meta.env.BASE_URL}dax/worker.js`);
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data;
    if (msg?.type === 'status') {
      setState(msg.text === 'Ready' ? 'ready' : 'loading', msg.text);
      return;
    }
    const p = pending.get(msg?.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.ok) {
      if (state !== 'ready') setState('ready', 'Ready');
      p.resolve(msg.result);
    } else {
      if (state !== 'ready') setState('error', msg.error);
      p.reject(new Error(msg.error));
    }
  };
  worker.onerror = (e) => {
    setState('error', e.message || 'The DAX engine stopped unexpectedly.');
    pending.forEach((p) => p.reject(new Error(statusText)));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  setState('loading', 'Starting…');
  return worker;
}

function request<T>(type: string, payload?: unknown): Promise<T> {
  const w = getWorker();
  const id = ++nextId;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    w.postMessage({ id, type, payload });
  });
}

export const runDax = (payload: DaxRunPayload) => request<DaxRunResult>('run', payload);
export const getDaxModel = () => request<DaxModelInfo>('tables');

export function subscribeDaxEngine(fn: (state: DaxEngineState, text: string) => void) {
  listeners.add(fn);
  fn(state, statusText);
  return () => {
    listeners.delete(fn);
  };
}

/** How each PL-300 lab is shown in the sample-data matrix. */
export const DAX_RUN_CONFIG: Record<string, { rows?: string[]; kind?: 'measure' | 'rls' }> = {
  'dax-1': { rows: ["'Date'[YearQuarter]"] },
  'dax-2': { rows: ["'Date'[YearQuarter]"] },
  'dax-3': { rows: ['Product[Category]'] },
  'dax-4': { rows: ["'Date'[YearQuarter]"] },
  'dax-5': { rows: ['Product[Category]'] },
  'dax-6': { rows: ['Product[MarginTier]'] },
  'dax-7': { kind: 'rls' },
  'dax-8': { rows: ['Customer[CustomerName]'] },
};
