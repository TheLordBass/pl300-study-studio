import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Code2, FlaskConical, Lightbulb, MapPin, Search } from 'lucide-react';
import { GUIDE_CATEGORIES, PQ_GUIDES } from '../../data/pqGuides';
import { DesktopMock, PqEditorMock } from './PqEditorMock';

export const PqGuidesView: React.FC<{ onOpenLab: () => void }> = ({ onOpenLab }) => {
  const [query, setQuery] = useState('');
  const [guideId, setGuideId] = useState(PQ_GUIDES[0].id);
  const [stepIdx, setStepIdx] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PQ_GUIDES.filter(
      (g) => !q || [g.title, g.where, g.summary, ...g.steps.map((s) => s.text), ...(g.tips ?? [])].some((s) => s.toLowerCase().includes(q))
    );
  }, [query]);

  const guide = PQ_GUIDES.find((g) => g.id === guideId) ?? PQ_GUIDES[0];
  const step = guide.steps[Math.min(stepIdx, guide.steps.length - 1)];

  useEffect(() => setStepIdx(0), [guideId]);

  const pick = (id: string) => {
    setGuideId(id);
    // On phones the list is above the guide; bring the guide into view.
    if (window.innerWidth < 1024) {
      setTimeout(() => document.getElementById('pq-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-medium text-white">Power Query: how to do it, and where to find it</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Step-by-step guides with a drawing of the Power BI Power Query Editor showing exactly what to click.
          </p>
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: unpivot, merge, errors…"
            aria-label="Search Power Query guides"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-accent-ink focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Guide list */}
        <nav aria-label="Guides" className="max-h-[340px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-3 lg:max-h-[calc(100vh-160px)] lg:sticky lg:top-20">
          {GUIDE_CATEGORIES.map((c) => {
            const gs = filtered.filter((g) => g.category === c);
            if (!gs.length) return null;
            return (
              <div key={c} className="mb-3">
                <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{c}</div>
                {gs.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => pick(g.id)}
                    aria-current={g.id === guide.id ? 'true' : undefined}
                    className={`block w-full rounded-md px-3 py-1.5 text-left text-sm transition ${
                      g.id === guide.id ? 'bg-accent/15 text-accent-ink' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {g.title}
                  </button>
                ))}
              </div>
            );
          })}
          {!filtered.length && <p className="p-3 text-sm text-slate-400">No guides match “{query}”.</p>}
        </nav>

        {/* Guide */}
        <article id="pq-guide" className="min-w-0 scroll-mt-20 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{guide.category}</div>
            <h3 className="mt-0.5 text-xl font-medium text-white">{guide.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">{guide.summary}</p>
            <div className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-ink">
              <MapPin className="h-3.5 w-3.5" />
              {guide.where}
            </div>
          </div>

          {/* Drawing */}
          <div className="space-y-2">
            {step.desktop ? (
              <DesktopMock highlight={step.desktop} badge={stepIdx + 1} />
            ) : (
              <PqEditorMock state={{ ...step.mock, badge: stepIdx + 1 }} scene={guide.scene} />
            )}
            <p className="text-[11px] text-slate-500">
              Drawing of the Power Query Editor in Power BI Desktop. The highlighted item is step {stepIdx + 1}.
            </p>
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <ol className="space-y-2">
              {guide.steps.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => setStepIdx(i)}
                    aria-current={i === stepIdx ? 'step' : undefined}
                    className={`flex w-full items-start gap-3 rounded-2xl p-3 text-left text-sm leading-relaxed transition ${
                      i === stepIdx ? 'bg-accent/10 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        i === stepIdx ? 'bg-accent text-on-accent' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span>{s.text}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-center justify-between">
              <button
                disabled={stepIdx === 0}
                onClick={() => setStepIdx((i) => i - 1)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              <span className="text-xs text-slate-500">
                Step {stepIdx + 1} of {guide.steps.length}
              </span>
              <button
                disabled={stepIdx >= guide.steps.length - 1}
                onClick={() => setStepIdx((i) => i + 1)}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover disabled:opacity-30"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {(guide.m || guide.tips?.length || guide.lab) && (
            <div className="grid gap-4 md:grid-cols-2">
              {guide.m && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Code2 className="h-4 w-4 text-sky-300" /> The M it writes
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-sky-200">
                    {guide.m}
                  </pre>
                </div>
              )}
              {(guide.tips?.length || guide.lab) && (
                <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-5">
                  {guide.tips?.map((t) => (
                    <p key={t} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                      {t}
                    </p>
                  ))}
                  {guide.lab && (
                    <button
                      onClick={onOpenLab}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                    >
                      <FlaskConical className="h-4 w-4 text-accent-ink" />
                      Practise it in the Power Query Lab
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
};
