import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Loader2,
  Play,
  Table2,
  XCircle,
} from 'lucide-react';
import { DaxChallenge } from '../../types/pl300';
import {
  DAX_RUN_CONFIG,
  DaxEngineState,
  DaxGrid,
  DaxModelInfo,
  DaxRunResult,
  getDaxModel,
  runDax,
  subscribeDaxEngine,
} from '../../utils/daxEngine';

interface DaxRunnerProps {
  challenge: DaxChallenge;
  slots: (string | null)[];
  revealed: boolean;
  onSolved: () => void;
}

function assemble(challenge: DaxChallenge, fill: (string | null)[]): string {
  return challenge.templateParts
    .map((p) => (p.startsWith('__SLOT_') ? fill[Number(p.replace(/\D/g, ''))] ?? '___' : p))
    .join('');
}

const GridTable: React.FC<{ grid: DaxGrid; title: string; wrong?: Set<string> }> = ({
  grid,
  title,
  wrong,
}) => {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-3 py-2 text-xs font-bold text-slate-400">
        {title}
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-slate-900 text-slate-300">
            <tr>
              {grid.header.map((h, i) => (
                <th
                  key={i}
                  className={`whitespace-nowrap px-3 py-1.5 font-semibold ${
                    grid.align[i] === 'r' ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {grid.rows.map((row, r) => {
              const label = row[0] ?? '';
              const isTotal = grid.total && r === grid.rows.length - 1;
              const bad = wrong?.has(isTotal ? 'Total' : String(label));
              return (
                <tr
                  key={r}
                  className={`${isTotal ? 'font-semibold text-white' : 'text-slate-300'} ${
                    bad ? 'bg-rose-500/10' : ''
                  }`}
                >
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={`whitespace-nowrap px-3 py-1.5 font-mono ${
                        grid.align[c] === 'r' ? 'text-right' : 'text-left'
                      } ${bad && c === row.length - 1 ? 'text-rose-300' : ''}`}
                    >
                      {cell ?? ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DaxRunner: React.FC<DaxRunnerProps> = ({ challenge, slots, revealed, onSolved }) => {
  const config = DAX_RUN_CONFIG[challenge.id] ?? {};
  const reference = assemble(challenge, challenge.correctSlots);
  const fromSlots = assemble(challenge, slots);
  const slotsFilled = slots.every((s) => s !== null);

  const [mode, setMode] = useState<'slots' | 'write'>('slots');
  const [code, setCode] = useState(fromSlots);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DaxRunResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [engine, setEngine] = useState<{ state: DaxEngineState; text: string }>({
    state: 'idle',
    text: '',
  });
  const [model, setModel] = useState<DaxModelInfo | null>(null);
  const [showModel, setShowModel] = useState(false);

  useEffect(() => subscribeDaxEngine((state, text) => setEngine({ state, text })), []);

  // Keep the editor in step with the slots until the learner starts typing.
  const [edited, setEdited] = useState(false);
  useEffect(() => {
    if (!edited) setCode(fromSlots);
  }, [fromSlots, edited]);

  const run = async () => {
    const src = mode === 'slots' ? fromSlots : code;
    setBusy(true);
    setFailure(null);
    try {
      const res = await runDax({ code: src, reference, rows: config.rows, kind: config.kind });
      setResult(res);
      if (res.ok && !revealed) onSolved();
    } catch (err) {
      setResult(null);
      setFailure(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleModel = async () => {
    const next = !showModel;
    setShowModel(next);
    if (next && !model) {
      try {
        setModel(await getDaxModel());
      } catch (err) {
        setFailure(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const canRun = !busy && (mode === 'write' ? code.trim().length > 0 : slotsFilled);
  const firstRun = engine.state === 'idle' || engine.state === 'error';
  const wrong = new Set(result?.wrongRows ?? []);

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-white">
            <Database className="h-4 w-4 text-accent-ink" />
            Run it on sample data
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Evaluated by the DAX engine from databites, running in your browser over a small
            Sales / Product / Customer / Date model.{' '}
            <a href="#/matrix/dax" className="font-medium text-accent-ink hover:underline">
              DAX cheat sheet
            </a>
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs font-medium">
          {(['slots', 'write'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 transition ${
                mode === m ? 'bg-accent text-on-accent' : 'text-slate-300 hover:text-white'
              }`}
            >
              {m === 'slots' ? 'Use my slots' : 'Write it myself'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'slots' ? (
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-sky-200">
          {fromSlots}
        </pre>
      ) : (
        <div className="space-y-1.5">
          <textarea
            value={code}
            onChange={(e) => {
              setEdited(true);
              setCode(e.target.value);
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canRun) {
                e.preventDefault();
                run();
              }
            }}
            spellCheck={false}
            rows={4}
            aria-label="DAX formula"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-sky-200 focus:border-accent-ink focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>Ctrl + Enter to run. Get it right here and the lab counts as done.</span>
            {edited && (
              <button
                onClick={() => {
                  setEdited(false);
                  setCode(fromSlots);
                }}
                className="text-slate-400 underline hover:text-white"
              >
                Reset to my slots
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={!canRun}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-xs font-bold text-on-accent transition hover:bg-accent-hover disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {firstRun && !busy ? 'Load engine & run' : 'Run'}
        </button>
        <button
          onClick={toggleModel}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
        >
          <Table2 className="h-3.5 w-3.5" />
          Model
          {showModel ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <span className="text-[11px] text-slate-500">
          {mode === 'slots' && !slotsFilled
            ? 'Fill every slot to run it, or switch to Write it myself.'
            : engine.state === 'loading'
            ? `${engine.text} (first run downloads ~12 MB, then it's cached)`
            : firstRun
            ? 'First run downloads the Python runtime (~12 MB), then it is cached.'
            : ''}
        </span>
      </div>

      {showModel && (
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs">
          {!model ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading the model…
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-300">
                {model.relationships.map((r) => (
                  <span key={r} className="font-mono text-[11px]">
                    {r}
                  </span>
                ))}
                {model.measures.map((m) => (
                  <span key={m} className="font-mono text-[11px] text-sky-300">
                    {m}
                  </span>
                ))}
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {model.tables.map((t) => (
                  <div key={t.name} className="min-w-0 overflow-hidden rounded-xl border border-slate-800">
                    <div className="flex justify-between border-b border-slate-800 bg-slate-900 px-3 py-1.5 font-semibold text-slate-200">
                      <span>{t.name}</span>
                      <span className="font-normal text-slate-500">{t.count} rows</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead className="text-slate-400">
                          <tr>
                            {t.header.map((h) => (
                              <th key={h} className="whitespace-nowrap px-2 py-1 text-left font-medium">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-slate-300">
                          {t.rows.map((r, i) => (
                            <tr key={i}>
                              {r.map((v, j) => (
                                <td key={j} className="whitespace-nowrap px-2 py-1 font-mono">
                                  {v ?? ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {failure && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <span>
            The DAX engine couldn&apos;t start: {failure}. It needs an internet connection the first
            time, to download the Python runtime.
          </span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
              result.ok
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            )}
            <div className="space-y-1">
              <div className="font-semibold">{result.summary}</div>
              {result.error && <div className="font-mono text-[11px]">{result.error}</div>}
              {result.ok && revealed && (
                <div className="text-[11px] opacity-80">
                  The solution was revealed, so this run isn&apos;t counted.
                </div>
              )}
            </div>
          </div>
          {(result.got || result.expected) && (
            <div className="grid gap-3 lg:grid-cols-2">
              {result.got && <GridTable grid={result.got} title="Your formula" wrong={wrong} />}
              {result.expected && <GridTable grid={result.expected} title="Reference answer" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
