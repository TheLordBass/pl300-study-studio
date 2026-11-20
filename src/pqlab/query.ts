import { Op, PQTable, STEP_NAME, StepError, applyOp, mId, opToM } from './table';

export interface Step {
  id: string;
  op: Op;
}

export type QuerySource =
  | { kind: 'file'; file: string; format: 'csv' | 'excel'; table: PQTable }
  | { kind: 'reference'; query: string };

export interface QueryDef {
  name: string;
  source: QuerySource;
}

export interface StepState {
  name: string;
  m: string;
  table: PQTable | null;
  error: string | null;
}

export interface QueryRun {
  steps: StepState[]; // index 0 is Source
  output: PQTable | null;
  error: string | null;
}

/** Power Query style step names: "Changed Type", "Changed Type1", … */
const TEXT_STEP = {
  trim: 'Trimmed Text',
  clean: 'Cleaned Text',
  upper: 'Uppercased Text',
  lower: 'Lowercased Text',
  proper: 'Capitalized Each Word',
};
const DATE_STEP = {
  year: 'Inserted Year',
  month: 'Inserted Month',
  quarter: 'Inserted Quarter',
  day: 'Inserted Day',
  monthName: 'Inserted Month Name',
};

export function stepLabel(op: Op): string {
  if (op.kind === 'formatText') return TEXT_STEP[op.fn];
  if (op.kind === 'datePart') return DATE_STEP[op.part];
  return STEP_NAME[op.kind];
}

export function stepNames(steps: Step[]): string[] {
  const seen: Record<string, number> = {};
  return steps.map((s) => {
    const base = stepLabel(s.op);
    const n = seen[base] ?? 0;
    seen[base] = n + 1;
    return n === 0 ? base : `${base}${n}`;
  });
}

function sourceM(src: QuerySource): string {
  if (src.kind === 'reference') return mId(src.query);
  if (src.format === 'csv') {
    return `Csv.Document(File.Contents("C:\\Data\\${src.file}"), [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv])`;
  }
  return `Excel.Workbook(File.Contents("C:\\Data\\${src.file}"), null, true){[Item="Sheet1", Kind="Sheet"]}[Data]`;
}

/** Runs every query of a scenario; steps per query come from `stepsOf`. */
export function runAll(
  queries: QueryDef[],
  stepsOf: (query: string) => Step[]
): Record<string, QueryRun> {
  const done: Record<string, QueryRun> = {};
  const running = new Set<string>();

  const run = (name: string): QueryRun => {
    if (done[name]) return done[name];
    const q = queries.find((x) => x.name === name);
    if (!q) throw new StepError(`Expression.Error: The name '${name}' wasn't recognized.`);
    if (running.has(name)) throw new StepError(`Expression.Error: A cyclic reference was encountered (${name} refers back to itself).`);
    running.add(name);

    const states: StepState[] = [];
    let table: PQTable | null = null;
    let error: string | null = null;
    try {
      if (q.source.kind === 'file') {
        table = q.source.table;
      } else {
        const ref = run(q.source.query);
        if (!ref.output) throw new StepError(`${q.source.query} has an error, so this query can't load.`);
        table = ref.output;
      }
    } catch (e) {
      error = (e as Error).message;
    }
    states.push({ name: 'Source', m: sourceM(q.source), table, error });

    const names = stepNames(stepsOf(name));
    let prevName = 'Source';
    stepsOf(name).forEach((s, i) => {
      let m = '';
      if (table && !error) {
        try {
          m = opToM(s.op, prevName, table);
          table = applyOp(table, s.op, (other) => {
            if (other === name) throw new StepError(`Expression.Error: ${name} can't append or merge itself.`);
            const r = run(other);
            if (!r.output) throw new StepError(`${other} has an error, so it can't be used here.`);
            return r.output;
          });
        } catch (e) {
          error = (e as Error).message;
          table = null;
        }
      }
      states.push({ name: names[i], m, table: error ? null : table, error });
      prevName = names[i];
    });

    running.delete(name);
    done[name] = { steps: states, output: error ? null : table, error };
    return done[name];
  };

  queries.forEach((q) => {
    try {
      run(q.name);
    } catch (e) {
      done[q.name] = {
        steps: [{ name: 'Source', m: '', table: null, error: (e as Error).message }],
        output: null,
        error: (e as Error).message,
      };
    }
  });
  return done;
}

/** The query as the Advanced Editor would show it. */
export function advancedEditorText(run: QueryRun): string {
  const lines = run.steps.map((s, i) => `    ${mId(s.name)} = ${s.m || '…'}${i < run.steps.length - 1 ? ',' : ''}`);
  return `let\n${lines.join('\n')}\nin\n    ${mId(run.steps[run.steps.length - 1].name)}`;
}

let counter = 0;
export const newStep = (op: Op): Step => ({ id: `s${Date.now().toString(36)}${(counter++).toString(36)}`, op });
