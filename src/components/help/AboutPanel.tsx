import React from 'react';
import { RotateCcw } from 'lucide-react';
import { APP_VERSION, CHANGELOG, DATA_SCHEMA, RELEASED } from '../../version';

export const AboutPanel: React.FC<{ onShowWhatsNew: () => void; onResetProgress: () => void }> = ({
  onShowWhatsNew,
  onResetProgress,
}) => (
  <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
    <div className="min-w-0 space-y-5">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-extrabold text-white">PL-300 Studio</h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-slate-500">Version</dt>
          <dd className="font-bold tabular-nums text-white" data-testid="app-version">
            {APP_VERSION}
          </dd>
          <dt className="text-slate-500">Released</dt>
          <dd className="text-slate-200">
            {new Date(RELEASED).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
          </dd>
          <dt className="text-slate-500">Progress format</dt>
          <dd className="text-slate-200">v{DATA_SCHEMA}</dd>
        </dl>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Updates arrive by themselves: the next time you open the app after a release, you get the new version, with a
          short note on what changed.
        </p>
        <button
          onClick={onShowWhatsNew}
          className="mt-4 rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-200 hover:border-slate-600"
        >
          Show what’s new
        </button>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="text-lg font-extrabold text-white">How versions work</h2>
        <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-400">
          <li>
            <span className="font-bold text-slate-200">App versions</span> are major.minor.patch. A patch is fixes only, a
            minor release adds something, and a major one changes how progress is stored or synced.
          </li>
          <li>
            <span className="font-bold text-slate-200">Synced progress</span> has its own numbered versions: every save
            from any device adds one. That’s how two devices avoid overwriting each other, and what you roll back to under
            Link devices.
          </li>
          <li>
            <span className="font-bold text-slate-200">Each synced save</span> also records the app version and device
            that made it, so the history shows where each change came from.
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-rose-500/30 p-5">
        <h2 className="text-lg font-extrabold text-white">Start over</h2>
        <p className="mt-1 text-sm text-slate-400">
          Clears all progress, notes and your own flashcards on this device. If sync is on, your linked devices get the
          empty progress too, but the previous version stays in the history to roll back to.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Reset all PL-300 study progress, notes and custom flashcards on this device?')) onResetProgress();
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
        >
          <RotateCcw className="h-4 w-4" />
          Reset progress
        </button>
      </section>
    </div>

    <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-lg font-extrabold text-white">Changelog</h2>
      <ol className="mt-4 space-y-6">
        {CHANGELOG.map((r) => (
          <li key={r.version} className="relative border-l-2 border-slate-800 pl-4">
            <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-accent" />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-base font-extrabold tabular-nums text-white">{r.version}</span>
              <span className="text-sm font-semibold text-slate-300">{r.title}</span>
              <span className="text-xs text-slate-500">
                {new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-slate-400">
              {r.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  </div>
);
