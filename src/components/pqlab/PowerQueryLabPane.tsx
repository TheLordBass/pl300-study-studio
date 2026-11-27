import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Code2,
  Download,
  Eye,
  FileSpreadsheet,
  Lightbulb,
  ListChecks,
  RotateCcw,
  Sparkles,
  Table2,
  X,
  XCircle,
} from 'lucide-react';
import { PQ_SCENARIOS, PQScenario } from '../../pqlab/scenarios';
import { QueryRun, Step, advancedEditorText, newStep, runAll } from '../../pqlab/query';
import {
  CheckResult,
  ColType,
  DatePart,
  Op,
  PQTable,
  TYPE_ICON,
  TYPE_LABEL,
  TextFn,
  compareTables,
  display,
  isError,
} from '../../pqlab/table';
import { DialogKind, PqDialog } from './PqDialogs';

interface Props {
  completed: string[];
  onComplete: (scenarioId: string) => void;
}

type StepsByQuery = Record<string, Step[]>;
const DRAFT_KEY = 'pl300_pqlab_draft_';

function loadDraft(id: string): StepsByQuery {
  try {
    const raw = localStorage.getItem(DRAFT_KEY + id);
    return raw ? (JSON.parse(raw) as StepsByQuery) : {};
  } catch {
    return {};
  }
}
function saveDraft(id: string, steps: StepsByQuery) {
  try {
    localStorage.setItem(DRAFT_KEY + id, JSON.stringify(steps));
  } catch {
    // storage unavailable — the draft just isn't kept
  }
}

function solutionSteps(s: PQScenario): StepsByQuery {
  const out: StepsByQuery = {};
  Object.entries(s.solution).forEach(([q, ops]) => (out[q] = ops.map(newStep)));
  return out;
}

function toCsv(t: PQTable, withHeader: boolean): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : isError(v) ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = t.rows.map((r) => r.map(cell).join(','));
  return (withHeader ? [t.columns.map(cell).join(','), ...lines] : lines).join('\r\n');
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Ribbon ─────────────────────────────────────────────────────────

type MenuItem = { label: string; run: () => void; disabled?: boolean };
type RibbonButton = { label: string; run?: () => void; items?: MenuItem[]; disabled?: boolean; hint?: string };

const Ribbon: React.FC<{ tabs: Record<string, RibbonButton[]> }> = ({ tabs }) => {
  const names = Object.keys(tabs);
  const [tab, setTab] = useState(names[0]);
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div ref={ref} className="rounded-2xl bg-slate-900">
      <div className="flex gap-1 border-b border-slate-800 px-2 pt-1.5">
        {names.map((n) => (
          <button
            key={n}
            onClick={() => {
              setTab(n);
              setOpen(null);
            }}
            className={`rounded-t-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === n ? 'border-b-2 border-accent text-accent-ink' : 'text-slate-400 hover:text-white'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 p-2">
        {tabs[tab].map((b) => (
          <div key={b.label} className="relative">
            <button
              disabled={b.disabled}
              title={b.hint}
              onClick={() => {
                if (b.items) setOpen(open === b.label ? null : b.label);
                else {
                  setOpen(null);
                  b.run?.();
                }
              }}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-35 disabled:hover:bg-transparent"
            >
              {b.label}
              {b.items && <ChevronDown className="h-3 w-3" />}
            </button>
            {open === b.label && b.items && (
              <div className="absolute left-0 top-full z-30 mt-1 min-w-[190px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 py-1 shadow-xl">
                {b.items.map((it) => (
                  <button
                    key={it.label}
                    disabled={it.disabled}
                    onClick={() => {
                      setOpen(null);
                      it.run();
                    }}
                    className="block w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-35"
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Data grid ──────────────────────────────────────────────────────

const TYPES: ColType[] = ['text', 'number', 'whole', 'date', 'logical', 'any'];

const DataGrid: React.FC<{
  table: PQTable;
  selected: string[];
  onSelect?: (col: string, additive: boolean) => void;
  onType?: (col: string, type: ColType) => void;
  maxRows?: number;
}> = ({ table, selected, onSelect, onType, maxRows = 60 }) => {
  const [typeMenu, setTypeMenu] = useState<string | null>(null);
  const quality = table.columns.map((_, i) => {
    const n = table.rows.length || 1;
    const errs = table.rows.filter((r) => isError(r[i])).length;
    const empty = table.rows.filter((r) => r[i] === null || r[i] === '').length;
    return { valid: (n - errs - empty) / n, err: errs / n, empty: empty / n, errs };
  });
  return (
    <div className="overflow-auto rounded-2xl border border-slate-800 bg-slate-950" style={{ maxHeight: 420 }}>
      <table className="w-full border-collapse text-[12px]">
        <thead className="sticky top-0 z-10 bg-slate-900">
          <tr>
            <th className="w-8 border-b border-r border-slate-800 px-2 text-right text-slate-500" />
            {table.columns.map((c, i) => {
              const sel = selected.includes(c);
              return (
                <th
                  key={c + i}
                  className={`relative min-w-[110px] cursor-pointer border-b border-r border-slate-800 px-2 py-1.5 text-left font-semibold ${
                    sel ? 'bg-accent/15 text-accent-ink' : 'text-slate-200'
                  }`}
                  onClick={(e) => onSelect?.(c, e.ctrlKey || e.metaKey || e.shiftKey)}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title={`${TYPE_LABEL[table.types[i]]} — click to change type`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onType) setTypeMenu(typeMenu === c ? null : c);
                      }}
                      className="shrink-0 whitespace-pre rounded px-1 font-mono text-[9px] leading-[9px] text-slate-400 hover:bg-slate-800"
                    >
                      {TYPE_ICON[table.types[i]]}
                    </button>
                    <span className="truncate">{c}</span>
                  </div>
                  <div className="mt-1 flex h-1 overflow-hidden rounded-full bg-slate-800" title={`${Math.round(quality[i].valid * 100)}% valid, ${quality[i].errs} errors, ${Math.round(quality[i].empty * 100)}% empty`}>
                    <span className="bg-emerald-400" style={{ width: `${quality[i].valid * 100}%` }} />
                    <span className="bg-rose-400" style={{ width: `${quality[i].err * 100}%` }} />
                  </div>
                  {typeMenu === c && onType && (
                    <div className="absolute left-0 top-full z-30 mt-1 min-w-[170px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 py-1 font-normal shadow-xl">
                      {TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTypeMenu(null);
                            onType(c, t);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800"
                        >
                          <span className="w-6 whitespace-pre font-mono text-[9px] leading-[9px] text-slate-400">{TYPE_ICON[t]}</span>
                          {TYPE_LABEL[t]}
                        </button>
                      ))}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {table.rows.slice(0, maxRows).map((r, ri) => (
            <tr key={ri} className="hover:bg-slate-900/60">
              <td className="border-b border-r border-slate-800/70 px-2 py-1 text-right text-slate-500">{ri + 1}</td>
              {r.map((v, ci) => (
                <td
                  key={ci}
                  title={isError(v) ? v.error : undefined}
                  className={`whitespace-pre border-b border-r border-slate-800/70 px-2 py-1 font-mono ${
                    table.types[ci] === 'number' || table.types[ci] === 'whole' ? 'text-right' : ''
                  } ${
                    isError(v)
                      ? 'cursor-help font-semibold text-rose-300'
                      : v === null
                      ? 'italic text-slate-500'
                      : selected.includes(table.columns[ci])
                      ? 'bg-accent/5 text-slate-100'
                      : 'text-slate-200'
                  }`}
                >
                  {display(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.rows.length > maxRows && (
        <div className="px-3 py-2 text-[11px] text-slate-500">Showing {maxRows} of {table.rows.length} rows</div>
      )}
      {table.rows.length === 0 && <div className="px-3 py-6 text-center text-xs text-slate-500">No rows</div>}
    </div>
  );
};

// ── Main pane ──────────────────────────────────────────────────────

export const PowerQueryLabPane: React.FC<Props> = ({ completed, onComplete }) => {
  const [idx, setIdx] = useState(0);
  const scenario = PQ_SCENARIOS[idx];
  const picker = (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {PQ_SCENARIOS.map((s, i) => (
        <button
          key={s.id}
          onClick={() => setIdx(i)}
          className={`flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition ${
            i === idx ? 'bg-accent text-on-accent' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          {completed.includes(s.id) && (
            <CheckCircle2 aria-label="completed" className={`h-3.5 w-3.5 ${i === idx ? '' : 'text-emerald-300'}`} />
          )}
          {i + 1}. {s.title}
        </button>
      ))}
    </div>
  );
  // Keyed by scenario: each one mounts with its own fresh state and draft.
  return <ScenarioWorkspace key={scenario.id} scenario={scenario} picker={picker} onComplete={onComplete} />;
};

const ScenarioWorkspace: React.FC<{
  scenario: PQScenario;
  picker: React.ReactNode;
  onComplete: (scenarioId: string) => void;
}> = ({ scenario, picker, onComplete }) => {
  const [steps, setSteps] = useState<StepsByQuery>(() => loadDraft(scenario.id));
  const [active, setActive] = useState(scenario.check);
  const [viewStep, setViewStep] = useState<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [panel, setPanel] = useState<'target' | 'advanced' | null>(null);

  useEffect(() => {
    if (!revealed) saveDraft(scenario.id, steps);
  }, [scenario.id, steps, revealed]);

  const runs = useMemo(() => runAll(scenario.queries, (q) => steps[q] ?? []), [scenario, steps]);
  const target = useMemo(() => {
    const sol = solutionSteps(scenario);
    return runAll(scenario.queries, (q) => sol[q] ?? [])[scenario.check].output!;
  }, [scenario]);

  const run: QueryRun = runs[active];
  const lastIdx = run.steps.length - 1;
  const shownIdx = viewStep === null ? lastIdx : Math.min(viewStep, lastIdx);
  const shown = run.steps[shownIdx];
  const table = shown.table;
  const queryCols = table?.columns ?? [];
  const sel = selected.filter((c) => queryCols.includes(c));

  const addOp = (op: Op) => {
    setSteps((prev) => {
      const list = [...(prev[active] ?? [])];
      list.splice(shownIdx, 0, newStep(op)); // after the step being viewed (index 0 is Source)
      return { ...prev, [active]: list };
    });
    setViewStep(viewStep === null || shownIdx === lastIdx ? null : shownIdx + 1);
    setResult(null);
    setDialog(null);
  };

  const deleteStep = (i: number) => {
    setSteps((prev) => ({ ...prev, [active]: (prev[active] ?? []).filter((_, j) => j !== i - 1) }));
    setViewStep(null);
    setResult(null);
  };

  const selectCol = (c: string, additive: boolean) =>
    setSelected((s) => (additive ? (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]) : s.length === 1 && s[0] === c ? [] : [c]));

  const needCols = !sel.length;
  const needOne = sel.length !== 1;
  const noTable = !table;
  const quick = (op: Op) => () => addOp(op);
  const open = (k: DialogKind) => () => setDialog(k);
  const otherQueries = scenario.queries
    .filter((q) => q.name !== active)
    .map((q) => ({ name: q.name, columns: runs[q.name]?.output?.columns ?? [] }));

  const textItems = (['trim', 'clean', 'lower', 'upper', 'proper'] as TextFn[]).map((fn) => ({
    label: { trim: 'Trim', clean: 'Clean', lower: 'lowercase', upper: 'UPPERCASE', proper: 'Capitalize Each Word' }[fn],
    run: quick({ kind: 'formatText', columns: sel, fn }),
    disabled: needCols,
  }));

  const ribbon: Record<string, RibbonButton[]> = {
    Home: [
      { label: 'Choose Columns', run: quick({ kind: 'selectColumns', columns: sel }), disabled: needCols || noTable, hint: 'Keep only the selected columns' },
      { label: 'Remove Columns', run: quick({ kind: 'removeColumns', columns: sel }), disabled: needCols || noTable },
      {
        label: 'Remove Rows',
        disabled: noTable,
        items: [
          { label: 'Remove Top Rows…', run: open('removeTopRows') },
          { label: 'Remove Bottom Rows…', run: open('removeBottomRows') },
          { label: 'Remove Blank Rows', run: quick({ kind: 'removeBlankRows' }) },
          { label: 'Remove Duplicates', run: quick({ kind: 'removeDuplicates', columns: sel }), disabled: needCols },
          { label: 'Remove Errors', run: quick({ kind: 'removeErrors', columns: sel }), disabled: needCols },
        ],
      },
      { label: 'Filter Rows…', run: open('filterRows'), disabled: noTable },
      {
        label: 'Sort',
        disabled: needOne || noTable,
        items: [
          { label: 'Sort Ascending', run: quick({ kind: 'sort', column: sel[0], descending: false }) },
          { label: 'Sort Descending', run: quick({ kind: 'sort', column: sel[0], descending: true }) },
        ],
      },
      { label: 'Use First Row as Headers', run: quick({ kind: 'promoteHeaders' }), disabled: noTable },
      { label: 'Group By…', run: open('groupBy'), disabled: noTable },
      { label: 'Merge Queries…', run: open('merge'), disabled: noTable || !otherQueries.length },
      { label: 'Append Queries…', run: open('append'), disabled: noTable || !otherQueries.length },
    ],
    Transform: [
      {
        label: 'Data Type',
        disabled: needCols || noTable,
        items: TYPES.map((t) => ({ label: TYPE_LABEL[t], run: quick({ kind: 'changeType', columns: sel, type: t }) })),
      },
      { label: 'Rename…', run: open('renameColumn'), disabled: noTable },
      { label: 'Replace Values…', run: open('replaceValues'), disabled: noTable },
      { label: 'Split Column…', run: open('splitColumn'), disabled: noTable },
      { label: 'Format', disabled: needCols || noTable, items: textItems },
      { label: 'Fill Down', run: quick({ kind: 'fillDown', columns: sel }), disabled: needCols || noTable },
      {
        label: 'Unpivot',
        disabled: needCols || noTable,
        items: [
          {
            label: 'Unpivot Other Columns',
            run: quick({ kind: 'unpivot', keep: sel, attribute: 'Attribute', value: 'Value' }),
          },
          {
            label: 'Unpivot Columns (selected)',
            run: quick({ kind: 'unpivot', keep: queryCols.filter((c) => !sel.includes(c)), attribute: 'Attribute', value: 'Value' }),
          },
        ],
      },
      { label: 'Merge Columns…', run: open('mergeColumns'), disabled: sel.length < 2 || noTable, hint: 'Select two or more columns' },
    ],
    'Add Column': [
      { label: 'Custom Column…', run: open('customColumn'), disabled: noTable },
      { label: 'Conditional Column…', run: open('conditionalColumn'), disabled: noTable },
      {
        label: 'Date',
        disabled: needOne || noTable,
        items: (['year', 'month', 'quarter', 'day', 'monthName'] as DatePart[]).map((part) => ({
          label: { year: 'Year', month: 'Month', quarter: 'Quarter', day: 'Day', monthName: 'Name of Month' }[part],
          run: quick({ kind: 'datePart', column: sel[0], part }),
        })),
      },
    ],
  };

  const check = () => {
    const out = runs[scenario.check];
    if (!out.output) {
      setResult({ ok: false, issues: [`${scenario.check} has an error: ${out.error}`] });
      return;
    }
    const res = compareTables(out.output, target, scenario.checkOrder);
    setResult(res);
    if (res.ok && !revealed) onComplete(scenario.id);
  };

  const showSolution = () => {
    if (!window.confirm('Replace your steps with the solution? Solved this way, the scenario isn’t counted.')) return;
    setSteps(solutionSteps(scenario));
    setRevealed(true);
    setViewStep(null);
    setResult(null);
  };

  const reset = () => {
    if (!window.confirm('Clear all your applied steps for this scenario?')) return;
    setSteps({});
    setRevealed(false);
    setViewStep(null);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      {picker}

      {/* Brief */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent-ink" />
            <h2 className="text-lg font-medium text-white">{scenario.title}</h2>
            <span
              className={`rounded-md px-2.5 py-0.5 text-[11px] font-medium ${
                scenario.difficulty === 'Exam Trap'
                  ? 'bg-rose-500/15 text-rose-300'
                  : scenario.difficulty === 'Tricky'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-sky-500/15 text-sky-300'
              }`}
            >
              {scenario.difficulty}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{scenario.story}</p>
          <div className="flex flex-wrap gap-1.5">
            {scenario.skills.map((k) => (
              <span key={k} className="rounded-md bg-slate-950 px-2.5 py-0.5 text-[11px] text-slate-400">
                {k}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {scenario.queries
              .filter((q) => q.source.kind === 'file')
              .map((q) =>
                q.source.kind === 'file' ? (
                  <button
                    key={q.name}
                    onClick={() => {
                      const src = q.source as Extract<typeof q.source, { kind: 'file' }>;
                      download(src.file.replace(/\.xlsx$/, '.csv'), toCsv(src.table, src.format === 'csv'));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:bg-slate-800"
                    title="Download to practise the same steps in Power BI Desktop"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {q.source.file.replace(/\.xlsx$/, '.csv')}
                  </button>
                ) : null
              )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white">
            <ListChecks className="h-4 w-4 text-accent-ink" />
            The brief
          </h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-300">
            {scenario.tasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          {hintsShown > 0 && (
            <ul className="space-y-1.5">
              {scenario.hints.slice(0, hintsShown).map((h) => (
                <li key={h} className="flex gap-2 rounded-2xl bg-amber-500/10 p-2.5 text-xs leading-relaxed text-amber-200">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                  {h}
                </li>
              ))}
            </ul>
          )}
          <a href="#/matrix/pq" className="mr-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent-ink hover:underline">
            <Eye className="h-3.5 w-3.5" />
            Where’s this in Power BI? Open the guides
          </a>
          {hintsShown < scenario.hints.length && (
            <button onClick={() => setHintsShown((n) => n + 1)} className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
              <Lightbulb className="h-3.5 w-3.5" />
              {hintsShown ? 'Another hint' : 'Show a hint'}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <Ribbon tabs={ribbon} />

      <div className="grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)_240px]">
        {/* Queries */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Queries [{scenario.queries.length}]
          </div>
          <div className="flex gap-1 overflow-x-auto xl:flex-col">
            {scenario.queries.map((q) => (
              <button
                key={q.name}
                onClick={() => {
                  setActive(q.name);
                  setViewStep(null);
                  setSelected([]);
                }}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition ${
                  active === q.name ? 'bg-accent/15 text-accent-ink' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Table2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{q.name}</span>
                {runs[q.name]?.error && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Formula bar + grid */}
        <div className="min-w-0 space-y-2">
          <div className="flex items-start gap-2 rounded-2xl bg-slate-900 px-3 py-2 font-mono text-[11px] text-slate-300">
            <span className="italic text-slate-500">fx</span>
            <span className="min-w-0 flex-1 break-all">= {shown.m || '…'}</span>
          </div>
          {shown.error ? (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <div>
                <div className="font-medium">This step has an error</div>
                <div className="mt-1 font-mono text-xs">{shown.error}</div>
                <div className="mt-2 text-xs text-rose-200/80">Delete or fix the step in Applied Steps.</div>
              </div>
            </div>
          ) : table ? (
            <DataGrid
              table={table}
              selected={sel}
              onSelect={selectCol}
              onType={(c, t) => {
                setSelected([c]);
                addOp({ kind: 'changeType', columns: [c], type: t });
              }}
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              {table ? `${table.columns.length} columns, ${table.rows.length} rows` : ''}
              {sel.length ? ` · selected: ${sel.join(', ')}` : ' · click a header to select, Ctrl/⌘-click for more'}
            </span>
            {viewStep !== null && shownIdx < lastIdx && (
              <span className="text-amber-300">Viewing an earlier step — new steps are inserted after it.</span>
            )}
          </div>
        </div>

        {/* Applied steps */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Applied Steps</div>
          <ol className="space-y-0.5">
            {run.steps.map((s, i) => (
              <li key={i} className="group flex items-center gap-1">
                <button
                  onClick={() => setViewStep(i === lastIdx ? null : i)}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs transition ${
                    i === shownIdx ? 'bg-accent/15 text-accent-ink' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {s.error ? (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                  ) : (
                    <span className="w-3.5 shrink-0 text-center text-[10px] text-slate-500">{i + 1}</span>
                  )}
                  <span className="truncate">{s.name}</span>
                </button>
                {i > 0 && (
                  <button
                    onClick={() => deleteStep(i)}
                    aria-label={`Delete step ${s.name}`}
                    className="rounded-full p-1 text-slate-500 opacity-60 transition hover:bg-rose-500/15 hover:text-rose-300 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={check} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-on-accent hover:bg-accent-hover">
          <CheckCircle2 className="h-4 w-4" />
          Check {scenario.check}
        </button>
        <button
          onClick={() => setPanel(panel === 'target' ? null : 'target')}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            panel === 'target' ? 'bg-slate-700 text-white' : 'border border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Eye className="h-4 w-4" />
          Target output
        </button>
        <button
          onClick={() => setPanel(panel === 'advanced' ? null : 'advanced')}
          className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-medium transition ${
            panel === 'advanced' ? 'bg-slate-700 text-white' : 'border border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Code2 className="h-4 w-4" />
          Advanced Editor
        </button>
        <div className="flex-1" />
        <button onClick={showSolution} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          Show solution
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-300">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            result.ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {result.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
            {result.ok
              ? revealed
                ? 'Matches the target — but the solution was shown, so it isn’t counted. Reset to try it yourself.'
                : 'Matches the target output. Scenario complete!'
              : 'Not there yet:'}
          </div>
          {!result.ok && (
            <ul className="mt-2 list-disc space-y-1 pl-6 text-xs leading-relaxed">
              {result.issues.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {panel === 'target' && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400">
            Target for <span className="font-medium text-white">{scenario.check}</span> — {target.columns.length} columns,{' '}
            {target.rows.length} rows{scenario.checkOrder ? ', in this order' : ' (row order doesn’t matter)'}.
          </div>
          <DataGrid table={target} selected={[]} />
        </div>
      )}

      {panel === 'advanced' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-2 text-xs text-slate-400">
            Advanced Editor — <span className="text-white">{active}</span> (read-only: the M your steps generate)
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-sky-200">
            {advancedEditorText(run)}
          </pre>
        </div>
      )}

      {dialog && table && (
        <PqDialog
          key={dialog}
          kind={dialog}
          table={table}
          selected={sel}
          otherQueries={otherQueries}
          onSubmit={addOp}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
};
