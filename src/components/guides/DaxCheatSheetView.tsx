import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, Copy, Search } from 'lucide-react';
import { DAX_CATEGORIES, DAX_ENTRIES, DAX_PATTERNS, DaxCategory } from '../../data/daxCheatSheet';

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          // clipboard unavailable
        }
      }}
      aria-label="Copy code"
      title="Copy"
      className="shrink-0 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-white"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

export const DaxCheatSheetView: React.FC<{ onPractise: () => void }> = ({ onPractise }) => {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<DaxCategory | 'All' | 'Patterns'>('All');

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DAX_ENTRIES.filter(
      (e) =>
        (cat === 'All' || e.category === cat) &&
        (!q || [e.name, e.does, e.syntax, e.example, e.trap ?? ''].some((s) => s.toLowerCase().includes(q)))
    );
  }, [query, cat]);

  const patterns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DAX_PATTERNS.filter((p) => !q || [p.title, p.why, p.code].some((s) => s.toLowerCase().includes(q)));
  }, [query]);

  const showPatterns = cat === 'Patterns' || (cat === 'All' && patterns.length > 0);
  const showEntries = cat !== 'Patterns';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white">DAX cheat sheet</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            The functions PL-300 tests, with syntax, a real example and the trap to avoid.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div data-tour="dax-search" className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search functions"
              aria-label="Search DAX functions"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-accent-ink focus:outline-none"
            />
          </div>
          <button
            onClick={onPractise}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            Practise in the DAX lab
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['All', 'Patterns', ...DAX_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-md px-3.5 py-1.5 text-xs font-medium transition ${
              cat === c ? 'bg-accent text-on-accent' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {showPatterns && (
        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-400">Patterns worth memorising</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {patterns.map((p) => (
              <div key={p.title} className="min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="font-medium text-white">{p.title}</div>
                <p className="mt-0.5 text-xs text-slate-400">{p.why}</p>
                <div className="mt-2 flex items-start gap-1 rounded-xl bg-slate-950 p-3">
                  <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-[12px] leading-relaxed text-sky-200">{p.code}</pre>
                  <CopyButton text={p.code} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showEntries && (
        <section>
          {cat === 'All' && <h3 className="mb-2 text-sm font-bold text-slate-400">Functions</h3>}
          {entries.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">No functions match “{query}”.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {entries.map((e) => (
                <article key={e.name} className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-mono text-base font-semibold text-sky-300">{e.name}</h4>
                    <span className="shrink-0 rounded-md bg-slate-950 px-2 py-0.5 text-[10px] text-slate-400">{e.category}</span>
                  </div>
                  <code className="block break-words font-mono text-[11px] text-slate-400">{e.syntax}</code>
                  <p className="text-sm leading-relaxed text-slate-300">{e.does}</p>
                  <div className="flex items-start gap-1 rounded-xl bg-slate-950 p-2.5">
                    <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-sky-200">
                      {e.example}
                    </pre>
                    <CopyButton text={e.example} />
                  </div>
                  {e.trap && (
                    <p className="flex gap-2 rounded-xl bg-amber-500/10 p-2.5 text-xs leading-relaxed text-amber-200">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                      {e.trap}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
