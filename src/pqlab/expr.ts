/**
 * A small M expression language for Custom Column, covering what a PL-300
 * learner writes there: [Column] refs, numbers, "text", null, true/false,
 * + - * / & (concatenate), comparisons, and / or / not, if … then … else,
 * and a handful of Text.* / Number.* / Date.* functions.
 */
import { Cell, PQError, isError } from './table';

type Node =
  | { k: 'lit'; v: Cell }
  | { k: 'col'; name: string }
  | { k: 'un'; op: '-' | 'not'; e: Node }
  | { k: 'bin'; op: string; a: Node; b: Node }
  | { k: 'if'; c: Node; t: Node; f: Node }
  | { k: 'call'; fn: string; args: Node[] };

interface Tok {
  t: 'num' | 'str' | 'col' | 'id' | 'op' | 'end';
  v: string;
}

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch) && /[0-9]/.test(src[i + 1] ?? ch)) {
      const m = /^[0-9]*\.?[0-9]+/.exec(src.slice(i))!;
      out.push({ t: 'num', v: m[0] });
      i += m[0].length;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      let s = '';
      while (j < src.length) {
        if (src[j] === '"') {
          if (src[j + 1] === '"') {
            s += '"';
            j += 2;
            continue;
          }
          break;
        }
        s += src[j++];
      }
      if (j >= src.length) throw new Error('A text value is opened with " but never closed.');
      out.push({ t: 'str', v: s });
      i = j + 1;
      continue;
    }
    if (ch === '[') {
      const j = src.indexOf(']', i);
      if (j < 0) throw new Error('A [Column] reference is missing its closing ].');
      out.push({ t: 'col', v: src.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (['<>', '<=', '>='].includes(two)) {
      out.push({ t: 'op', v: two });
      i += 2;
      continue;
    }
    if ('+-*/&=<>(),'.includes(ch)) {
      out.push({ t: 'op', v: ch });
      i++;
      continue;
    }
    const id = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(src.slice(i));
    if (id) {
      out.push({ t: 'id', v: id[0] });
      i += id[0].length;
      continue;
    }
    throw new Error(`Unexpected character "${ch}".`);
  }
  out.push({ t: 'end', v: '' });
  return out;
}

const PREC: Record<string, number> = {
  or: 1, and: 2, '=': 3, '<>': 3, '<': 3, '>': 3, '<=': 3, '>=': 3, '&': 4, '+': 4, '-': 4, '*': 5, '/': 5,
};

export function parseExpr(src: string): Node {
  const toks = tokenize(src.replace(/^\s*each\s+/i, ''));
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const expectOp = (v: string) => {
    const t = next();
    if (t.t !== 'op' || t.v !== v) throw new Error(`Expected "${v}" but found "${t.v || 'the end'}".`);
  };
  const word = (t: Tok, w: string) => t.t === 'id' && t.v.toLowerCase() === w;

  function primary(): Node {
    const t = next();
    if (t.t === 'num') return { k: 'lit', v: Number(t.v) };
    if (t.t === 'str') return { k: 'lit', v: t.v };
    if (t.t === 'col') return { k: 'col', name: t.v };
    if (t.t === 'op' && t.v === '(') {
      const e = expr(0);
      expectOp(')');
      return e;
    }
    if (t.t === 'op' && t.v === '-') return { k: 'un', op: '-', e: primary() };
    if (t.t === 'id') {
      const w = t.v.toLowerCase();
      if (w === 'null') return { k: 'lit', v: null };
      if (w === 'true' || w === 'false') return { k: 'lit', v: w === 'true' };
      if (w === 'not') return { k: 'un', op: 'not', e: expr(3) };
      if (w === 'if') {
        const c = expr(0);
        if (!word(next(), 'then')) throw new Error('"if" needs a "then".');
        const th = expr(0);
        if (!word(next(), 'else')) throw new Error('"if … then …" needs an "else" in M.');
        return { k: 'if', c, t: th, f: expr(0) };
      }
      if (peek().t === 'op' && peek().v === '(') {
        next();
        const args: Node[] = [];
        if (!(peek().t === 'op' && peek().v === ')')) {
          do {
            args.push(expr(0));
          } while (peek().t === 'op' && peek().v === ',' && next());
        }
        expectOp(')');
        if (!FUNCS[t.v]) throw new Error(`${t.v} isn't a function this lab knows. Try ${Object.keys(FUNCS).slice(0, 6).join(', ')}…`);
        return { k: 'call', fn: t.v, args };
      }
      throw new Error(`"${t.v}" isn't understood here. Column names go in brackets: [${t.v}].`);
    }
    throw new Error(t.t === 'end' ? 'The formula ends too early.' : `Unexpected "${t.v}".`);
  }

  function expr(min: number): Node {
    let left = primary();
    for (;;) {
      const t = peek();
      const op = t.t === 'op' ? t.v : t.t === 'id' && ['and', 'or'].includes(t.v.toLowerCase()) ? t.v.toLowerCase() : null;
      if (!op || PREC[op] === undefined || PREC[op] < min) break;
      next();
      const right = expr(PREC[op] + 1);
      left = { k: 'bin', op, a: left, b: right };
    }
    return left;
  }

  const tree = expr(0);
  if (peek().t !== 'end') throw new Error(`Unexpected "${peek().v}" after the end of the formula.`);
  return tree;
}

const err = (m: string): PQError => ({ error: m });

const num = (v: Cell): number | PQError =>
  typeof v === 'number' ? v : err(`Expression.Error: We cannot convert the value ${JSON.stringify(v)} to type Number.`);
const txt = (v: Cell): string | PQError =>
  typeof v === 'string' ? v : err(`Expression.Error: We cannot convert the value ${JSON.stringify(v)} to type Text.`);
const date = (v: Cell): Date | PQError =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
    ? new Date(v + 'T00:00:00Z')
    : err(`Expression.Error: We cannot convert the value ${JSON.stringify(v)} to type Date.`);

type Fn = (args: Cell[]) => Cell;
const unary = <T,>(conv: (v: Cell) => T | PQError, f: (x: T, rest: Cell[]) => Cell): Fn => (args) => {
  if (args[0] === null) return null;
  const x = conv(args[0]);
  return isError(x) ? x : f(x as T, args.slice(1));
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const FUNCS: Record<string, Fn> = {
  'Text.Upper': unary(txt, (s) => s.toUpperCase()),
  'Text.Lower': unary(txt, (s) => s.toLowerCase()),
  'Text.Proper': unary(txt, (s) => s.toLowerCase().replace(/(^|[^a-z])([a-z])/g, (_, a, b) => a + b.toUpperCase())),
  'Text.Trim': unary(txt, (s) => s.trim()),
  'Text.Length': unary(txt, (s) => s.length),
  'Text.Start': unary(txt, (s, r) => s.slice(0, Number(r[0]))),
  'Text.End': unary(txt, (s, r) => s.slice(Math.max(0, s.length - Number(r[0])))),
  'Text.Contains': unary(txt, (s, r) => s.includes(String(r[0]))),
  'Text.BeforeDelimiter': unary(txt, (s, r) => (s.includes(String(r[0])) ? s.slice(0, s.indexOf(String(r[0]))) : s)),
  'Text.AfterDelimiter': unary(txt, (s, r) => (s.includes(String(r[0])) ? s.slice(s.indexOf(String(r[0])) + String(r[0]).length) : '')),
  'Text.From': (a) => (a[0] === null ? null : String(a[0])),
  'Number.From': (a) => (a[0] === null ? null : Number.isFinite(Number(a[0])) ? Number(a[0]) : err(`DataFormat.Error: We couldn't convert to Number.`)),
  'Number.Round': unary(num, (x, r) => {
    const d = r.length ? Number(r[0]) : 0;
    const f = 10 ** d;
    return Math.round(x * f) / f;
  }),
  'Number.Abs': unary(num, (x) => Math.abs(x)),
  'Date.Year': unary(date, (d) => d.getUTCFullYear()),
  'Date.Month': unary(date, (d) => d.getUTCMonth() + 1),
  'Date.Day': unary(date, (d) => d.getUTCDate()),
  'Date.QuarterOfYear': unary(date, (d) => Math.floor(d.getUTCMonth() / 3) + 1),
  'Date.MonthName': unary(date, (d) => MONTHS[d.getUTCMonth()]),
};

export const EXPR_FUNCTIONS = Object.keys(FUNCS);

function truthy(v: Cell): boolean | PQError {
  if (typeof v === 'boolean') return v;
  return err(`Expression.Error: We cannot convert the value ${JSON.stringify(v)} to type Logical.`);
}

function compare(op: string, a: Cell, b: Cell): Cell {
  if (op === '=') return a === b;
  if (op === '<>') return a !== b;
  if (a === null || b === null) return null;
  if (typeof a !== typeof b) return err(`Expression.Error: We cannot apply operator ${op} to types ${typeof a} and ${typeof b}.`);
  const x = a as number | string;
  const y = b as number | string;
  return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
}

export function evalExpr(node: Node, row: Record<string, Cell>): Cell {
  switch (node.k) {
    case 'lit':
      return node.v;
    case 'col':
      if (!(node.name in row)) return err(`Expression.Error: The column '${node.name}' of the table wasn't found.`);
      return row[node.name];
    case 'un': {
      const v = evalExpr(node.e, row);
      if (isError(v)) return v;
      if (node.op === '-') return v === null ? null : (() => { const n = num(v); return isError(n) ? n : -n; })();
      if (v === null) return null;
      const b = truthy(v);
      return isError(b) ? b : !b;
    }
    case 'if': {
      const c = evalExpr(node.c, row);
      if (isError(c)) return c;
      const b = truthy(c);
      if (isError(b)) return b;
      return evalExpr(b ? node.t : node.f, row);
    }
    case 'call': {
      const args = node.args.map((a) => evalExpr(a, row));
      const bad = args.find(isError);
      return bad ?? FUNCS[node.fn](args);
    }
    case 'bin': {
      const a = evalExpr(node.a, row);
      if (isError(a)) return a;
      if (node.op === 'and' || node.op === 'or') {
        const x = truthy(a);
        if (isError(x)) return x;
        if (node.op === 'and' && !x) return false;
        if (node.op === 'or' && x) return true;
        const b = evalExpr(node.b, row);
        if (isError(b)) return b;
        return truthy(b);
      }
      const b = evalExpr(node.b, row);
      if (isError(b)) return b;
      if (['=', '<>', '<', '>', '<=', '>='].includes(node.op)) return compare(node.op, a, b);
      if (a === null || b === null) return null;
      if (node.op === '&') {
        const x = txt(a);
        const y = txt(b);
        if (isError(x)) return x;
        if (isError(y)) return y;
        return x + y;
      }
      const x = num(a);
      const y = num(b);
      if (isError(x)) return x;
      if (isError(y)) return y;
      if (node.op === '/') return y === 0 ? err('Expression.Error: Division by zero.') : x / y;
      return node.op === '+' ? x + y : node.op === '-' ? x - y : x * y;
    }
  }
}

/** Column names a formula refers to (for error messages). */
export function exprColumns(node: Node, out: Set<string> = new Set()): Set<string> {
  if (node.k === 'col') out.add(node.name);
  if (node.k === 'un') exprColumns(node.e, out);
  if (node.k === 'bin') {
    exprColumns(node.a, out);
    exprColumns(node.b, out);
  }
  if (node.k === 'if') [node.c, node.t, node.f].forEach((n) => exprColumns(n, out));
  if (node.k === 'call') node.args.forEach((n) => exprColumns(n, out));
  return out;
}
