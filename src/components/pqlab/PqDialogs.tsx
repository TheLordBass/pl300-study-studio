import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  AggFn,
  FILTER_LABEL,
  FilterTest,
  Op,
  PQTable,
} from '../../pqlab/table';
import { EXPR_FUNCTIONS } from '../../pqlab/expr';

export type DialogKind =
  | 'removeTopRows'
  | 'removeBottomRows'
  | 'filterRows'
  | 'renameColumn'
  | 'replaceValues'
  | 'splitColumn'
  | 'groupBy'
  | 'merge'
  | 'append'
  | 'customColumn'
  | 'conditionalColumn'
  | 'mergeColumns';

interface DialogProps {
  kind: DialogKind;
  table: PQTable;
  selected: string[];
  otherQueries: { name: string; columns: string[] }[];
  onSubmit: (op: Op) => void;
  onClose: () => void;
}

const input =
  'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none';
const label = 'mb-1 block text-xs font-medium text-slate-400';

const ColumnSelect: React.FC<{ value: string; columns: string[]; onChange: (v: string) => void }> = ({
  value,
  columns,
  onChange,
}) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={input}>
    {columns.map((c) => (
      <option key={c} value={c}>
        {c}
      </option>
    ))}
  </select>
);

const TestSelect: React.FC<{ value: FilterTest; onChange: (v: FilterTest) => void }> = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value as FilterTest)} className={input}>
    {(Object.keys(FILTER_LABEL) as FilterTest[]).map((t) => (
      <option key={t} value={t}>
        {FILTER_LABEL[t]}
      </option>
    ))}
  </select>
);

const TITLES: Record<DialogKind, string> = {
  removeTopRows: 'Remove Top Rows',
  removeBottomRows: 'Remove Bottom Rows',
  filterRows: 'Filter Rows',
  renameColumn: 'Rename Column',
  replaceValues: 'Replace Values',
  splitColumn: 'Split Column by Delimiter',
  groupBy: 'Group By',
  merge: 'Merge Queries',
  append: 'Append Queries',
  customColumn: 'Custom Column',
  conditionalColumn: 'Add Conditional Column',
  mergeColumns: 'Merge Columns',
};

export const PqDialog: React.FC<DialogProps> = ({ kind, table, selected, otherQueries, onSubmit, onClose }) => {
  const cols = table.columns;
  const first = selected[0] ?? cols[0] ?? '';

  // shared state, used by whichever form is showing
  const [count, setCount] = useState('1');
  const [column, setColumn] = useState(first);
  const [test, setTest] = useState<FilterTest>('notEquals');
  const [value, setValue] = useState('');
  const [newName, setNewName] = useState(kind === 'renameColumn' ? first : kind === 'mergeColumns' ? 'Merged' : 'Custom');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [at, setAt] = useState<'each' | 'left' | 'right'>('left');
  const [keys, setKeys] = useState<string[]>(selected.length ? selected : cols.slice(0, 1));
  const [aggs, setAggs] = useState<{ name: string; fn: AggFn; column: string }[]>([
    { name: 'Count', fn: 'count', column: cols[0] ?? '' },
  ]);
  const others = otherQueries;
  const [query, setQuery] = useState(others[0]?.name ?? '');
  const otherCols = others.find((q) => q.name === query)?.columns ?? [];
  const [rightKey, setRightKey] = useState(otherCols[0] ?? '');
  const [join, setJoin] = useState<'leftOuter' | 'inner' | 'leftAnti'>('leftOuter');
  const [expand, setExpand] = useState<string[]>([]);
  const [prefix, setPrefix] = useState(false);
  const [appendList, setAppendList] = useState<string[]>([]);
  const [formula, setFormula] = useState('');
  const [clauses, setClauses] = useState([{ column: first, test: 'greaterOrEqual' as FilterTest, value: '', output: '' }]);
  const [otherwise, setOtherwise] = useState('');
  const [separator, setSeparator] = useState(' ');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setProblem(null);
    const need = (cond: boolean, msg: string) => {
      if (!cond) throw new Error(msg);
    };
    try {
      switch (kind) {
        case 'removeTopRows':
        case 'removeBottomRows': {
          const n = Number(count);
          need(Number.isInteger(n) && n > 0, 'Enter a whole number of rows.');
          return onSubmit({ kind, count: n });
        }
        case 'filterRows':
          need(test === 'notEmpty' || value !== '', 'Enter a value to compare with.');
          return onSubmit({ kind, column, test, value });
        case 'renameColumn':
          need(newName.trim() !== '', 'Enter the new name.');
          return onSubmit({ kind, from: column, to: newName.trim() });
        case 'replaceValues':
          return onSubmit({ kind, columns: selected.length ? selected : [column], find, replace });
        case 'splitColumn':
          need(delimiter !== '', 'Enter a delimiter.');
          return onSubmit({ kind, column, delimiter, at });
        case 'groupBy':
          need(keys.length > 0, 'Pick at least one column to group by.');
          need(aggs.every((a) => a.name.trim()), 'Every new column needs a name.');
          return onSubmit({
            kind,
            keys,
            aggs: aggs.map((a) => ({ name: a.name.trim(), fn: a.fn, column: a.fn === 'count' ? undefined : a.column })),
          });
        case 'merge':
          need(!!query, 'There is no other query to merge with.');
          need(join === 'leftAnti' || expand.length > 0, 'Tick at least one column to expand.');
          return onSubmit({ kind, query, leftKey: column, rightKey, join, expand: join === 'leftAnti' ? [] : expand, prefix });
        case 'append':
          need(appendList.length > 0, 'Tick at least one query to append.');
          return onSubmit({ kind, queries: appendList });
        case 'customColumn':
          need(formula.trim() !== '', 'Write a formula, e.g. [Qty] * [UnitPrice].');
          return onSubmit({ kind, name: newName.trim() || 'Custom', formula: formula.trim() });
        case 'conditionalColumn':
          need(clauses.every((c) => c.test === 'notEmpty' || c.value !== ''), 'Every clause needs a value.');
          return onSubmit({ kind, name: newName.trim() || 'Custom', clauses, otherwise });
        case 'mergeColumns':
          need(selected.length >= 2, 'Select two or more columns first (Ctrl/⌘-click headers).');
          return onSubmit({ kind, columns: selected, separator, name: newName.trim() || 'Merged' });
      }
    } catch (err) {
      setProblem((err as Error).message);
    }
  };

  let body: React.ReactNode = null;
  switch (kind) {
    case 'removeTopRows':
    case 'removeBottomRows':
      body = (
        <div>
          <label className={label}>Number of rows</label>
          <input autoFocus type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} className={input} />
        </div>
      );
      break;
    case 'filterRows':
      body = (
        <div className="space-y-3">
          <div>
            <label className={label}>Keep rows where</label>
            <ColumnSelect value={column} columns={cols} onChange={setColumn} />
          </div>
          <TestSelect value={test} onChange={setTest} />
          {test !== 'notEmpty' && (
            <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" className={input} />
          )}
          <p className="text-[11px] text-slate-500">Text comparisons are case-sensitive, as in Power Query.</p>
        </div>
      );
      break;
    case 'renameColumn':
      body = (
        <div className="space-y-3">
          <div>
            <label className={label}>Column</label>
            <ColumnSelect
              value={column}
              columns={cols}
              onChange={(v) => {
                setColumn(v);
                setNewName(v);
              }}
            />
          </div>
          <div>
            <label className={label}>New name</label>
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className={input} />
          </div>
        </div>
      );
      break;
    case 'replaceValues':
      body = (
        <div className="space-y-3">
          {!selected.length && (
            <div>
              <label className={label}>Column</label>
              <ColumnSelect value={column} columns={cols} onChange={setColumn} />
            </div>
          )}
          {selected.length > 0 && <p className="text-xs text-slate-400">In: {selected.join(', ')}</p>}
          <div>
            <label className={label}>Value to find</label>
            <input autoFocus value={find} onChange={(e) => setFind(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Replace with</label>
            <input value={replace} onChange={(e) => setReplace(e.target.value)} className={input} />
          </div>
          <p className="text-[11px] text-slate-500">
            In text columns this replaces part of the text. Leave “Value to find” empty to replace empty cells, and type
            null in “Replace with” to put a null there.
          </p>
        </div>
      );
      break;
    case 'splitColumn':
      body = (
        <div className="space-y-3">
          <div>
            <label className={label}>Column</label>
            <ColumnSelect value={column} columns={cols} onChange={setColumn} />
          </div>
          <div>
            <label className={label}>Delimiter</label>
            <input autoFocus value={delimiter} onChange={(e) => setDelimiter(e.target.value)} className={input} />
          </div>
          <div className="space-y-1 text-sm text-slate-200">
            {(
              [
                ['left', 'Left-most delimiter'],
                ['right', 'Right-most delimiter'],
                ['each', 'Each occurrence of the delimiter'],
              ] as const
            ).map(([v, l]) => (
              <label key={v} className="flex items-center gap-2">
                <input type="radio" checked={at === v} onChange={() => setAt(v)} className="accent-[var(--color-accent)]" />
                {l}
              </label>
            ))}
          </div>
        </div>
      );
      break;
    case 'groupBy':
      body = (
        <div className="space-y-3">
          <div>
            <label className={label}>Group by (Ctrl/⌘-click for several)</label>
            <select
              multiple
              value={keys}
              onChange={(e) => setKeys([...e.target.selectedOptions].map((o) => o.value))}
              className={`${input} h-28`}
            >
              {cols.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className={label}>New columns</label>
            {aggs.map((a, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input
                  value={a.name}
                  onChange={(e) => setAggs(aggs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="Name"
                  className={input}
                />
                <select
                  value={a.fn}
                  onChange={(e) => setAggs(aggs.map((x, j) => (j === i ? { ...x, fn: e.target.value as AggFn } : x)))}
                  className={input}
                >
                  <option value="count">Count Rows</option>
                  <option value="sum">Sum</option>
                  <option value="average">Average</option>
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                  <option value="countDistinct">Count Distinct</option>
                </select>
                <select
                  disabled={a.fn === 'count'}
                  value={a.column}
                  onChange={(e) => setAggs(aggs.map((x, j) => (j === i ? { ...x, column: e.target.value } : x)))}
                  className={`${input} disabled:opacity-40`}
                >
                  {cols.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAggs(aggs.filter((_, j) => j !== i))}
                  disabled={aggs.length === 1}
                  aria-label="Remove aggregation"
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-800 disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAggs([...aggs, { name: '', fn: 'sum', column: cols[0] ?? '' }])}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent"
            >
              <Plus className="h-3.5 w-3.5" /> Add aggregation
            </button>
          </div>
        </div>
      );
      break;
    case 'merge':
      body = !others.length ? (
        <p className="text-sm text-slate-400">This scenario has no other query to merge with.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>This query’s key</label>
              <ColumnSelect value={column} columns={cols} onChange={setColumn} />
            </div>
            <div>
              <label className={label}>Merge with</label>
              <select
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  const oc = others.find((q) => q.name === e.target.value)?.columns ?? [];
                  setRightKey(oc[0] ?? '');
                  setExpand([]);
                }}
                className={input}
              >
                {others.map((q) => (
                  <option key={q.name} value={q.name}>
                    {q.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>{query}’s key</label>
              <ColumnSelect value={rightKey} columns={otherCols} onChange={setRightKey} />
            </div>
            <div>
              <label className={label}>Join kind</label>
              <select value={join} onChange={(e) => setJoin(e.target.value as typeof join)} className={input}>
                <option value="leftOuter">Left Outer (all from first, matching from second)</option>
                <option value="inner">Inner (only matching rows)</option>
                <option value="leftAnti">Left Anti (rows only in first)</option>
              </select>
            </div>
          </div>
          {join !== 'leftAnti' && (
            <div>
              <label className={label}>Expand columns</label>
              <div className="grid grid-cols-2 gap-1 text-sm text-slate-200">
                {otherCols
                  .filter((c) => c !== rightKey)
                  .map((c) => (
                    <label key={c} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={expand.includes(c)}
                        onChange={(e) => setExpand(e.target.checked ? [...expand, c] : expand.filter((x) => x !== c))}
                        className="accent-[var(--color-accent)]"
                      />
                      {c}
                    </label>
                  ))}
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={prefix} onChange={(e) => setPrefix(e.target.checked)} className="accent-[var(--color-accent)]" />
                Use original column name as prefix
              </label>
            </div>
          )}
        </div>
      );
      break;
    case 'append':
      body = !others.length ? (
        <p className="text-sm text-slate-400">This scenario has no other query to append.</p>
      ) : (
        <div className="space-y-1 text-sm text-slate-200">
          <p className="mb-2 text-xs text-slate-400">Tables to append to this query, in order:</p>
          {others.map((q) => (
            <label key={q.name} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={appendList.includes(q.name)}
                onChange={(e) => setAppendList(e.target.checked ? [...appendList, q.name] : appendList.filter((x) => x !== q.name))}
                className="accent-[var(--color-accent)]"
              />
              {q.name}
            </label>
          ))}
        </div>
      );
      break;
    case 'customColumn':
      body = (
        <div className="space-y-3">
          <div>
            <label className={label}>New column name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Custom column formula</label>
            <div className="flex items-start gap-2 font-mono text-sm">
              <span className="pt-2 text-slate-500">=</span>
              <textarea
                autoFocus
                rows={3}
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                spellCheck={false}
                placeholder="[Qty] * [UnitPrice]"
                className={`${input} font-mono`}
              />
            </div>
          </div>
          <div>
            <label className={label}>Available columns (click to insert)</label>
            <div className="flex flex-wrap gap-1">
              {cols.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setFormula((f) => `${f}[${c}]`)}
                  className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-200 hover:bg-slate-700"
                >
                  [{c}]
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Supports + − * / &amp;, comparisons, and / or / not, if … then … else, null, and {EXPR_FUNCTIONS.join(', ')}.
          </p>
        </div>
      );
      break;
    case 'conditionalColumn':
      body = (
        <div className="space-y-3">
          <div>
            <label className={label}>New column name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={input} />
          </div>
          {clauses.map((c, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-slate-800 p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                {i === 0 ? 'If' : 'Else If'}
                {clauses.length > 1 && (
                  <button type="button" onClick={() => setClauses(clauses.filter((_, j) => j !== i))} aria-label="Remove clause" className="text-slate-500 hover:text-rose-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <ColumnSelect value={c.column} columns={cols} onChange={(v) => setClauses(clauses.map((x, j) => (j === i ? { ...x, column: v } : x)))} />
                <TestSelect value={c.test} onChange={(v) => setClauses(clauses.map((x, j) => (j === i ? { ...x, test: v } : x)))} />
                <input
                  value={c.value}
                  onChange={(e) => setClauses(clauses.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                  placeholder="Value"
                  className={input}
                />
              </div>
              <input
                value={c.output}
                onChange={(e) => setClauses(clauses.map((x, j) => (j === i ? { ...x, output: e.target.value } : x)))}
                placeholder="Output"
                className={input}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setClauses([...clauses, { column: clauses[clauses.length - 1].column, test: 'greaterOrEqual', value: '', output: '' }])}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> Add Clause
          </button>
          <div>
            <label className={label}>Else</label>
            <input value={otherwise} onChange={(e) => setOtherwise(e.target.value)} placeholder="Output" className={input} />
          </div>
        </div>
      );
      break;
    case 'mergeColumns':
      body = (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Merging: {selected.length ? selected.join(' + ') : 'select two or more columns first'}
          </p>
          <div>
            <label className={label}>Separator</label>
            <select value={separator} onChange={(e) => setSeparator(e.target.value)} className={input}>
              <option value=" ">Space</option>
              <option value=",">Comma</option>
              <option value="-">Dash</option>
              <option value="">None</option>
            </select>
          </div>
          <div>
            <label className={label}>New column name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className={input} />
          </div>
        </div>
      );
      break;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-label={TITLES[kind]}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-[28px] bg-slate-900 p-6 shadow-2xl sm:rounded-[28px]"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">{TITLES[kind]}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        {body}
        {problem && <p className="text-xs text-rose-300">{problem}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
            Cancel
          </button>
          <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-slate-950 hover:bg-accent-hover">
            OK
          </button>
        </div>
      </form>
    </div>
  );
};
