import React, { useEffect } from 'react';
import { CHANGELOG, compareVersions, Release } from '../version';

const SEEN_KEY = 'pl300_seen_version';

export function readSeenVersion(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

export function writeSeenVersion(v: string) {
  try {
    localStorage.setItem(SEEN_KEY, v);
  } catch {
    /* storage blocked */
  }
}

/** The releases newer than `seen` (all of them back to 1.0 would be too much: at most three). */
export function releasesSince(seen: string): Release[] {
  return CHANGELOG.filter((r) => compareVersions(r.version, seen) > 0).slice(0, 3);
}

export const WhatsNew: React.FC<{ releases: Release[]; onClose: () => void; onOpen?: (hash: string) => void }> = ({
  releases,
  onClose,
  onOpen,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const latest = releases[0];
  if (!latest) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="whatsnew-title">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <p className="text-sm font-semibold text-accent-ink">
          What’s new in {latest.version}
        </p>
        <h2 id="whatsnew-title" className="mt-1 text-xl font-extrabold text-white">
          {latest.title}
        </h2>
        {releases.map((r, n) => (
          <div key={r.version} className={n ? 'mt-4 border-t border-slate-800 pt-4' : 'mt-3'}>
            {n > 0 && (
              <h3 className="mb-1.5 text-sm font-bold text-slate-300">
                {r.version}: {r.title}
              </h3>
            )}
            <ul className="space-y-2">
              {r.changes.map((c) => (
                <li key={c} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {latest.version === '2.0.0' && onOpen && (
            <button
              onClick={() => onOpen('#/help/devices')}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:border-slate-600"
            >
              Link a device
            </button>
          )}
          <button onClick={onClose} autoFocus className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-on-accent hover:bg-accent-hover">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
