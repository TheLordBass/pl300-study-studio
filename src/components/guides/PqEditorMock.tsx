import React, { useEffect, useRef, useState } from 'react';

/**
 * A drawn Power Query Editor (Power BI Desktop) used by the how-to guides.
 * It isn't interactive itself: each guide step says which ribbon tab is open,
 * which elements to highlight, and which menu or dialog is showing.
 */

export type RibbonTab = 'Home' | 'Transform' | 'Add Column' | 'View';

interface Btn {
  id: string;
  label: string;
  big?: boolean;
  dd?: boolean;
  check?: boolean;
  glyph?: string;
}
interface Group {
  label: string;
  buttons: Btn[];
}

const RIBBON: Record<RibbonTab, Group[]> = {
  Home: [
    { label: 'Close', buttons: [{ id: 'close-apply', label: 'Close & Apply', big: true, dd: true, glyph: '⏏' }] },
    {
      label: 'New Query',
      buttons: [
        { id: 'new-source', label: 'New Source', big: true, dd: true, glyph: '⊕' },
        { id: 'recent-sources', label: 'Recent Sources', big: true, dd: true, glyph: '⟲' },
        { id: 'enter-data', label: 'Enter Data', big: true, glyph: '▦' },
      ],
    },
    { label: 'Data Sources', buttons: [{ id: 'data-source-settings', label: 'Data source settings', big: true, glyph: '⚙' }] },
    { label: 'Parameters', buttons: [{ id: 'manage-parameters', label: 'Manage Parameters', big: true, dd: true, glyph: '≡' }] },
    {
      label: 'Query',
      buttons: [
        { id: 'refresh-preview', label: 'Refresh Preview', big: true, dd: true, glyph: '↻' },
        { id: 'properties', label: 'Properties' },
        { id: 'advanced-editor', label: 'Advanced Editor' },
        { id: 'manage', label: 'Manage', dd: true },
      ],
    },
    {
      label: 'Manage Columns',
      buttons: [
        { id: 'choose-columns', label: 'Choose Columns', big: true, dd: true, glyph: '▥' },
        { id: 'remove-columns', label: 'Remove Columns', big: true, dd: true, glyph: '▤' },
      ],
    },
    {
      label: 'Reduce Rows',
      buttons: [
        { id: 'keep-rows', label: 'Keep Rows', big: true, dd: true, glyph: '☰' },
        { id: 'remove-rows', label: 'Remove Rows', big: true, dd: true, glyph: '☷' },
      ],
    },
    { label: 'Sort', buttons: [{ id: 'sort-asc', label: 'A→Z' }, { id: 'sort-desc', label: 'Z→A' }] },
    {
      label: 'Transform',
      buttons: [
        { id: 'split-column', label: 'Split Column', big: true, dd: true, glyph: '⫼' },
        { id: 'group-by', label: 'Group By', big: true, glyph: '⊞' },
        { id: 'data-type', label: 'Data Type: Text', dd: true },
        { id: 'first-row-headers', label: 'Use First Row as Headers', dd: true },
        { id: 'replace-values', label: 'Replace Values' },
      ],
    },
    {
      label: 'Combine',
      buttons: [
        { id: 'merge-queries', label: 'Merge Queries', dd: true },
        { id: 'append-queries', label: 'Append Queries', dd: true },
        { id: 'combine-files', label: 'Combine Files' },
      ],
    },
  ],
  Transform: [
    {
      label: 'Table',
      buttons: [
        { id: 'group-by', label: 'Group By', big: true, glyph: '⊞' },
        { id: 'first-row-headers', label: 'Use First Row as Headers', dd: true },
        { id: 'transpose', label: 'Transpose' },
        { id: 'reverse-rows', label: 'Reverse Rows' },
        { id: 'count-rows', label: 'Count Rows' },
      ],
    },
    {
      label: 'Any Column',
      buttons: [
        { id: 'data-type', label: 'Data Type: Text', dd: true },
        { id: 'detect-type', label: 'Detect Data Type' },
        { id: 'rename', label: 'Rename' },
        { id: 'replace-values', label: 'Replace Values', dd: true },
        { id: 'fill', label: 'Fill', dd: true },
        { id: 'pivot-column', label: 'Pivot Column' },
        { id: 'unpivot', label: 'Unpivot Columns', dd: true },
        { id: 'move', label: 'Move', dd: true },
        { id: 'convert-list', label: 'Convert to List' },
      ],
    },
    {
      label: 'Text Column',
      buttons: [
        { id: 'split-column', label: 'Split Column', big: true, dd: true, glyph: '⫼' },
        { id: 'format', label: 'Format', big: true, dd: true, glyph: 'Aa' },
        { id: 'merge-columns', label: 'Merge Columns' },
        { id: 'extract', label: 'Extract', dd: true },
        { id: 'parse', label: 'Parse', dd: true },
      ],
    },
    {
      label: 'Number Column',
      buttons: [
        { id: 'statistics', label: 'Statistics', big: true, dd: true, glyph: 'Σ' },
        { id: 'standard', label: 'Standard', big: true, dd: true, glyph: '±' },
        { id: 'rounding', label: 'Rounding', dd: true },
        { id: 'information', label: 'Information', dd: true },
      ],
    },
    {
      label: 'Date & Time Column',
      buttons: [
        { id: 'date', label: 'Date', big: true, dd: true, glyph: '📅' },
        { id: 'time', label: 'Time', big: true, dd: true, glyph: '🕑' },
        { id: 'duration', label: 'Duration', big: true, dd: true, glyph: '⏱' },
      ],
    },
    {
      label: 'Structured Column',
      buttons: [
        { id: 'expand', label: 'Expand' },
        { id: 'aggregate', label: 'Aggregate' },
        { id: 'extract-values', label: 'Extract Values' },
      ],
    },
  ],
  'Add Column': [
    {
      label: 'General',
      buttons: [
        { id: 'column-from-examples', label: 'Column From Examples', big: true, dd: true, glyph: '✎' },
        { id: 'custom-column', label: 'Custom Column', big: true, glyph: 'ƒx' },
        { id: 'invoke-function', label: 'Invoke Custom Function', big: true, glyph: 'ƒ' },
        { id: 'conditional-column', label: 'Conditional Column' },
        { id: 'index-column', label: 'Index Column', dd: true },
        { id: 'duplicate-column', label: 'Duplicate Column' },
      ],
    },
    {
      label: 'From Text',
      buttons: [
        { id: 'format', label: 'Format', big: true, dd: true, glyph: 'Aa' },
        { id: 'merge-columns', label: 'Merge Columns' },
        { id: 'extract', label: 'Extract', dd: true },
        { id: 'parse', label: 'Parse', dd: true },
      ],
    },
    {
      label: 'From Number',
      buttons: [
        { id: 'statistics', label: 'Statistics', big: true, dd: true, glyph: 'Σ' },
        { id: 'standard', label: 'Standard', big: true, dd: true, glyph: '±' },
        { id: 'rounding', label: 'Rounding', dd: true },
        { id: 'information', label: 'Information', dd: true },
      ],
    },
    {
      label: 'From Date & Time',
      buttons: [
        { id: 'date', label: 'Date', big: true, dd: true, glyph: '📅' },
        { id: 'time', label: 'Time', big: true, dd: true, glyph: '🕑' },
        { id: 'duration', label: 'Duration', big: true, dd: true, glyph: '⏱' },
      ],
    },
    {
      label: 'AI Insights',
      buttons: [
        { id: 'text-analytics', label: 'Text Analytics', big: true, glyph: '💬' },
        { id: 'vision', label: 'Vision', big: true, glyph: '👁' },
      ],
    },
  ],
  View: [
    {
      label: 'Layout',
      buttons: [
        { id: 'query-settings', label: 'Query Settings', big: true, glyph: '⚙' },
        { id: 'formula-bar', label: 'Formula Bar', check: true },
      ],
    },
    {
      label: 'Data Preview',
      buttons: [
        { id: 'monospaced', label: 'Monospaced', check: true },
        { id: 'show-whitespace', label: 'Show whitespace', check: true },
        { id: 'column-quality', label: 'Column quality', check: true },
        { id: 'column-distribution', label: 'Column distribution', check: true },
        { id: 'column-profile', label: 'Column profile', check: true },
      ],
    },
    { label: 'Columns', buttons: [{ id: 'go-to-column', label: 'Go to Column', big: true, glyph: '⇥' }] },
    { label: 'Parameters', buttons: [{ id: 'always-allow', label: 'Always allow', check: true }] },
    { label: 'Advanced', buttons: [{ id: 'advanced-editor', label: 'Advanced Editor', big: true, glyph: '</>' }] },
    { label: 'Dependencies', buttons: [{ id: 'query-dependencies', label: 'Query Dependencies', big: true, glyph: '⛓' }] },
  ],
};

export interface MockScene {
  queries?: string[];
  activeQuery?: string;
  columns?: { type: string; name: string }[];
  rows?: string[][];
  steps?: string[];
  formula?: string;
}

export interface MockState {
  /** Which ribbon tab is open (default Home). */
  tab?: RibbonTab;
  /**
   * What to highlight: 'btn:<id>', 'tab:<name>', 'menu:<item>', 'ctx:<item>',
   * 'filter:<item>', 'qctx:<item>', 'sctx:<item>', 'queries', 'query:<name>',
   * 'formula', 'type-icon', 'filter-arrow', 'header', 'steps', 'step:<name>',
   * 'step-gear', 'step-x', 'status', 'quality', 'expand-icon', 'dialog', 'dlg:<n>'.
   */
  highlight?: string[];
  /** A dropdown open under a ribbon button. */
  menu?: { under: string; items: string[] };
  /** Right-click menu on the selected column header. */
  context?: string[];
  /** Filter dropdown on the selected column. */
  filterMenu?: boolean;
  /** Right-click menu on a query in the Queries pane / on an applied step. */
  queryContext?: string[];
  stepContext?: string[];
  /** A dialog sketch: title and rows of [label, value]. */
  dialog?: { title: string; fields: [string, string][]; footer?: string };
  /** Index of the selected column (default 0, -1 for none). */
  selectedCol?: number;
  /** Show column quality bars. */
  quality?: boolean;
  /** Show the expand ↔ icon on the last column. */
  expandable?: boolean;
  /** Number shown in the highlight badges. */
  badge?: number;
}

const DEFAULT_SCENE: Required<MockScene> = {
  queries: ['Sales', 'Products', 'Customers'],
  activeQuery: 'Sales',
  columns: [
    { type: '123', name: 'OrderID' },
    { type: '📅', name: 'OrderDate' },
    { type: 'ABC', name: 'Product' },
    { type: 'ABC', name: 'Region' },
    { type: '1.2', name: 'Amount' },
  ],
  rows: [
    ['1001', '15/01/2024', 'Road Bike', 'North', '1,250.00'],
    ['1002', '17/01/2024', 'Helmet', 'South', '35.00'],
    ['1003', '05/02/2024', 'Gloves', 'North', '24.50'],
    ['1004', '14/02/2024', 'Jersey', 'West', '49.99'],
    ['1005', '13/03/2024', 'Pump', 'East', '18.00'],
    ['1006', '07/03/2024', 'Road Bike', 'West', '1,180.00'],
  ],
  steps: ['Source', 'Promoted Headers', 'Changed Type'],
  formula: '= Table.TransformColumnTypes(#"Promoted Headers",{{"OrderID", Int64.Type}, {"Amount", type number}})',
};

const W = 1180;
const H = 640;
const MIN_SCALE = 0.62;

export const PqEditorMock: React.FC<{ state: MockState; scene?: MockScene }> = ({ state, scene }) => {
  const s = { ...DEFAULT_SCENE, ...scene };
  const hl = new Set(state.highlight ?? []);
  const tab = state.tab ?? 'Home';
  const selCol = state.selectedCol ?? 0;
  const badge = state.badge ?? 1;

  // Scale the fixed-size drawing to the available width, but never below a
  // readable size: on phones it scrolls sideways instead.
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [wrapW, setWrapW] = useState(W);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWrapW(el.clientWidth);
      setScale(Math.max(MIN_SCALE, Math.min(1, el.clientWidth / W)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ring = (id: string) => (hl.has(id) ? 'pq-hl' : '');
  const Badge: React.FC<{ id: string }> = ({ id }) =>
    hl.has(id) ? <span className="pq-badge">{badge}</span> : null;

  // Where the menu under a ribbon button should appear: measured after layout.
  const canvas = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    if (!state.menu || !canvas.current) {
      setMenuPos(null);
      return;
    }
    const btn = canvas.current.querySelector<HTMLElement>(`[data-btn="${state.menu.under}"]`);
    if (!btn) return;
    const c = canvas.current.getBoundingClientRect();
    const b = btn.getBoundingClientRect();
    setMenuPos({ left: (b.left - c.left) / scale, top: (b.bottom - c.top) / scale + 2 });
  }, [state.menu, tab, scale]);

  // When the drawing is wider than the screen, bring the highlight into view.
  const scrolls = W * scale > wrapW + 1;
  useEffect(() => {
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c || !scrolls) return;
    const t = setTimeout(() => {
      // Prefer what the step is about: an open menu item, then a dialog, then the last highlight.
      const all = c.querySelectorAll<HTMLElement>('.pq-hl');
      const target =
        c.querySelector<HTMLElement>('.pq-menu .pq-hl') ?? c.querySelector<HTMLElement>('.pq-dialog') ?? all[all.length - 1];
      if (!target) return;
      const cr = c.getBoundingClientRect();
      const tr = target.getBoundingClientRect();
      const x = tr.left - cr.left + tr.width / 2 - el.clientWidth / 2;
      el.scrollTo({ left: Math.max(0, x), behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(t);
  }, [state, scale, scrolls, menuPos]);

  const colW = 150;

  return (
    <div>
    <div ref={wrap} className="w-full overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-800">
      <div style={{ width: W * scale, height: H * scale }}>
      <div
        ref={canvas}
        className="pq-mock relative origin-top-left select-none"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
        aria-hidden="true"
      >
        {/* Title bar */}
        <div className="pq-title flex h-8 items-center justify-between px-3 text-[12px]">
          <span>Untitled - Power Query Editor</span>
          <span className="tracking-[6px]">— ▢ ✕</span>
        </div>

        {/* Ribbon tabs */}
        <div className="pq-tabs flex h-8 items-end gap-0.5 px-2 text-[12px]">
          <span className="pq-file px-4 py-1.5">File</span>
          {(['Home', 'Transform', 'Add Column', 'View'] as RibbonTab[]).map((t) => (
            <span key={t} className={`relative px-4 py-1.5 ${t === tab ? 'pq-tab-active' : ''} ${ring('tab:' + t)}`}>
              {t}
              <Badge id={'tab:' + t} />
            </span>
          ))}
          <span className="px-4 py-1.5">Tools</span>
          <span className="px-4 py-1.5">Help</span>
        </div>

        {/* Ribbon */}
        <div className="pq-ribbon flex h-[104px] items-stretch overflow-hidden px-1 text-[11px]">
          {RIBBON[tab].map((g) => {
            const big = g.buttons.filter((b) => b.big);
            const small = g.buttons.filter((b) => !b.big);
            const cols: Btn[][] = [];
            for (let i = 0; i < small.length; i += 3) cols.push(small.slice(i, i + 3));
            return (
              <div key={g.label} className="pq-group flex flex-col px-1.5 pt-1">
                <div className="flex flex-1 items-start gap-1">
                  {big.map((b) => (
                    <div
                      key={b.id}
                      data-btn={b.id}
                      className={`relative flex w-[62px] flex-col items-center gap-1 rounded px-1 py-1 text-center leading-tight ${ring('btn:' + b.id)}`}
                    >
                      <span className="pq-glyph flex h-7 w-7 items-center justify-center text-[17px]">{b.glyph ?? '▣'}</span>
                      <span>
                        {b.label}
                        {b.dd && ' ▾'}
                      </span>
                      <Badge id={'btn:' + b.id} />
                    </div>
                  ))}
                  {cols.map((c, i) => (
                    <div key={i} className="flex flex-col gap-0.5 pt-0.5">
                      {c.map((b) => (
                        <div
                          key={b.id}
                          data-btn={b.id}
                          className={`relative flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-[3px] ${ring('btn:' + b.id)}`}
                        >
                          <span className="pq-mini">{b.check ? '☐' : '▪'}</span>
                          {b.label}
                          {b.dd && ' ▾'}
                          <Badge id={'btn:' + b.id} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="pq-group-label pb-1 text-center text-[10px]">{g.label}</div>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex" style={{ height: H - 32 - 32 - 104 - 26 }}>
          {/* Queries pane */}
          <div className={`pq-pane relative w-[170px] shrink-0 p-2 text-[12px] ${ring('queries')}`}>
            <Badge id="queries" />
            <div className="pq-muted mb-1.5 text-[11px]">‹ Queries [{s.queries.length}]</div>
            {s.queries.map((q) => (
              <div
                key={q}
                className={`relative mb-0.5 flex items-center gap-1.5 rounded px-1.5 py-1 ${q === s.activeQuery ? 'pq-selected' : ''} ${ring('query:' + q)}`}
              >
                <span className="pq-mini">▦</span>
                {q}
                <Badge id={'query:' + q} />
              </div>
            ))}
          </div>

          {/* Center */}
          <div className="relative flex min-w-0 flex-1 flex-col">
            <div className={`pq-formula relative mx-2 mt-2 flex h-7 items-center gap-2 px-2 font-mono text-[11px] ${ring('formula')}`}>
              <span className="pq-muted">✕ ✓</span>
              <span className="pq-muted italic">fx</span>
              <span className="truncate">{s.formula}</span>
              <Badge id="formula" />
            </div>
            <div className="pq-grid relative m-2 flex-1 overflow-hidden text-[12px]">
              <div className="flex">
                <div className="pq-head w-9 shrink-0" />
                {s.columns.map((c, i) => (
                  <div
                    key={c.name}
                    className={`pq-head relative shrink-0 px-1.5 ${i === selCol ? 'pq-head-sel' : ''} ${i === selCol ? ring('header') : ''}`}
                    style={{ width: colW }}
                  >
                    <div className="flex h-7 items-center gap-1.5">
                      <span className={`pq-type relative rounded px-0.5 text-[10px] ${i === selCol ? ring('type-icon') : ''}`}>
                        {c.type}
                        {i === selCol && <Badge id="type-icon" />}
                      </span>
                      <span className="flex-1 truncate font-semibold">{c.name}</span>
                      {state.expandable && i === s.columns.length - 1 ? (
                        <span className={`relative rounded px-0.5 ${ring('expand-icon')}`}>
                          ⇿
                          <Badge id="expand-icon" />
                        </span>
                      ) : (
                        <span className={`relative rounded px-0.5 text-[10px] ${i === selCol ? ring('filter-arrow') : ''}`}>
                          ▾{i === selCol && <Badge id="filter-arrow" />}
                        </span>
                      )}
                    </div>
                    {state.quality && (
                      <div className={`relative pb-1 text-[9px] leading-tight ${i === 0 ? ring('quality') : ''}`}>
                        <div className="flex h-1 overflow-hidden rounded">
                          <span className="pq-valid" style={{ width: i === 4 ? '83%' : '100%' }} />
                          <span className="pq-err" style={{ width: i === 4 ? '17%' : '0%' }} />
                        </div>
                        <div className="pq-muted mt-0.5">● Valid {i === 4 ? '83%' : '100%'} · ● Error {i === 4 ? '17%' : '0%'}</div>
                        {i === 0 && <Badge id="quality" />}
                      </div>
                    )}
                    {i === selCol && <Badge id="header" />}
                  </div>
                ))}
              </div>
              {s.rows.map((r, ri) => (
                <div key={ri} className="pq-row flex">
                  <div className="pq-muted w-9 shrink-0 px-1.5 py-1 text-right">{ri + 1}</div>
                  {r.map((v, ci) => (
                    <div
                      key={ci}
                      className={`shrink-0 truncate px-1.5 py-1 ${ci === selCol ? 'pq-cell-sel' : ''}`}
                      style={{ width: colW }}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              ))}

              {/* Column right-click menu */}
              {state.context && (
                <div className="pq-menu absolute z-20 w-[230px] py-1" style={{ left: 9 * 4 + selCol * colW + 40, top: 26 }}>
                  {state.context.map((item) =>
                    item === '-' ? (
                      <div key={Math.random()} className="pq-sep my-1" />
                    ) : (
                      <div key={item} className={`relative px-3 py-[3px] ${ring('ctx:' + item)}`}>
                        {item}
                        <Badge id={'ctx:' + item} />
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Filter dropdown */}
              {state.filterMenu && (
                <div className="pq-menu absolute z-20 w-[250px] py-1" style={{ left: 36 + selCol * colW + 60, top: 28 }}>
                  {['Sort Ascending', 'Sort Descending', 'Clear Sort', '-', 'Clear Filter', 'Remove Empty', 'Text Filters ▸'].map((item) =>
                    item === '-' ? (
                      <div key="sep" className="pq-sep my-1" />
                    ) : (
                      <div key={item} className={`relative px-3 py-[3px] ${ring('filter:' + item)}`}>
                        {item}
                        <Badge id={'filter:' + item} />
                      </div>
                    )
                  )}
                  <div className="pq-sep my-1" />
                  <div className={`relative mx-2 space-y-0.5 rounded p-1.5 pq-inset ${ring('filter:list')}`}>
                    <div>☑ (Select All)</div>
                    {[...new Set(s.rows.map((r) => r[selCol]))].slice(0, 4).map((v) => (
                      <div key={v}>☑ {v}</div>
                    ))}
                    <Badge id="filter:list" />
                  </div>
                  <div className="mt-1.5 flex justify-end gap-1 px-2 pb-1">
                    <span className={`pq-btn relative px-3 py-0.5 ${ring('filter:OK')}`}>
                      OK
                      <Badge id="filter:OK" />
                    </span>
                    <span className="pq-btn px-3 py-0.5">Cancel</span>
                  </div>
                </div>
              )}

              {/* Query right-click menu */}
              {state.queryContext && (
                <div className="pq-menu absolute z-20 w-[230px] py-1" style={{ left: 0, top: 30 }}>
                  {state.queryContext.map((item) =>
                    item === '-' ? (
                      <div key={Math.random()} className="pq-sep my-1" />
                    ) : (
                      <div key={item} className={`relative px-3 py-[3px] ${ring('qctx:' + item)}`}>
                        {item}
                        <Badge id={'qctx:' + item} />
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Step right-click menu */}
              {state.stepContext && (
                <div className="pq-menu absolute right-0 z-20 w-[230px] py-1" style={{ top: 40 }}>
                  {state.stepContext.map((item) =>
                    item === '-' ? (
                      <div key={Math.random()} className="pq-sep my-1" />
                    ) : (
                      <div key={item} className={`relative px-3 py-[3px] ${ring('sctx:' + item)}`}>
                        {item}
                        <Badge id={'sctx:' + item} />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Query settings */}
          <div className="pq-pane w-[230px] shrink-0 p-2 text-[12px]">
            <div className="pq-muted mb-1 text-[11px] font-semibold">Query Settings</div>
            <div className="pq-muted text-[10px] font-semibold">PROPERTIES</div>
            <div className="mb-2 mt-0.5">Name</div>
            <div className="pq-inset mb-3 px-1.5 py-0.5">{s.activeQuery}</div>
            <div className={`relative ${ring('steps')}`}>
              <Badge id="steps" />
              <div className="pq-muted text-[10px] font-semibold">APPLIED STEPS</div>
              {s.steps.map((st, i) => (
                <div
                  key={st}
                  className={`relative mt-0.5 flex items-center justify-between rounded px-1.5 py-[3px] ${i === s.steps.length - 1 ? 'pq-selected' : ''} ${ring('step:' + st)}`}
                >
                  <span className="flex items-center gap-1">
                    {i === s.steps.length - 1 && (
                      <span className={`relative ${ring('step-x')}`}>
                        ✕<Badge id="step-x" />
                      </span>
                    )}
                    {st}
                  </span>
                  {i > 0 && (
                    <span className={`relative pq-muted ${i === 1 ? ring('step-gear') : ''}`}>
                      ⚙{i === 1 && <Badge id="step-gear" />}
                    </span>
                  )}
                  <Badge id={'step:' + st} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="pq-status flex h-[26px] items-center justify-between px-3 text-[10px]">
          <span className="flex items-center gap-6">
            <span>
              {s.columns.length} COLUMNS, 999+ ROWS
            </span>
            <span className={`relative rounded px-1 ${ring('status')}`}>
              Column profiling based on top 1000 rows ▾
              <Badge id="status" />
            </span>
          </span>
          <span>PREVIEW DOWNLOADED AT 10:42</span>
        </div>

        {/* Ribbon dropdown */}
        {state.menu && menuPos && (
          <div className="pq-menu absolute z-30 min-w-[220px] py-1 text-[12px]" style={{ left: menuPos.left, top: menuPos.top }}>
            {state.menu.items.map((item) =>
              item === '-' ? (
                <div key={Math.random()} className="pq-sep my-1" />
              ) : (
                <div key={item} className={`relative px-3 py-[3px] ${ring('menu:' + item)}`}>
                  {item}
                  <Badge id={'menu:' + item} />
                </div>
              )
            )}
          </div>
        )}

        {/* Dialog */}
        {state.dialog && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className={`pq-dialog relative w-[520px] p-4 text-[12px] ${ring('dialog')}`}>
              <Badge id="dialog" />
              <div className="mb-3 text-[15px] font-semibold">{state.dialog.title}</div>
              {state.dialog.fields.map(([k, v], i) => (
                <div key={k + i} className="mb-2">
                  {k && <div className="pq-muted mb-0.5 text-[11px]">{k}</div>}
                  <div className={`pq-inset relative px-2 py-1 ${ring('dlg:' + i)}`}>
                    {v}
                    <Badge id={'dlg:' + i} />
                  </div>
                </div>
              ))}
              {state.dialog.footer && <div className="pq-muted mt-1 text-[11px]">{state.dialog.footer}</div>}
              <div className="mt-3 flex justify-end gap-2">
                <span className={`pq-btn-primary relative px-5 py-1 ${ring('dlg:ok')}`}>
                  OK
                  <Badge id="dlg:ok" />
                </span>
                <span className="pq-btn px-4 py-1">Cancel</span>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
    {scrolls && <p className="mt-1 text-[11px] text-slate-500">↔ Scroll sideways to see the whole window.</p>}
    </div>
  );
};

/** Power BI Desktop's own Home ribbon, for the "open the editor" guide. */
export const DesktopMock: React.FC<{ highlight?: string[]; badge?: number }> = ({ highlight = [], badge = 1 }) => {
  const hl = new Set(highlight);
  const items: [string, string][] = [
    ['paste', 'Paste'],
    ['get-data', 'Get data ▾'],
    ['excel', 'Excel workbook'],
    ['onelake', 'OneLake data hub ▾'],
    ['sql', 'SQL Server'],
    ['enter-data', 'Enter data'],
    ['dataverse', 'Dataverse'],
    ['recent', 'Recent sources ▾'],
    ['transform-data', 'Transform data ▾'],
    ['refresh', 'Refresh'],
    ['new-visual', 'New visual'],
    ['text-box', 'Text box'],
    ['more-visuals', 'More visuals ▾'],
    ['new-measure', 'New measure'],
    ['quick-measure', 'Quick measure'],
    ['publish', 'Publish'],
  ];
  return (
    <div className="pq-mock overflow-x-auto rounded-2xl border border-slate-800 text-[11px]" aria-hidden="true">
      <div className="pq-title flex h-7 items-center px-3 text-[12px]">Untitled - Power BI Desktop</div>
      <div className="pq-tabs flex h-7 items-end gap-0.5 px-2 text-[12px]">
        <span className="pq-file px-4 py-1">File</span>
        <span className="pq-tab-active px-4 py-1">Home</span>
        {['Insert', 'Modeling', 'View', 'Optimize', 'Help'].map((t) => (
          <span key={t} className="px-4 py-1">
            {t}
          </span>
        ))}
      </div>
      <div className="pq-ribbon flex min-w-[980px] flex-wrap items-center gap-1 p-2">
        {items.map(([id, label]) => (
          <span key={id} className={`relative rounded px-2 py-2 ${hl.has(id) ? 'pq-hl' : ''}`}>
            {label}
            {hl.has(id) && <span className="pq-badge">{badge}</span>}
          </span>
        ))}
      </div>
      <div className="pq-pane flex h-24 items-center justify-center text-[12px] pq-muted">Report canvas</div>
    </div>
  );
};
