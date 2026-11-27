import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  History,
  Laptop,
  Link2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Trash2,
  Unlink,
  Upload,
} from 'lucide-react';
import { UserProgress } from '../../types/pl300';
import { parseProgressJson } from '../../utils/progressHelpers';
import { cloudSync, deviceName, readCode, showCode, SyncVersion } from '../../sync/engine';
import { useSyncStatus, whenText } from '../../sync/useSyncStatus';
import { APP_VERSION } from '../../version';

interface Props {
  progress: UserProgress;
  onReplaceProgress: (p: UserProgress) => void;
}

type Note = { ok: boolean; text: string } | null;

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold transition disabled:opacity-50';
const primary = `${btn} bg-accent text-on-accent hover:bg-accent-hover`;
const secondary = `${btn} border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600`;

export const LinkDevicesPanel: React.FC<Props> = ({ progress, onReplaceProgress }) => {
  const status = useSyncStatus();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [typed, setTyped] = useState('');
  const [copied, setCopied] = useState(false);
  const [versions, setVersions] = useState<SyncVersion[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const act = async (name: string, fn: () => Promise<Note>) => {
    setBusy(name);
    setNote(null);
    try {
      setNote(await fn());
    } finally {
      setBusy(null);
    }
  };

  const begin = () =>
    act('begin', async () => {
      const r = await cloudSync.begin();
      return r.error
        ? { ok: false, text: r.error }
        : { ok: true, text: 'Sync is on. Enter the code below on your other device.' };
    });

  const join = () => {
    const code = readCode(typed);
    if (!code) {
      setNote({ ok: false, text: 'That isn’t a whole code. It’s 20 letters and numbers, like 7KQM-4RZT-9WXB-2HNE-P3VD.' });
      return;
    }
    return act('join', async () => {
      const r = await cloudSync.join(code);
      if (r.error) return { ok: false, text: r.error };
      setTyped('');
      return { ok: true, text: 'Linked. This device now shares progress with your other ones.' };
    });
  };

  const syncNow = () =>
    act('now', async () => {
      const r = await cloudSync.now();
      if (versions) setVersions(await cloudSync.versions().catch(() => versions));
      return r.error ? { ok: false, text: r.error } : { ok: true, text: r.changed ? 'Brought in changes from another device.' : 'Up to date.' };
    });

  const stop = () => {
    if (!window.confirm('Stop syncing on this device? Your progress here stays, and so does the synced copy for your other devices.')) return;
    cloudSync.stop();
    setVersions(null);
    setNote({ ok: true, text: 'Sync is off on this device.' });
  };

  const erase = () => {
    if (
      !window.confirm(
        'Erase the synced copy and all its saved versions from the server? Every linked device stops syncing. The progress on each device stays. This can’t be undone.'
      )
    )
      return;
    return act('erase', async () => {
      const r = await cloudSync.erase();
      setVersions(null);
      return r.error ? { ok: false, text: r.error } : { ok: true, text: 'The synced copy is erased.' };
    });
  };

  const loadVersions = () =>
    act('versions', async () => {
      try {
        setVersions(await cloudSync.versions());
        return null;
      } catch (err) {
        return { ok: false, text: err instanceof Error ? err.message : String(err) };
      }
    });

  const rollBack = (v: SyncVersion) => {
    if (
      !window.confirm(
        `Roll back to version ${v.version}, saved ${whenText(v.savedAt)}? It becomes the newest version on every linked device. The current one stays in the history, so you can undo this.`
      )
    )
      return;
    return act(`restore-${v.version}`, async () => {
      const r = await cloudSync.restore(v.version);
      setVersions(await cloudSync.versions().catch(() => versions));
      return r.error ? { ok: false, text: r.error } : { ok: true, text: `Rolled back to version ${v.version}.` };
    });
  };

  const copyCode = async () => {
    if (!status.code) return;
    try {
      await navigator.clipboard.writeText(showCode(status.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNote({ ok: false, text: 'Couldn’t copy. Select the code and copy it by hand.' });
    }
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify({ app: APP_VERSION, progress }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pl300-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNote({ ok: true, text: 'Backup downloaded.' });
  };

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      // Backups from 2.0 wrap the progress; older ones are the progress itself.
      const parsed = parseProgressJson(JSON.stringify(raw && raw.progress ? raw.progress : raw));
      const extra = status.on ? ' Sync is on, so your linked devices get it too.' : '';
      if (!window.confirm(`Replace the progress on this device with ${file.name}?${extra}`)) return;
      onReplaceProgress(parsed);
      setNote({ ok: true, text: `Restored from ${file.name}.` });
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? `That file didn’t load: ${err.message}` : 'That file didn’t load.' });
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="min-w-0 space-y-5">
        {/* ===== Sync controls ===== */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5" data-tour="sync-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-white">Sync across devices</h2>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                status.on ? 'bg-accent/15 text-accent-ink' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {status.on ? 'On' : 'Off'}
            </span>
          </div>

          {!status.on ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Your progress lives in this browser. Turn sync on to share it with your phone, a work laptop or any other
                browser. You get a sync code; there’s no account and no email.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-800 p-4">
                  <Laptop className="h-5 w-5 text-accent-ink" />
                  <h3 className="mt-2 text-sm font-bold text-white">First device</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Start here on the device with the progress you want to keep.
                  </p>
                  <button onClick={begin} disabled={busy !== null} className={`${primary} mt-3 w-full`}>
                    {busy === 'begin' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Get a sync code
                  </button>
                </div>
                <div className="rounded-lg border border-slate-800 p-4">
                  <Smartphone className="h-5 w-5 text-accent-ink" />
                  <h3 className="mt-2 text-sm font-bold text-white">Another device</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Type the code your first device shows. Anything done here is kept and merged in.
                  </p>
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void join();
                    }}
                  >
                    <input
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                      aria-label="Sync code"
                      autoComplete="off"
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm uppercase text-white placeholder-slate-600 focus:border-accent-ink focus:outline-none"
                    />
                    <button type="submit" disabled={busy !== null || !typed.trim()} className={primary}>
                      {busy === 'join' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link'}
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-400">Enter this code on any device you want to link:</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code
                  className="select-all rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 font-mono text-lg font-semibold tracking-wider text-white sm:text-xl"
                  data-testid="sync-code"
                >
                  {status.code ? showCode(status.code) : ''}
                </code>
                <button onClick={copyCode} className={secondary}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Treat it like a password: anyone with the code can see and change this progress.
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-slate-500">Last synced</dt>
                  <dd className="font-bold text-white">{status.busy ? 'Syncing…' : whenText(status.lastSynced)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Version</dt>
                  <dd className="font-bold tabular-nums text-white">{status.version || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">This device</dt>
                  <dd className="truncate font-bold text-white">{deviceName()}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={syncNow} disabled={busy !== null} className={primary}>
                  <RefreshCw className={`h-4 w-4 ${busy === 'now' || status.busy ? 'animate-spin' : ''}`} />
                  Sync now
                </button>
                <button onClick={loadVersions} disabled={busy !== null} className={secondary}>
                  <History className="h-4 w-4" />
                  {versions ? 'Refresh history' : 'Version history'}
                </button>
                <button onClick={stop} disabled={busy !== null} className={secondary}>
                  <Unlink className="h-4 w-4" />
                  Stop on this device
                </button>
                <button
                  onClick={erase}
                  disabled={busy !== null}
                  className={`${btn} text-rose-300 hover:bg-rose-500/10`}
                >
                  <Trash2 className="h-4 w-4" />
                  Erase synced copy
                </button>
              </div>
            </>
          )}

          {(note || status.error) && (
            <p
              role="status"
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                (note && !note.ok) || (!note && status.error)
                  ? 'bg-rose-500/10 text-rose-300'
                  : 'bg-accent/10 text-accent-ink'
              }`}
            >
              {note ? note.text : status.error}
            </p>
          )}
        </section>

        {/* ===== Version history ===== */}
        {status.on && versions && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-lg font-extrabold text-white">Version history</h2>
            <p className="mt-1 text-sm text-slate-400">
              Every sync saves a new numbered version. The server keeps the current one and the 15 before it. Rolling
              back makes an old version the newest again, so nothing is lost.
            </p>
            {versions.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Nothing saved yet.</p>
            ) : (
              <ol className="mt-4 divide-y divide-slate-800">
                {versions.map((v) => (
                  <li key={v.version} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <span className="w-12 font-display text-lg font-extrabold tabular-nums text-white">v{v.version}</span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block text-slate-200">
                        {whenText(v.savedAt)}
                        {v.current && (
                          <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-xs font-bold text-accent-ink">
                            current
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {v.device ?? 'Unknown device'}
                        {v.app ? ` · app ${v.app}` : ''} · {(v.bytes / 1024).toFixed(1)} KB
                      </span>
                    </span>
                    {!v.current && (
                      <button onClick={() => rollBack(v)} disabled={busy !== null} className={`${secondary} py-1.5 text-xs`}>
                        {busy === `restore-${v.version}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        Roll back
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {/* ===== File backups ===== */}
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-white">Backup file</h2>
          <p className="mt-1 text-sm text-slate-400">
            Save your progress as a file, or load one back. Handy before a big change, or where sync is blocked.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={exportFile} className={secondary}>
              <Download className="h-4 w-4" />
              Download backup
            </button>
            <button onClick={() => fileRef.current?.click()} className={secondary}>
              <Upload className="h-4 w-4" />
              Load a backup
            </button>
            <input ref={fileRef} type="file" accept=".json,application/json" onChange={importFile} className="hidden" />
          </div>
        </section>
      </div>

      {/* ===== Setup guide ===== */}
      <aside className="min-w-0 space-y-5">
        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-white">How to link a device</h2>
          <ol className="mt-4 space-y-4">
            {SETUP_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-black text-on-accent">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-extrabold text-white">Good to know</h2>
          <div className="mt-3 divide-y divide-slate-800">
            {SYNC_FAQ.map((f) => (
              <details key={f.q} className="group py-3">
                <summary className="cursor-pointer list-none text-sm font-bold text-slate-200 marker:hidden">
                  <span className="mr-2 inline-block text-accent-ink transition group-open:rotate-90">›</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-4 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
};

const SETUP_STEPS = [
  {
    title: 'Start on your main device',
    text: 'On the device with the progress you care about, open Help → Link devices and press Get a sync code. Its progress becomes version 1.',
  },
  {
    title: 'Copy the code across',
    text: 'You get 20 letters and numbers in groups of four. Copy it, or just read it off the screen: case, dashes and spaces don’t matter, and O and 0 count as the same.',
  },
  {
    title: 'Link the other device',
    text: 'Open PL-300 Studio on your phone (or any browser), go to Help → Link devices, type the code under Another device and press Link.',
  },
  {
    title: 'Study anywhere',
    text: 'From now on each device sends its changes a few seconds after you stop, and picks up the others’ when you open the app, come back to the tab or move between pages.',
  },
  {
    title: 'Check or roll back',
    text: 'Version history lists recent saves with the device and time. Roll back if something went wrong; the newer copy stays in the history.',
  },
];

const SYNC_FAQ = [
  {
    q: 'What gets synced?',
    a: 'Everything in your progress: ticked skills, watched videos, module notes, question history, finished labs, case study scores, drill stats, flashcard boxes and your own flashcards. Your theme, Power Query Lab drafts and which page you were on stay on each device.',
  },
  {
    q: 'What if I use two devices at the same time?',
    a: 'Each save says which version it was built on. If another device saved in between, the server refuses it; this device loads the newer copy, merges the two and tries again. Merging keeps everything done on both sides: ticked skills are combined, the most recent answer or flashcard rating wins, the higher case study score wins, and drill attempts from both sides are added up.',
  },
  {
    q: 'I unticked something and it came back.',
    a: 'That happens only when both devices changed things before either synced, because merging keeps anything either side has done. Untick it again; once the devices are in step, unticking carries over like any other change.',
  },
  {
    q: 'Is my progress private?',
    a: 'There’s no name or email attached. The server stores your progress under a fingerprint (SHA-256) of the code, not the code itself, and only lets the app load, save, list versions or erase by code. Anyone who has the code can open the progress, so keep it to yourself.',
  },
  {
    q: 'What happens offline?',
    a: 'Nothing breaks: the app never waits for the network. Changes stay in the browser and go out when you’re back online.',
  },
  {
    q: 'How do I stop?',
    a: 'Stop on this device turns sync off here and leaves the copy for your other devices. Erase synced copy deletes it and all its versions from the server, and the other devices stop syncing the next time they check. Progress on each device is never deleted by either.',
  },
  {
    q: 'It says the sync server can’t be reached.',
    a: 'Some work and school networks block it. Your progress is safe in the browser; use a backup file, or sync once you’re on another network.',
  },
];
