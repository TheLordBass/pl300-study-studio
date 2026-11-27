/* Sync across devices (Help → Link devices), off unless you turn it on.

   Ported from databites' js/sync.js. Progress still lives in this browser
   first: sync copies it to one row of a small Supabase table, under a sync
   code, and back. No account and no email: the code is the key, so it's long
   and random. The database side, and why the app can only load, save, list
   versions, load a version or delete by code, is supabase/pl300_sync.sql.

   Versions: every save names the version it was based on. If another device
   saved in between, the save is refused, and this device loads that copy,
   folds it in (mergeProgress) and tries again, so neither device wipes the
   other. The server keeps the last 15 versions it replaced, for rolling back.

   When: the app never waits on the network. Changes go out a few seconds
   after they stop, and when you leave the tab. It looks for changes when the
   app opens, when you come back to it, when you go back online, and as you
   move between pages (at most once a minute). */

import { UserProgress } from '../types/pl300';
import { normalizeProgress } from '../utils/progressHelpers';
import { APP_VERSION, DATA_SCHEMA } from '../version';
import { Counters, isEmptyProgress, mergeProgress } from './merge';

// The same Supabase project as databites. A publishable key is public by
// design: all it can do is call the functions the SQL file grants.
const API = 'https://hmuoqjdmwmsvfugiapmm.supabase.co/rest/v1/rpc';
const KEY = 'sb_publishable_reL9IMk86QZw43djXLu_2Q_P3uXJ3-s';

const META_KEY = 'pl300_sync_meta_v1';
const SEND_AFTER = 4000;          // ms of quiet after a change before sending it
const LOOK_EVERY = 60000;         // at most this often when moving between pages

// Crockford's base32: no I, L, O or U, so no character reads as another.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LENGTH = 20;           // 100 random bits

/** This device's side of the sync. */
interface Meta {
  code: string;
  version: number;                // the server version this device last agreed with
  sig: string | null;             // fingerprint of the progress at that point
  base: Counters | null;          // drill counters at that point, for merging
  at?: number;                    // when it last synced
}

/** What's stored in the row: the progress plus where it came from. */
interface Payload {
  schema: number;
  app: string;
  device: string;
  progress: UserProgress;
}

export interface SyncVersion {
  version: number;
  savedAt: string;
  device: string | null;
  app: string | null;
  bytes: number;
  current: boolean;
}

export interface SyncStatus {
  on: boolean;
  code: string | null;
  version: number;
  busy: boolean;
  lastSynced: number | null;
  error: string;
}

/* ── The code ─────────────────────────────────────────────── */

export function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => ALPHABET[b & 31]).join('');
}

/** What someone typed, read as a code: case, spaces and dashes don't matter,
    and O, I and L count as 0, 1 and 1. Null if it isn't a whole code. */
export function readCode(text: string): string | null {
  const raw = String(text || '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  return raw.length === CODE_LENGTH && [...raw].every((ch) => ALPHABET.includes(ch)) ? raw : null;
}

/** 7KQM-4RZT-9WXB-2HNE-P3VD: in fours, so it's easy to type and check. */
export const showCode = (code: string) => (code.match(/.{1,4}/g) ?? []).join('-');

/** A rough name for this device, so the version list says where each save came from. */
export function deviceName(): string {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/i.test(ua)
    ? 'iPhone/iPad'
    : /Windows/i.test(ua)
    ? 'Windows'
    : /Mac OS X/i.test(ua)
    ? 'Mac'
    : /Linux/i.test(ua)
    ? 'Linux'
    : 'Device';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Firefox\//.test(ua)
    ? 'Firefox'
    : /Chrome\//.test(ua)
    ? 'Chrome'
    : /Safari\//.test(ua)
    ? 'Safari'
    : 'browser';
  return `${os} · ${browser}`;
}

/* ── This device's side ───────────────────────────────────── */

function readMeta(): Meta | null {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeMeta(meta: Meta | null) {
  try {
    if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
    else localStorage.removeItem(META_KEY);
  } catch {
    /* storage blocked: sync just won't stick */
  }
}

// A short fingerprint of what was last synced, so "anything new to send?" costs no request.
function fingerprint(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(36)}${(h1 >>> 0).toString(36)}:${text.length}`;
}

const counters = (p: UserProgress): Counters => ({ total: p.matrixStats.total, correct: p.matrixStats.correct });

/* ── The server ───────────────────────────────────────────── */

export class SyncError extends Error {}

async function call<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(`${API}/${fn}`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abort.signal,
    });
  } catch {
    throw new SyncError("Couldn't reach the sync server. Check your connection: a work or school network may block it.");
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    let detail = '';
    try {
      detail = (await response.json()).message || '';
    } catch {
      /* no reason given */
    }
    if (response.status === 404 || /could not find the function/i.test(detail)) {
      throw new SyncError(
        'Sync isn’t available yet: its database tables haven’t been created (supabase/pl300_sync.sql). Your progress here is safe.'
      );
    }
    throw new SyncError(
      `The sync server said no (${response.status}${detail ? `: ${detail}` : ''}). Your progress here is safe.`
    );
  }
  return response.json() as Promise<T>;
}

interface Row {
  data: Payload;
  version: number;
  updated_at: string;
}

const load = async (code: string) => (await call<Row[]>('pl300_sync_load', { code }))[0] || null;
const save = (code: string, payload: Payload, base: number) =>
  call<number | null>('pl300_sync_save', { code, payload, base });

const progressOf = (data: Payload | null | undefined): UserProgress =>
  normalizeProgress((data && typeof data === 'object' && data.progress) || {});

/* ── The engine ───────────────────────────────────────────── */

type Getter = () => UserProgress;
type Setter = (p: UserProgress) => void;

let getLocal: Getter | null = null;
let setLocal: Setter | null = null;
let running: Promise<RunResult> | null = null;
let again = false;
let lastCheck = 0;
let lastError = '';
let sendTimer: ReturnType<typeof setTimeout> | undefined;
let started = false;
const watchers = new Set<() => void>();

type RunResult = { changed: boolean; error?: string };

const tell = () => watchers.forEach((fn) => fn());

function current() {
  const progress = normalizeProgress(getLocal ? getLocal() : {});
  const payload: Payload = { schema: DATA_SCHEMA, app: APP_VERSION, device: deviceName(), progress };
  return { payload, progress, sig: fingerprint(JSON.stringify(progress)) };
}

/** Puts `p` in place on this device (and tells the app). */
function adopt(p: UserProgress) {
  setLocal?.(p);
}

// In step with `version`: what's here now is what the server has.
function settle(meta: Meta, version: number) {
  const { progress, sig } = current();
  Object.assign(meta, { version, sig, base: counters(progress) });
}

// The copy was deleted, on another device: this one stops syncing too.
function gone(meta: Meta): RunResult {
  if (meta.version > 0) {
    writeMeta(null);
    lastError =
      'Your synced copy was deleted on another device, so this one has stopped syncing too. Your progress here is untouched.';
  }
  return { changed: false };
}

/* One round. Clean (nothing new here since the last sync): see whether another
   device moved on, and if so take its copy as it is. Changed here: save on top
   of the version we know; refused means someone else saved first, so load
   theirs, merge, and go again. */
async function syncOnce(): Promise<RunResult> {
  const meta = readMeta();
  if (!meta) return { changed: false };
  let changed = false;
  let settled = false;

  for (let tries = 0; tries < 4 && !settled; tries++) {
    const { payload, sig } = current();
    if (sig === meta.sig) {
      const row = await load(meta.code);
      if (!row) return gone(meta);
      if (row.version !== meta.version) {
        adopt(progressOf(row.data));
        changed = true;
        settle(meta, row.version);
      }
      settled = true;
      break;
    }
    const version = await save(meta.code, payload, meta.version);
    if (version !== null) {
      Object.assign(meta, { version, sig, base: counters(payload.progress) });
      settled = true;
      break;
    }
    const row = await load(meta.code);
    if (!row) return gone(meta);
    const theirs = progressOf(row.data);
    adopt(mergeProgress(current().progress, theirs, meta.base));
    changed = true;
    // That copy is now the shared point: the next merge counts only what's new since.
    meta.version = row.version;
    meta.base = counters(theirs);
  }

  const still = readMeta();
  if (!settled) {
    // Four refusals in a row: another device is saving right now. What merged
    // in so far stays merged; the next round sends it.
    if (still && still.code === meta.code) writeMeta(meta);
    soon();
    throw new SyncError('Your other device is saving at the same moment. This one will try again shortly.');
  }
  meta.at = Date.now();
  // Stopped while this was on its way: don't bring it back.
  if (still && still.code === meta.code) writeMeta(meta);
  return { changed };
}

function run(): Promise<RunResult> {
  if (running) {
    again = true;
    return running;
  }
  lastError = '';
  running = syncOnce()
    .catch((err: unknown) => {
      lastError =
        err instanceof SyncError
          ? err.message
          : `Sync went wrong: ${err instanceof Error ? err.message : String(err)}. Your progress here is safe.`;
      return { changed: false, error: lastError };
    })
    .finally(() => {
      running = null;
      tell();
      if (again) {
        again = false;
        void run();
      }
    });
  tell();
  return running;
}

function check(minGap: number) {
  if (!readMeta()) return;
  if (Date.now() - lastCheck < minGap) return;
  lastCheck = Date.now();
  void run();
}

// After a change here: send it once things go quiet.
function soon() {
  clearTimeout(sendTimer);
  sendTimer = setTimeout(() => {
    const meta = readMeta();
    if (meta && current().sig !== meta.sig) void run();
  }, SEND_AFTER);
}

/* ── For the app ──────────────────────────────────────────── */

export const cloudSync = {
  /** Hooks sync into the app. Does nothing over the network until it's turned on. */
  start(get: Getter, set: Setter) {
    getLocal = get;
    setLocal = set;
    if (started) return;
    started = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check(30000);
      else {
        // Leaving the app: send anything new now, rather than in a few seconds.
        const meta = readMeta();
        if (meta && current().sig !== meta.sig) void run();
      }
    });
    window.addEventListener('online', () => check(0));
    window.addEventListener('hashchange', () => check(LOOK_EVERY));
    check(0);
  },

  /** The app calls this after every change to progress. */
  changed() {
    if (readMeta()) soon();
  },

  status(): SyncStatus {
    const meta = readMeta();
    return {
      on: Boolean(meta),
      code: meta?.code ?? null,
      version: meta?.version ?? 0,
      busy: Boolean(running),
      lastSynced: meta?.at ?? null,
      error: lastError,
    };
  },

  /** Calls fn whenever the status changes. Returns a stop function. */
  watch(fn: () => void) {
    watchers.add(fn);
    return () => {
      watchers.delete(fn);
    };
  },

  /** Sync now (the button). */
  now() {
    lastCheck = Date.now();
    return run();
  },

  /** A new code for this device's progress. */
  async begin(): Promise<RunResult> {
    writeMeta({ code: newCode(), version: 0, sig: null, base: null });
    const result = await cloudSync.now();
    if (result.error) {
      writeMeta(null);
      lastError = result.error;
      tell();
    }
    return result;
  },

  /** Joins the progress already saved under `code`, folding in anything done here. */
  async join(code: string): Promise<RunResult> {
    let row: Row | null;
    try {
      row = await load(code);
    } catch (err) {
      return { changed: false, error: err instanceof Error ? err.message : String(err) };
    }
    if (!row) return { changed: false, error: "There's no progress under that code. Check it against your other device." };
    // A device with nothing done yet takes the copy as it is; otherwise both
    // are folded together, and the next round sends the result back.
    const theirs = progressOf(row.data);
    const fresh = isEmptyProgress(current().progress);
    adopt(fresh ? theirs : mergeProgress(current().progress, theirs, null));
    const meta: Meta = { code, version: row.version, sig: null, base: counters(theirs) };
    if (fresh) settle(meta, row.version);
    writeMeta(meta);
    return cloudSync.now();
  },

  /** Stops syncing here. The synced copy stays, for the other devices. */
  stop() {
    clearTimeout(sendTimer);
    writeMeta(null);
    lastError = '';
    tell();
  },

  /** Erases the synced copy and its history, then stops syncing here. */
  async erase(): Promise<{ error?: string }> {
    const meta = readMeta();
    if (!meta) return {};
    try {
      await call('pl300_sync_delete', { code: meta.code });
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
    cloudSync.stop();
    return {};
  },

  /** Every version the server still keeps for this code, newest first. */
  async versions(): Promise<SyncVersion[]> {
    const meta = readMeta();
    if (!meta) return [];
    const rows = await call<
      { version: number; saved_at: string; device: string | null; app: string | null; bytes: number; current: boolean }[]
    >('pl300_sync_versions', { code: meta.code });
    return rows.map((r) => ({
      version: r.version,
      savedAt: r.saved_at,
      device: r.device,
      app: r.app,
      bytes: r.bytes,
      current: r.current,
    }));
  },

  /** Rolls everything back to `version`: it becomes the newest version, on every device. */
  async restore(version: number): Promise<RunResult> {
    const meta = readMeta();
    if (!meta) return { changed: false, error: 'Sync is off on this device.' };
    try {
      const data = await call<Payload | null>('pl300_sync_load_version', { code: meta.code, wanted: version });
      if (!data) return { changed: false, error: `Version ${version} isn’t kept any more.` };
      const restored = progressOf(data);
      for (let tries = 0; tries < 4; tries++) {
        const row = await load(meta.code);
        if (!row) return gone(meta);
        adopt(restored);
        const { payload, sig } = current();
        const saved = await save(meta.code, payload, row.version);
        if (saved !== null) {
          writeMeta({ ...meta, version: saved, sig, base: counters(restored), at: Date.now() });
          tell();
          return { changed: true };
        }
      }
      return { changed: true, error: 'Another device kept saving. Try the rollback again in a moment.' };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      tell();
      return { changed: false, error: lastError };
    }
  },
};
