/**
 * Power Query Lab engine: a small in-browser imitation of the Power Query
 * Editor. Tables of plain cells, a set of transformation steps that behave
 * like their Power Query counterparts, and the M each step would generate.
 */
import { evalExpr, exprColumns, parseExpr } from './expr';

export type ColType = 'any' | 'text' | 'number' | 'whole' | 'date' | 'logical';
export interface PQError {
  error: string;
}
export type Cell = string | number | boolean | null | PQError;
export interface PQTable {
  columns: string[];
  types: ColType[];
  rows: Cell[][];
}

export const isError = (v: unknown): v is PQError =>
  typeof v === 'object' && v !== null && 'error' in (v as object);

export const TYPE_LABEL: Record<ColType, string> = {
  any: 'Any',
  text: 'Text',
  number: 'Decimal Number',
  whole: 'Whole Number',
  date: 'Date',
  logical: 'True/False',
};
export const TYPE_ICON: Record<ColType, string> = {
  any: 'ABC\n123',
  text: 'ABC',
  number: '1.2',
  whole: '123',
  date: '📅',
  logical: '✓✗',
};
const M_TYPE: Record<ColType, string> = {
  any: 'type any',
  text: 'type text',
  number: 'type number',
  whole: 'Int64.Type',
  date: 'type date',
  logical: 'type logical',
};

export type FilterTest =
  | 'equals'
  | 'notEquals'
  | 'notEmpty'
  | 'contains'
  | 'notContains'
  | 'beginsWith'
  | 'greater'
  | 'greaterOrEqual'
  | 'less'
  | 'lessOrEqual';

export const FILTER_LABEL: Record<FilterTest, string> = {
  equals: 'equals',
  notEquals: 'does not equal',
  notEmpty: 'is not empty (remove empty)',
  contains: 'contains',
  notContains: 'does not contain',
  beginsWith: 'begins with',
  greater: 'is greater than',
  greaterOrEqual: 'is greater than or equal to',
  less: 'is less than',
  lessOrEqual: 'is less than or equal to',
};

export type AggFn = 'sum' | 'count' | 'average' | 'min' | 'max' | 'countDistinct';
export type DatePart = 'year' | 'month' | 'quarter' | 'day' | 'monthName';
export type TextFn = 'trim' | 'clean' | 'upper' | 'lower' | 'proper';

export type Op =
  | { kind: 'removeTopRows'; count: number }
  | { kind: 'removeBottomRows'; count: number }
  | { kind: 'promoteHeaders' }
  | { kind: 'changeType'; columns: string[]; type: ColType }
  | { kind: 'removeColumns'; columns: string[] }
  | { kind: 'selectColumns'; columns: string[] }
  | { kind: 'renameColumn'; from: string; to: string }
  | { kind: 'filterRows'; column: string; test: FilterTest; value?: string }
  | { kind: 'removeBlankRows' }
  | { kind: 'removeDuplicates'; columns: string[] }
  | { kind: 'removeErrors'; columns: string[] }
  | { kind: 'replaceValues'; columns: string[]; find: string; replace: string }
  | { kind: 'formatText'; columns: string[]; fn: TextFn }
  | { kind: 'splitColumn'; column: string; delimiter: string; at: 'each' | 'left' | 'right' }
  | { kind: 'fillDown'; columns: string[] }
  | { kind: 'unpivot'; keep: string[]; attribute: string; value: string }
  | { kind: 'groupBy'; keys: string[]; aggs: { name: string; fn: AggFn; column?: string }[] }
  | { kind: 'customColumn'; name: string; formula: string }
  | {
      kind: 'conditionalColumn';
      name: string;
      clauses: { column: string; test: FilterTest; value: string; output: string }[];
      otherwise: string;
    }
  | { kind: 'datePart'; column: string; part: DatePart }
  | { kind: 'mergeColumns'; columns: string[]; separator: string; name: string }
  | { kind: 'sort'; column: string; descending: boolean }
  | { kind: 'append'; queries: string[] }
  | {
      kind: 'merge';
      query: string;
      leftKey: string;
      rightKey: string;
      join: 'leftOuter' | 'inner' | 'leftAnti';
      expand: string[];
      prefix: boolean;
    };

export type OpKind = Op['kind'];

export const STEP_NAME: Record<OpKind, string> = {
  removeTopRows: 'Removed Top Rows',
  removeBottomRows: 'Removed Bottom Rows',
  promoteHeaders: 'Promoted Headers',
  changeType: 'Changed Type',
  removeColumns: 'Removed Columns',
  selectColumns: 'Removed Other Columns',
  renameColumn: 'Renamed Columns',
  filterRows: 'Filtered Rows',
  removeBlankRows: 'Removed Blank Rows',
  removeDuplicates: 'Removed Duplicates',
  removeErrors: 'Removed Errors',
  replaceValues: 'Replaced Value',
  formatText: 'Formatted Text',
  splitColumn: 'Split Column by Delimiter',
  fillDown: 'Filled Down',
  unpivot: 'Unpivoted Other Columns',
  groupBy: 'Grouped Rows',
  customColumn: 'Added Custom',
  conditionalColumn: 'Added Conditional Column',
  datePart: 'Inserted Date Part',
  mergeColumns: 'Merged Columns',
  sort: 'Sorted Rows',
  append: 'Appended Query',
  merge: 'Merged Queries',
};

export class StepError extends Error {}

// ── Cell helpers ───────────────────────────────────────────────────

const pqErr = (m: string): PQError => ({ error: m });
const isBlank = (v: Cell) => v === null || v === '';

export function display(v: Cell): string {
  if (v === null) return 'null';
  if (isError(v)) return 'Error';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  return v;
}

const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const iso = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

/** Text → date the way an en-US Power Query does it, or null if it can't. */
function parseDate(s: string): string | null {
  const t = s.trim();
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(t);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (m) return iso(+m[3], +m[1], +m[2]); // en-US: month first
  m = /^(\d{1,2})[ -]([A-Za-z]{3})[a-z]*[ -](\d{4})$/.exec(t);
  if (m && MON.includes(m[2].toLowerCase())) return iso(+m[3], MON.indexOf(m[2].toLowerCase()) + 1, +m[1]);
  m = /^([A-Za-z]{3})[a-z]* (\d{1,2}),? (\d{4})$/.exec(t);
  if (m && MON.includes(m[1].toLowerCase())) return iso(+m[3], MON.indexOf(m[1].toLowerCase()) + 1, +m[2]);
  return null;
}

export function convert(v: Cell, type: ColType): Cell {
  if (v === null || isError(v) || type === 'any') return v;
  const shown = typeof v === 'string' ? `"${v}"` : display(v);
  switch (type) {
    case 'text':
      return typeof v === 'string' ? v : display(v);
    case 'number':
    case 'whole': {
      let n: number;
      if (typeof v === 'number') n = v;
      else if (typeof v === 'boolean') n = v ? 1 : 0;
      else {
        const t = v.trim();
        if (t === '') return null;
        if (!/^[-+]?(\d{1,3}(,\d{3})+|\d+)?(\.\d+)?$/.test(t) || t === '-' || t === '+') {
          return pqErr(`DataFormat.Error: We couldn't convert to Number. Details: ${shown}`);
        }
        n = Number(t.replace(/,/g, ''));
      }
      return type === 'whole' ? Math.round(n) : n;
    }
    case 'date': {
      if (typeof v !== 'string') return pqErr(`Expression.Error: We cannot convert the value ${shown} to type Date.`);
      if (v.trim() === '') return null;
      return parseDate(v) ?? pqErr(`DataFormat.Error: We couldn't parse the input provided as a Date value. Details: ${shown}`);
    }
    case 'logical': {
      if (typeof v === 'boolean') return v;
      const t = String(v).trim().toLowerCase();
      if (t === 'true') return true;
      if (t === 'false') return false;
      return pqErr(`DataFormat.Error: We couldn't convert to Logical. Details: ${shown}`);
    }
  }
}

function colIndex(t: PQTable, name: string): number {
  const i = t.columns.indexOf(name);
  if (i < 0) {
    throw new StepError(`Expression.Error: The column '${name}' of the table wasn't found.`);
  }
  return i;
}

/** The value a filter / condition compares against, typed like the column. */
function typedValue(raw: string, type: ColType): Cell {
  if (type === 'number' || type === 'whole') {
    const n = Number(raw.replace(/,/g, ''));
    return Number.isFinite(n) && raw.trim() !== '' ? n : raw;
  }
  if (type === 'date') return parseDate(raw) ?? raw;
  return raw;
}

function test(v: Cell, t: FilterTest, value: Cell): boolean {
  if (t === 'notEmpty') return !isBlank(v);
  if (isError(v)) return true; // errors stay; Remove Errors is its own step
  switch (t) {
    case 'equals':
      return v === value;
    case 'notEquals':
      return v !== value;
    case 'contains':
      return typeof v === 'string' && v.includes(String(value));
    case 'notContains':
      return !(typeof v === 'string' && v.includes(String(value)));
    case 'beginsWith':
      return typeof v === 'string' && v.startsWith(String(value));
  }
  if (v === null || value === null || typeof v !== typeof value) return false;
  const a = v as number | string;
  const b = value as number | string;
  return t === 'greater' ? a > b : t === 'greaterOrEqual' ? a >= b : t === 'less' ? a < b : a <= b;
}

const key = (v: Cell) =>
  v === null
    ? '∅'
    : isError(v)
    ? '⚠'
    : typeof v === 'number'
    ? 'n' + Math.round(v * 1e6) / 1e6
    : typeof v === 'boolean'
    ? 'b' + v
    : 's' + v;

function unique(name: string, taken: string[]): string {
  if (!taken.includes(name)) return name;
  let i = 1;
  while (taken.includes(`${name}.${i}`)) i++;
  return `${name}.${i}`;
}

// ── Applying a step ────────────────────────────────────────────────

export type QueryResolver = (name: string) => PQTable;

export function applyOp(t: PQTable, op: Op, resolve: QueryResolver): PQTable {
  const cols = t.columns;
  switch (op.kind) {
    case 'removeTopRows':
      return { ...t, rows: t.rows.slice(Math.max(0, op.count)) };
    case 'removeBottomRows':
      return { ...t, rows: t.rows.slice(0, Math.max(0, t.rows.length - op.count)) };
    case 'promoteHeaders': {
      if (!t.rows.length) throw new StepError('There is no first row to use as headers.');
      const names: string[] = [];
      t.rows[0].forEach((v, i) => {
        const n = v === null || v === '' || isError(v) ? `Column${i + 1}` : display(v);
        names.push(unique(n, names));
      });
      return { columns: names, types: names.map(() => 'any'), rows: t.rows.slice(1) };
    }
    case 'changeType': {
      const idx = op.columns.map((c) => colIndex(t, c));
      return {
        columns: cols,
        types: t.types.map((ty, i) => (idx.includes(i) ? op.type : ty)),
        rows: t.rows.map((r) => r.map((v, i) => (idx.includes(i) ? convert(v, op.type) : v))),
      };
    }
    case 'removeColumns':
    case 'selectColumns': {
      op.columns.forEach((c) => colIndex(t, c));
      const keep =
        op.kind === 'removeColumns'
          ? cols.map((_, i) => i).filter((i) => !op.columns.includes(cols[i]))
          : op.columns.map((c) => cols.indexOf(c));
      return {
        columns: keep.map((i) => cols[i]),
        types: keep.map((i) => t.types[i]),
        rows: t.rows.map((r) => keep.map((i) => r[i])),
      };
    }
    case 'renameColumn': {
      const i = colIndex(t, op.from);
      const to = op.to.trim();
      if (!to) throw new StepError('A column name cannot be empty.');
      if (to !== op.from && cols.includes(to)) throw new StepError(`Expression.Error: The field '${to}' already exists in the record.`);
      return { ...t, columns: cols.map((c, j) => (j === i ? to : c)) };
    }
    case 'filterRows': {
      const i = colIndex(t, op.column);
      const value = typedValue(op.value ?? '', t.types[i]);
      return { ...t, rows: t.rows.filter((r) => test(r[i], op.test, value)) };
    }
    case 'removeBlankRows':
      return { ...t, rows: t.rows.filter((r) => !r.every(isBlank)) };
    case 'removeDuplicates': {
      const idx = (op.columns.length ? op.columns : cols).map((c) => colIndex(t, c));
      const seen = new Set<string>();
      return {
        ...t,
        rows: t.rows.filter((r) => {
          const k = idx.map((i) => key(r[i])).join('|');
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }),
      };
    }
    case 'removeErrors': {
      const idx = (op.columns.length ? op.columns : cols).map((c) => colIndex(t, c));
      return { ...t, rows: t.rows.filter((r) => !idx.some((i) => isError(r[i]))) };
    }
    case 'replaceValues': {
      const idx = op.columns.map((c) => colIndex(t, c));
      const replace: Cell = op.replace === 'null' ? null : op.replace;
      return {
        ...t,
        rows: t.rows.map((r) =>
          r.map((v, i) => {
            if (!idx.includes(i) || isError(v)) return v;
            const ty = t.types[i];
            if (op.find === '' || op.find === 'null') {
              // Replacer.ReplaceValue: whole-cell match
              const target: Cell = op.find === 'null' ? null : '';
              return v === target ? replace : v;
            }
            if ((ty === 'text' || ty === 'any') && typeof v === 'string') {
              return v.split(op.find).join(replace === null ? '' : replace);
            }
            return key(v) === key(typedValue(op.find, ty)) ? typedValue(String(replace), ty) : v;
          })
        ),
      };
    }
    case 'formatText': {
      const idx = op.columns.map((c) => colIndex(t, c));
      const f = (s: string) =>
        op.fn === 'trim'
          ? s.trim()
          : op.fn === 'clean'
          ? s.replace(/[\u0000-\u001f\u007f]/g, '')
          : op.fn === 'upper'
          ? s.toUpperCase()
          : op.fn === 'lower'
          ? s.toLowerCase()
          : s.toLowerCase().replace(/(^|[^a-z])([a-z])/g, (_, a, b) => a + b.toUpperCase());
      return {
        ...t,
        rows: t.rows.map((r) =>
          r.map((v, i) => {
            if (!idx.includes(i) || v === null || isError(v)) return v;
            if (typeof v !== 'string') {
              return pqErr(`Expression.Error: We cannot convert the value ${display(v)} to type Text.`);
            }
            return f(v);
          })
        ),
      };
    }
    case 'splitColumn': {
      const i = colIndex(t, op.column);
      if (!op.delimiter) throw new StepError('Choose a delimiter to split on.');
      const parts = t.rows.map((r) => {
        const v = r[i];
        if (typeof v !== 'string') return [v];
        if (op.at === 'each') return v.split(op.delimiter);
        const at = op.at === 'left' ? v.indexOf(op.delimiter) : v.lastIndexOf(op.delimiter);
        return at < 0 ? [v] : [v.slice(0, at), v.slice(at + op.delimiter.length)];
      });
      const n = Math.max(op.at === 'each' ? 1 : 2, ...parts.map((p) => p.length));
      const newNames: string[] = [];
      for (let k = 1; k <= n; k++) newNames.push(unique(`${op.column}.${k}`, cols.filter((c) => c !== op.column)));
      return {
        columns: [...cols.slice(0, i), ...newNames, ...cols.slice(i + 1)],
        types: [...t.types.slice(0, i), ...newNames.map(() => 'text' as ColType), ...t.types.slice(i + 1)],
        rows: t.rows.map((r, j) => [
          ...r.slice(0, i),
          ...newNames.map((_, k) => (parts[j][k] === undefined ? null : parts[j][k])),
          ...r.slice(i + 1),
        ]),
      };
    }
    case 'fillDown': {
      const idx = op.columns.map((c) => colIndex(t, c));
      const last: Record<number, Cell> = {};
      return {
        ...t,
        rows: t.rows.map((r) =>
          r.map((v, i) => {
            if (!idx.includes(i)) return v;
            if (v === null) return i in last ? last[i] : null;
            last[i] = v;
            return v;
          })
        ),
      };
    }
    case 'unpivot': {
      const keep = op.keep.map((c) => colIndex(t, c));
      const others = cols.map((_, i) => i).filter((i) => !keep.includes(i));
      if (!others.length) throw new StepError('Every column is kept, so there is nothing to unpivot.');
      const valueTypes = new Set(others.map((i) => t.types[i]));
      const rows: Cell[][] = [];
      t.rows.forEach((r) =>
        others.forEach((i) => {
          if (r[i] === null) return; // Table.UnpivotOtherColumns drops nulls
          rows.push([...keep.map((k) => r[k]), cols[i], r[i]]);
        })
      );
      return {
        columns: [...keep.map((k) => cols[k]), op.attribute, op.value],
        types: [...keep.map((k) => t.types[k]), 'text', valueTypes.size === 1 ? [...valueTypes][0] : 'any'],
        rows,
      };
    }
    case 'groupBy': {
      const kidx = op.keys.map((c) => colIndex(t, c));
      const groups = new Map<string, Cell[][]>();
      t.rows.forEach((r) => {
        const k = kidx.map((i) => key(r[i])).join('|');
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(r);
      });
      const aggCols = op.aggs.map((a) => (a.fn === 'count' ? -1 : colIndex(t, a.column ?? '')));
      const rows = [...groups.values()].map((rs) => [
        ...kidx.map((i) => rs[0][i]),
        ...op.aggs.map((a, n) => {
          if (a.fn === 'count') return rs.length;
          const vals = rs.map((r) => r[aggCols[n]]);
          const bad = vals.find(isError);
          if (bad) return bad;
          const present = vals.filter((v) => v !== null);
          if (a.fn === 'countDistinct') return new Set(vals.map(key)).size;
          if (!present.length) return null;
          if (a.fn === 'min' || a.fn === 'max') {
            return present.reduce((m, v) => ((a.fn === 'min' ? v! < m! : v! > m!) ? v : m));
          }
          if (present.some((v) => typeof v !== 'number')) {
            return pqErr(`Expression.Error: We cannot apply operator + to types Text and Number. Change ${a.column} to a number type first.`);
          }
          const sum = (present as number[]).reduce((s, v) => s + v, 0);
          return a.fn === 'sum' ? sum : sum / present.length;
        }),
      ]);
      return {
        columns: [...op.keys, ...op.aggs.map((a) => a.name)],
        types: [
          ...kidx.map((i) => t.types[i]),
          ...op.aggs.map((a, n): ColType =>
            a.fn === 'count' || a.fn === 'countDistinct'
              ? 'whole'
              : a.fn === 'min' || a.fn === 'max'
              ? t.types[aggCols[n]]
              : 'number'
          ),
        ],
        rows,
      };
    }
    case 'customColumn': {
      const name = op.name.trim() || 'Custom';
      if (cols.includes(name)) throw new StepError(`A column called '${name}' already exists.`);
      let tree;
      try {
        tree = parseExpr(op.formula);
      } catch (e) {
        throw new StepError(`Expression.SyntaxError: ${(e as Error).message}`);
      }
      const missing = [...exprColumns(tree)].filter((c) => !cols.includes(c));
      if (missing.length) throw new StepError(`Expression.Error: The column '${missing[0]}' of the table wasn't found.`);
      return {
        columns: [...cols, name],
        types: [...t.types, 'any'],
        rows: t.rows.map((r) => {
          const rec: Record<string, Cell> = {};
          cols.forEach((c, i) => (rec[c] = r[i]));
          return [...r, evalExpr(tree, rec)];
        }),
      };
    }
    case 'conditionalColumn': {
      const name = op.name.trim() || 'Custom';
      if (cols.includes(name)) throw new StepError(`A column called '${name}' already exists.`);
      const cidx = op.clauses.map((c) => colIndex(t, c.column));
      return {
        columns: [...cols, name],
        types: [...t.types, 'any'],
        rows: t.rows.map((r) => {
          for (let n = 0; n < op.clauses.length; n++) {
            const c = op.clauses[n];
            const v = r[cidx[n]];
            if (isError(v)) return [...r, v];
            if (test(v, c.test, typedValue(c.value, t.types[cidx[n]]))) return [...r, c.output];
          }
          return [...r, op.otherwise === '' ? null : op.otherwise];
        }),
      };
    }
    case 'datePart': {
      const i = colIndex(t, op.column);
      const label = { year: 'Year', month: 'Month', quarter: 'Quarter', day: 'Day', monthName: 'Month Name' }[op.part];
      const fn = { year: 'Date.Year', month: 'Date.Month', quarter: 'Date.QuarterOfYear', day: 'Date.Day', monthName: 'Date.MonthName' }[op.part];
      const tree = parseExpr(`${fn}([${op.column}])`);
      const name = unique(label, cols);
      return {
        columns: [...cols, name],
        types: [...t.types, op.part === 'monthName' ? 'text' : 'whole'],
        rows: t.rows.map((r) => {
          if (t.types[i] !== 'date' && r[i] !== null && !isError(r[i])) {
            return [...r, pqErr(`Expression.Error: We cannot convert the value "${display(r[i])}" to type Date. Change ${op.column}'s type to Date first.`)];
          }
          return [...r, evalExpr(tree, { [op.column]: r[i] })];
        }),
      };
    }
    case 'mergeColumns': {
      const idx = op.columns.map((c) => colIndex(t, c));
      const name = op.name.trim() || 'Merged';
      const first = Math.min(...idx);
      const restCols = cols.map((_, i) => i).filter((i) => !idx.includes(i));
      const pos = restCols.filter((i) => i < first).length;
      const merged = t.rows.map((r) => {
        const vals = idx.map((i) => r[i]);
        const bad = vals.find(isError);
        if (bad) return bad;
        return vals.filter((v) => v !== null).map((v) => display(v)).join(op.separator);
      });
      const outCols = restCols.map((i) => cols[i]);
      outCols.splice(pos, 0, unique(name, outCols));
      const outTypes = restCols.map((i) => t.types[i]);
      outTypes.splice(pos, 0, 'text');
      return {
        columns: outCols,
        types: outTypes,
        rows: t.rows.map((r, j) => {
          const out = restCols.map((i) => r[i]);
          out.splice(pos, 0, merged[j]);
          return out;
        }),
      };
    }
    case 'sort': {
      const i = colIndex(t, op.column);
      const rank = (v: Cell) => (v === null ? 0 : isError(v) ? 2 : 1);
      const rows = [...t.rows].sort((a, b) => {
        const x = a[i];
        const y = b[i];
        let c = rank(x) - rank(y);
        if (c === 0 && x !== null && !isError(x) && !isError(y)) c = (x as string | number) < (y as string | number) ? -1 : (x as string | number) > (y as string | number) ? 1 : 0;
        return op.descending ? -c : c;
      });
      return { ...t, rows };
    }
    case 'append': {
      const tables = [t, ...op.queries.map((q) => resolve(q))];
      const columns: string[] = [];
      tables.forEach((tb) => tb.columns.forEach((c) => !columns.includes(c) && columns.push(c)));
      const types = columns.map((c) => {
        const ts = new Set(tables.map((tb) => (tb.columns.includes(c) ? tb.types[tb.columns.indexOf(c)] : 'missing')));
        ts.delete('missing');
        return ts.size === 1 ? ([...ts][0] as ColType) : 'any';
      });
      return {
        columns,
        types,
        rows: tables.flatMap((tb) => tb.rows.map((r) => columns.map((c) => (tb.columns.includes(c) ? r[tb.columns.indexOf(c)] : null)))),
      };
    }
    case 'merge': {
      const other = resolve(op.query);
      const li = colIndex(t, op.leftKey);
      const ri = other.columns.indexOf(op.rightKey);
      if (ri < 0) throw new StepError(`Expression.Error: The column '${op.rightKey}' of ${op.query} wasn't found.`);
      const expandIdx = op.expand.map((c) => {
        const i = other.columns.indexOf(c);
        if (i < 0) throw new StepError(`Expression.Error: The column '${c}' of ${op.query} wasn't found.`);
        return i;
      });
      const index = new Map<string, Cell[][]>();
      other.rows.forEach((r) => {
        if (r[ri] === null) return;
        const k = key(r[ri]);
        if (!index.has(k)) index.set(k, []);
        index.get(k)!.push(r);
      });
      const names: string[] = [];
      op.expand.forEach((c) => names.push(unique(op.prefix ? `${op.query}.${c}` : c, [...cols, ...names])));
      const rows: Cell[][] = [];
      t.rows.forEach((r) => {
        const hits = r[li] === null ? [] : index.get(key(r[li])) ?? [];
        if (op.join === 'leftAnti') {
          if (!hits.length) rows.push([...r]);
          return;
        }
        if (!hits.length) {
          if (op.join === 'leftOuter') rows.push([...r, ...expandIdx.map(() => null)]);
          return;
        }
        hits.forEach((h) => rows.push([...r, ...expandIdx.map((i) => h[i])]));
      });
      if (op.join === 'leftAnti') return { ...t, rows };
      return { columns: [...cols, ...names], types: [...t.types, ...expandIdx.map((i) => other.types[i])], rows };
    }
  }
}

// ── M code ─────────────────────────────────────────────────────────

const mStr = (s: string) => `"${s.replace(/"/g, '""')}"`;
export const mId = (s: string) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? s : `#${mStr(s)}`);
const mList = (xs: string[]) => `{${xs.map(mStr).join(', ')}}`;

function mValue(raw: string, type: ColType): string {
  const v = typedValue(raw, type);
  if (typeof v === 'number') return String(v);
  if (type === 'date' && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-').map(Number);
    return `#date(${y}, ${m}, ${d})`;
  }
  return mStr(raw);
}

function mTest(col: string, test: FilterTest, value: string, type: ColType): string {
  const c = `[${col}]`;
  const v = mValue(value, type);
  switch (test) {
    case 'equals':
      return `${c} = ${v}`;
    case 'notEquals':
      return `${c} <> ${v}`;
    case 'notEmpty':
      return `${c} <> null and ${c} <> ""`;
    case 'contains':
      return `Text.Contains(${c}, ${mStr(value)})`;
    case 'notContains':
      return `not Text.Contains(${c}, ${mStr(value)})`;
    case 'beginsWith':
      return `Text.StartsWith(${c}, ${mStr(value)})`;
    case 'greater':
      return `${c} > ${v}`;
    case 'greaterOrEqual':
      return `${c} >= ${v}`;
    case 'less':
      return `${c} < ${v}`;
    case 'lessOrEqual':
      return `${c} <= ${v}`;
  }
}

/** The M expression for one step, given the previous step's name and its table. */
export function opToM(op: Op, prev: string, t: PQTable): string {
  const p = mId(prev);
  const typeOf = (c: string) => t.types[t.columns.indexOf(c)] ?? 'any';
  switch (op.kind) {
    case 'removeTopRows':
      return `Table.Skip(${p}, ${op.count})`;
    case 'removeBottomRows':
      return `Table.RemoveLastN(${p}, ${op.count})`;
    case 'promoteHeaders':
      return `Table.PromoteHeaders(${p}, [PromoteAllScalars=true])`;
    case 'changeType':
      return `Table.TransformColumnTypes(${p}, {${op.columns.map((c) => `{${mStr(c)}, ${M_TYPE[op.type]}}`).join(', ')}})`;
    case 'removeColumns':
      return `Table.RemoveColumns(${p}, ${mList(op.columns)})`;
    case 'selectColumns':
      return `Table.SelectColumns(${p}, ${mList(op.columns)})`;
    case 'renameColumn':
      return `Table.RenameColumns(${p}, {{${mStr(op.from)}, ${mStr(op.to)}}})`;
    case 'filterRows':
      return `Table.SelectRows(${p}, each ${mTest(op.column, op.test, op.value ?? '', typeOf(op.column))})`;
    case 'removeBlankRows':
      return `Table.SelectRows(${p}, each not List.IsEmpty(List.RemoveMatchingItems(Record.FieldValues(_), {"", null})))`;
    case 'removeDuplicates':
      return `Table.Distinct(${p}${op.columns.length ? `, ${mList(op.columns)}` : ''})`;
    case 'removeErrors':
      return `Table.RemoveRowsWithErrors(${p}, ${mList(op.columns)})`;
    case 'replaceValues': {
      const whole = op.find === '' || op.find === 'null';
      const find = op.find === 'null' ? 'null' : mStr(op.find);
      const rep = op.replace === 'null' ? 'null' : mStr(op.replace);
      return `Table.ReplaceValue(${p}, ${find}, ${rep}, Replacer.${whole ? 'ReplaceValue' : 'ReplaceText'}, ${mList(op.columns)})`;
    }
    case 'formatText': {
      const fn = { trim: 'Text.Trim', clean: 'Text.Clean', upper: 'Text.Upper', lower: 'Text.Lower', proper: 'Text.Proper' }[op.fn];
      return `Table.TransformColumns(${p}, {${op.columns.map((c) => `{${mStr(c)}, ${fn}, type text}`).join(', ')}})`;
    }
    case 'splitColumn': {
      const splitter =
        op.at === 'each'
          ? `Splitter.SplitTextByDelimiter(${mStr(op.delimiter)}, QuoteStyle.Csv)`
          : `Splitter.SplitTextByEachDelimiter({${mStr(op.delimiter)}}, QuoteStyle.Csv, ${op.at === 'right'})`;
      return `Table.SplitColumn(${p}, ${mStr(op.column)}, ${splitter})`;
    }
    case 'fillDown':
      return `Table.FillDown(${p}, ${mList(op.columns)})`;
    case 'unpivot':
      return `Table.UnpivotOtherColumns(${p}, ${mList(op.keep)}, ${mStr(op.attribute)}, ${mStr(op.value)})`;
    case 'groupBy': {
      const aggs = op.aggs.map((a) => {
        const expr =
          a.fn === 'count'
            ? 'Table.RowCount(_)'
            : a.fn === 'countDistinct'
            ? `List.Count(List.Distinct([${a.column}]))`
            : `List.${{ sum: 'Sum', average: 'Average', min: 'Min', max: 'Max' }[a.fn]}([${a.column}])`;
        const ty = a.fn === 'count' || a.fn === 'countDistinct' ? 'Int64.Type' : 'nullable number';
        return `{${mStr(a.name)}, each ${expr}, ${ty.startsWith('Int') ? ty : `type ${ty}`}}`;
      });
      return `Table.Group(${p}, ${mList(op.keys)}, {${aggs.join(', ')}})`;
    }
    case 'customColumn':
      return `Table.AddColumn(${p}, ${mStr(op.name)}, each ${op.formula.replace(/^\s*each\s+/i, '').trim()})`;
    case 'conditionalColumn': {
      const out = (s: string) => (s === '' ? 'null' : mStr(s));
      const body = op.clauses
        .map((c) => `if ${mTest(c.column, c.test, c.value, typeOf(c.column))} then ${out(c.output)}`)
        .join(' else ');
      return `Table.AddColumn(${p}, ${mStr(op.name)}, each ${body} else ${out(op.otherwise)})`;
    }
    case 'datePart': {
      const fn = { year: 'Date.Year', month: 'Date.Month', quarter: 'Date.QuarterOfYear', day: 'Date.Day', monthName: 'Date.MonthName' }[op.part];
      const label = { year: 'Year', month: 'Month', quarter: 'Quarter', day: 'Day', monthName: 'Month Name' }[op.part];
      return `Table.AddColumn(${p}, ${mStr(label)}, each ${fn}([${op.column}]), ${op.part === 'monthName' ? 'type text' : 'Int64.Type'})`;
    }
    case 'mergeColumns':
      return `Table.CombineColumns(Table.TransformColumnTypes(${p}, {${op.columns.map((c) => `{${mStr(c)}, type text}`).join(', ')}}), ${mList(op.columns)}, Combiner.CombineTextByDelimiter(${mStr(op.separator)}, QuoteStyle.None), ${mStr(op.name)})`;
    case 'sort':
      return `Table.Sort(${p}, {{${mStr(op.column)}, Order.${op.descending ? 'Descending' : 'Ascending'}}})`;
    case 'append':
      return `Table.Combine({${[p, ...op.queries.map(mId)].join(', ')}})`;
    case 'merge': {
      const kind = { leftOuter: 'LeftOuter', inner: 'Inner', leftAnti: 'LeftAnti' }[op.join];
      const joined = `Table.NestedJoin(${p}, {${mStr(op.leftKey)}}, ${mId(op.query)}, {${mStr(op.rightKey)}}, ${mStr(op.query)}, JoinKind.${kind})`;
      if (op.join === 'leftAnti') return `Table.RemoveColumns(${joined}, {${mStr(op.query)}})`;
      const names = op.expand.map((c) => (op.prefix ? `${op.query}.${c}` : c));
      return `Table.ExpandTableColumn(${joined}, ${mStr(op.query)}, ${mList(op.expand)}, ${mList(names)})`;
    }
  }
}

// ── Comparing with the target ──────────────────────────────────────

const NUMERIC: ColType[] = ['number', 'whole'];

export interface CheckResult {
  ok: boolean;
  issues: string[];
}

export function compareTables(got: PQTable, want: PQTable, checkOrder = false): CheckResult {
  const issues: string[] = [];
  const missing = want.columns.filter((c) => !got.columns.includes(c));
  const extra = got.columns.filter((c) => !want.columns.includes(c));
  if (missing.length) issues.push(`Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`);
  if (extra.length) issues.push(`Column${extra.length > 1 ? 's' : ''} that shouldn't be in the result: ${extra.join(', ')}.`);

  const shared = want.columns.filter((c) => got.columns.includes(c));
  shared.forEach((c) => {
    const w = want.types[want.columns.indexOf(c)];
    const g = got.types[got.columns.indexOf(c)];
    if (w === 'any' || w === g || (NUMERIC.includes(w) && NUMERIC.includes(g))) return;
    issues.push(`${c} is ${TYPE_LABEL[g]}; it should be ${TYPE_LABEL[w]}.`);
  });

  const errCols = got.columns.filter((_, i) => got.rows.some((r) => isError(r[i])));
  if (errCols.length) {
    const n = got.rows.filter((r) => r.some(isError)).length;
    issues.push(`${n} row${n > 1 ? 's' : ''} still contain${n > 1 ? '' : 's'} errors (in ${errCols.join(', ')}).`);
  }

  if (got.rows.length !== want.rows.length) {
    issues.push(`You have ${got.rows.length} rows; the target has ${want.rows.length}.`);
  }

  if (!missing.length && !issues.length) {
    const gi = shared.map((c) => got.columns.indexOf(c));
    const wi = shared.map((c) => want.columns.indexOf(c));
    const gk = got.rows.map((r) => gi.map((i) => key(r[i])).join('|'));
    const wk = want.rows.map((r) => wi.map((i) => key(r[i])).join('|'));
    if (checkOrder) {
      const at = wk.findIndex((k, i) => k !== gk[i]);
      if (at >= 0) issues.push(`Row ${at + 1} doesn't match the target (check the values and the sort order).`);
    } else {
      const pool = new Map<string, number>();
      gk.forEach((k) => pool.set(k, (pool.get(k) ?? 0) + 1));
      const unmatched = want.rows.filter((_, i) => {
        const n = pool.get(wk[i]) ?? 0;
        if (n > 0) {
          pool.set(wk[i], n - 1);
          return false;
        }
        return true;
      });
      if (unmatched.length) {
        const ex = unmatched[0];
        issues.push(
          `${unmatched.length} target row${unmatched.length > 1 ? 's are' : ' is'} missing from your result, e.g. ` +
            wi.map((i, n) => `${shared[n]} = ${display(ex[i])}`).join(', ') + '.'
        );
      }
    }
  }
  return { ok: issues.length === 0, issues };
}
