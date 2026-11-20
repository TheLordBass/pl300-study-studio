/**
 * "How do I… / where is…" guides for the Power Query Editor in Power BI
 * Desktop. Each step drives the drawn editor (PqEditorMock): which ribbon
 * tab is open and what to highlight.
 */
import type { MockScene, MockState } from '../components/guides/PqEditorMock';

export interface GuideStep {
  text: string;
  mock?: MockState;
  /** Show Power BI Desktop's main window instead, highlighting these items. */
  desktop?: string[];
}

export type GuideCategory =
  | 'Getting around'
  | 'Rows'
  | 'Columns & types'
  | 'Clean text & values'
  | 'Combine queries'
  | 'Add columns'
  | 'Data quality & folding';

export interface PqGuide {
  id: string;
  title: string;
  category: GuideCategory;
  /** Ribbon path, e.g. "Home › Reduce Rows › Remove Rows". */
  where: string;
  summary: string;
  steps: GuideStep[];
  m?: string;
  tips?: string[];
  /** Power Query Lab scenario that practises this. */
  lab?: string;
  scene?: MockScene;
}

export const GUIDE_CATEGORIES: GuideCategory[] = [
  'Getting around',
  'Rows',
  'Columns & types',
  'Clean text & values',
  'Combine queries',
  'Add columns',
  'Data quality & folding',
];

const COLUMN_MENU = [
  'Copy',
  'Remove',
  'Remove Other Columns',
  'Duplicate Column',
  'Add Column From Examples…',
  'Remove Duplicates',
  'Remove Errors',
  '-',
  'Change Type ▸',
  'Transform ▸',
  '-',
  'Replace Values…',
  'Replace Errors…',
  '-',
  'Split Column ▸',
  'Group By…',
  'Fill ▸',
  'Unpivot Columns',
  'Unpivot Other Columns',
  'Unpivot Only Selected Columns',
  '-',
  'Rename…',
  'Move ▸',
  'Drill Down',
  'Add as New Query',
];

const QUERY_MENU = [
  'Copy',
  'Paste',
  'Delete',
  'Rename',
  '✓ Enable load',
  '✓ Include in report refresh',
  '-',
  'Duplicate',
  'Reference',
  '-',
  'Move To Group ▸',
  'Create Function…',
  'Advanced Editor',
  'Properties…',
];

const STEP_MENU = [
  'Edit Settings',
  'Rename',
  'Delete',
  'Delete Until End',
  'Insert Step After',
  'Move before',
  'Move after',
  'Extract Previous',
  '-',
  'View Native Query',
  'Properties…',
];

const RAW_SCENE: MockScene = {
  columns: [
    { type: 'ABC\u200b123', name: 'Column1' },
    { type: 'ABC\u200b123', name: 'Column2' },
    { type: 'ABC\u200b123', name: 'Column3' },
    { type: 'ABC\u200b123', name: 'Column4' },
  ],
  rows: [
    ['Contoso — Sales Export', 'null', 'null', 'null'],
    ['null', 'null', 'null', 'null'],
    ['OrderID', 'OrderDate', 'Product', 'Amount'],
    ['1001', '2024-01-15', 'Road Bike', '1250'],
    ['1002', '2024-01-17', 'Helmet', '35'],
    ['1003', '2024-02-05', 'Gloves', '24.5'],
  ],
  steps: ['Source', 'Navigation'],
  formula: '= Source{[Item="Sheet1",Kind="Sheet"]}[Data]',
};

export const PQ_GUIDES: PqGuide[] = [
  // ── Getting around
  {
    id: 'open-editor',
    title: 'Open the Power Query Editor',
    category: 'Getting around',
    where: 'Power BI Desktop › Home › Transform data',
    summary: 'Every data-shaping step happens here. You reach it from the main Power BI Desktop window.',
    steps: [
      { text: 'In Power BI Desktop, on the Home ribbon, click Transform data (the top half of the button).', desktop: ['transform-data'] },
      { text: 'Or, when connecting to a new source with Get data, click Transform Data instead of Load in the Navigator window.', desktop: ['get-data'] },
      {
        text: 'When you’re finished, Home › Close & Apply loads the shaped data into the model.',
        mock: { tab: 'Home', highlight: ['btn:close-apply'] },
      },
    ],
    tips: ['Close & Apply ▾ also offers Apply (stay in the editor) and Close (discard pending changes from loading).'],
  },
  {
    id: 'layout',
    title: 'Find your way around the editor',
    category: 'Getting around',
    where: 'Queries pane · Formula bar · Grid · Query Settings',
    summary: 'Four areas you use constantly. If one is missing, turn it back on from the View tab.',
    steps: [
      { text: 'Queries pane (left): every query in the file. Click one to edit it.', mock: { highlight: ['queries'] } },
      { text: 'Formula bar: the M code of the selected step. Edit it directly if you like.', mock: { highlight: ['formula'] } },
      { text: 'Column header: the type icon (left) changes the data type; the arrow (right) sorts and filters.', mock: { highlight: ['type-icon', 'filter-arrow'] } },
      { text: 'Applied Steps (right): every transformation in order. Click a step to see the data at that point.', mock: { highlight: ['steps'] } },
      {
        text: 'Missing the formula bar or Query Settings? View › Layout turns them back on.',
        mock: { tab: 'View', highlight: ['tab:View', 'btn:formula-bar', 'btn:query-settings'] },
      },
    ],
  },
  {
    id: 'applied-steps',
    title: 'Edit, delete or insert applied steps',
    category: 'Getting around',
    where: 'Query Settings › Applied Steps',
    summary: 'Steps run top to bottom. You can change any of them later.',
    steps: [
      { text: 'Click the ⚙ gear next to a step to reopen its dialog and change its settings.', mock: { highlight: ['step-gear'] } },
      { text: 'Click the ✕ next to a step to delete it. Later steps that depend on it will show errors.', mock: { highlight: ['step-x'] } },
      {
        text: 'Right-click a step for Rename, Delete Until End, Insert Step After, and View Native Query.',
        mock: { highlight: ['sctx:Insert Step After', 'sctx:Rename'], stepContext: STEP_MENU },
      },
      { text: 'Select an earlier step and add a transformation: Power Query asks to insert it there.', mock: { highlight: ['step:Promoted Headers'] } },
    ],
    tips: ['Rename steps (e.g. "Removed junk rows") — it makes the Advanced Editor readable for the next person.'],
  },
  {
    id: 'advanced-editor',
    title: 'See and edit the whole query in M',
    category: 'Getting around',
    where: 'Home › Query › Advanced Editor (or View › Advanced)',
    summary: 'Every step you click generates a line of M. The Advanced Editor shows the full let … in script.',
    steps: [
      { text: 'Home › Query group › Advanced Editor.', mock: { tab: 'Home', highlight: ['btn:advanced-editor'] } },
      { text: 'Or View › Advanced › Advanced Editor.', mock: { tab: 'View', highlight: ['tab:View', 'btn:advanced-editor'] } },
      {
        text: 'Each step is a named line; the last line after "in" is what the query returns.',
        mock: {
          dialog: {
            title: 'Sales',
            fields: [
              [
                '',
                'let  Source = Csv.Document(File.Contents("C:\\Data\\sales.csv")),  #"Promoted Headers" = Table.PromoteHeaders(Source),  #"Changed Type" = Table.TransformColumnTypes(…)  in  #"Changed Type"',
              ],
            ],
            footer: '✓ No syntax errors have been detected.',
          },
          highlight: ['dlg:0'],
        },
      },
    ],
  },

  // ── Rows
  {
    id: 'promote-headers',
    title: 'Use the first row as headers',
    category: 'Rows',
    where: 'Home › Transform › Use First Row as Headers',
    summary: 'When column names arrive as Column1, Column2… and the real names sit in the first row.',
    scene: { ...RAW_SCENE, rows: RAW_SCENE.rows!.slice(2) },
    steps: [
      { text: 'Home tab › Transform group › Use First Row as Headers.', mock: { tab: 'Home', highlight: ['btn:first-row-headers'] } },
      { text: 'It’s also on Transform › Table, with the reverse option (Use Headers as First Row) in its dropdown.', mock: { tab: 'Transform', highlight: ['tab:Transform', 'btn:first-row-headers'], menu: { under: 'first-row-headers', items: ['Use First Row as Headers', 'Use Headers as First Row'] } } },
    ],
    m: 'Table.PromoteHeaders(Source, [PromoteAllScalars=true])',
    tips: ['Power Query usually adds a "Changed Type" step straight after — check the types it guessed.'],
    lab: 'pql-1',
  },
  {
    id: 'remove-rows',
    title: 'Remove top, bottom, blank or duplicate rows',
    category: 'Rows',
    where: 'Home › Reduce Rows › Remove Rows ▾',
    summary: 'Get rid of title blocks, footers, empty lines and duplicates.',
    scene: RAW_SCENE,
    steps: [
      {
        text: 'Home › Reduce Rows › Remove Rows opens the list. Remove Top Rows asks how many rows to drop from the top.',
        mock: {
          tab: 'Home',
          highlight: ['btn:remove-rows', 'menu:Remove Top Rows'],
          menu: { under: 'remove-rows', items: ['Remove Top Rows', 'Remove Bottom Rows', 'Remove Alternate Rows', '-', 'Remove Duplicates', 'Remove Blank Rows', 'Remove Errors'] },
        },
      },
      {
        text: 'Type the number of rows and click OK.',
        mock: { dialog: { title: 'Remove Top Rows', fields: [['Specify how many rows to remove from the top.', 'Number of rows   2']] }, highlight: ['dlg:0', 'dlg:ok'] },
      },
      {
        text: 'Remove Duplicates works on the selected columns — select them first (Ctrl-click for several).',
        mock: { tab: 'Home', highlight: ['header', 'menu:Remove Duplicates'], menu: { under: 'remove-rows', items: ['Remove Top Rows', 'Remove Bottom Rows', 'Remove Alternate Rows', '-', 'Remove Duplicates', 'Remove Blank Rows', 'Remove Errors'] } },
      },
    ],
    m: 'Table.Skip(Source, 2)   ·   Table.Distinct(#"Prev", {"Email"})',
    tips: [
      'Keep Rows ▾ (next to it) does the opposite: Keep Top Rows, Keep Range, Keep Duplicates, Keep Errors.',
      'Remove Duplicates is case-sensitive: "A@x.com" and "a@x.com" are both kept. Lowercase first.',
    ],
    lab: 'pql-2',
  },
  {
    id: 'filter-rows',
    title: 'Filter rows',
    category: 'Rows',
    where: 'Column header ▾ arrow',
    summary: 'Keep only the rows you need — the same way you’d filter in Excel.',
    steps: [
      { text: 'Click the ▾ arrow on the right of the column header.', mock: { highlight: ['filter-arrow'], selectedCol: 3 } },
      {
        text: 'Untick values in the list, or use Text/Number/Date Filters for rules like "does not equal" or "begins with". Remove Empty drops nulls and blanks.',
        mock: { filterMenu: true, selectedCol: 3, highlight: ['filter:list', 'filter:Text Filters ▸', 'filter:Remove Empty'] },
      },
      { text: 'Click OK. A "Filtered Rows" step appears.', mock: { filterMenu: true, selectedCol: 3, highlight: ['filter:OK'] } },
    ],
    m: 'Table.SelectRows(#"Changed Type", each [Region] <> "Total")',
    tips: [
      'The value list only shows the first 1,000 distinct values — use a Text Filter for larger columns.',
      'Filter by rule rather than unticking: "<> Total" keeps working when new regions arrive.',
    ],
    lab: 'pql-1',
  },
  {
    id: 'sort',
    title: 'Sort rows',
    category: 'Rows',
    where: 'Home › Sort  ·  header ▾',
    summary: 'Sorting in Power Query affects the loaded table order (rarely needed for visuals).',
    steps: [
      { text: 'Select a column, then Home › Sort › A→Z or Z→A.', mock: { tab: 'Home', highlight: ['btn:sort-asc', 'btn:sort-desc'] } },
      { text: 'Or use Sort Ascending / Descending in the header’s ▾ menu.', mock: { filterMenu: true, highlight: ['filter:Sort Ascending', 'filter:Sort Descending'] } },
    ],
    m: 'Table.Sort(#"Prev", {{"Amount", Order.Descending}})',
  },
  {
    id: 'group-by',
    title: 'Group By (summarise rows)',
    category: 'Rows',
    where: 'Home › Transform › Group By  ·  Transform › Table › Group By',
    summary: 'Collapse rows into one per group with sums, counts, averages…',
    steps: [
      { text: 'Home › Transform › Group By (also on Transform › Table).', mock: { tab: 'Home', highlight: ['btn:group-by'] } },
      {
        text: 'Choose Advanced to group on several columns and add several aggregations. Give each new column a name, an operation and a column.',
        mock: {
          dialog: {
            title: 'Group By',
            fields: [
              ['○ Basic   ● Advanced', 'Group by:  Category   ·   Year'],
              ['New column name · Operation · Column', 'Total Revenue   Sum   Revenue'],
              ['', 'Invoices   Count Rows'],
            ],
          },
          highlight: ['dlg:0', 'dlg:1', 'dlg:2'],
        },
      },
    ],
    m: 'Table.Group(#"Prev", {"Category", "Year"}, {{"Total Revenue", each List.Sum([Revenue]), type nullable number}, {"Invoices", each Table.RowCount(_), Int64.Type}})',
    tips: ['Every column you don’t group by or aggregate disappears — that’s expected.', 'Set numeric types before grouping, or Sum gives errors.'],
    lab: 'pql-7',
  },

  // ── Columns & types
  {
    id: 'data-type',
    title: 'Change a column’s data type',
    category: 'Columns & types',
    where: 'Header type icon  ·  Home › Transform › Data Type',
    summary: 'Types decide what DAX can do with a column. Text numbers can’t be summed; text dates can’t use time intelligence.',
    steps: [
      { text: 'Fastest: click the type icon (ABC, 123, 1.2, 📅) at the left of the column header and pick a type.', mock: { highlight: ['type-icon'] } },
      { text: 'Or select columns and use Home › Transform › Data Type ▾.', mock: { tab: 'Home', highlight: ['btn:data-type'], menu: { under: 'data-type', items: ['Decimal Number', 'Fixed decimal number', 'Whole Number', 'Percentage', '-', 'Date/Time', 'Date', 'Time', '-', 'True/False', 'Text', '-', 'Using Locale…'] } } },
      { text: 'Dates or numbers in another country’s format? Use Using Locale… to say how the text is written (e.g. English (United Kingdom) for 15/01/2024).', mock: { tab: 'Home', highlight: ['menu:Using Locale…'], menu: { under: 'data-type', items: ['Decimal Number', 'Fixed decimal number', 'Whole Number', 'Percentage', '-', 'Date/Time', 'Date', 'Time', '-', 'True/False', 'Text', '-', 'Using Locale…'] } } },
    ],
    m: 'Table.TransformColumnTypes(#"Prev", {{"Amount", type number}, {"OrderDate", type date}})',
    tips: [
      'Values that can’t convert become Error cells — that’s how you find bad data.',
      'Fixed decimal number (currency) avoids floating-point rounding for money.',
    ],
    lab: 'pql-6',
  },
  {
    id: 'remove-columns',
    title: 'Remove or keep columns',
    category: 'Columns & types',
    where: 'Home › Manage Columns › Choose Columns / Remove Columns',
    summary: 'Fewer columns = a smaller, faster model. Drop what the report doesn’t use.',
    steps: [
      { text: 'Choose Columns lets you tick the ones to keep — safest, because new columns in the source won’t sneak in.', mock: { tab: 'Home', highlight: ['btn:choose-columns'] } },
      { text: 'Or select columns and click Remove Columns (▾ also has Remove Other Columns).', mock: { tab: 'Home', highlight: ['btn:remove-columns'], menu: { under: 'remove-columns', items: ['Remove Columns', 'Remove Other Columns'] } } },
      { text: 'Right-clicking a header gives Remove and Remove Other Columns too.', mock: { context: COLUMN_MENU, highlight: ['ctx:Remove', 'ctx:Remove Other Columns'] } },
    ],
    m: 'Table.SelectColumns(#"Prev", {"OrderID", "OrderDate", "Amount"})',
    lab: 'pql-8',
  },
  {
    id: 'rename',
    title: 'Rename a column',
    category: 'Columns & types',
    where: 'Double-click header  ·  Transform › Any Column › Rename',
    summary: 'Give columns business-friendly names before they reach the report.',
    steps: [
      { text: 'Double-click the column header and type the new name.', mock: { highlight: ['header'] } },
      { text: 'Or Transform › Any Column › Rename, or right-click › Rename….', mock: { tab: 'Transform', highlight: ['tab:Transform', 'btn:rename'] } },
    ],
    m: 'Table.RenameColumns(#"Prev", {{"Sales Amount", "Amount"}})',
    lab: 'pql-3',
  },
  {
    id: 'unpivot',
    title: 'Unpivot columns (wide → long)',
    category: 'Columns & types',
    where: 'Transform › Any Column › Unpivot Columns ▾',
    summary: 'Turn month-per-column (Jan, Feb, Mar…) into two columns: Attribute and Value. Essential for budget and survey exports.',
    scene: {
      columns: [
        { type: 'ABC', name: 'Region' },
        { type: '123', name: 'Jan' },
        { type: '123', name: 'Feb' },
        { type: '123', name: 'Mar' },
        { type: '123', name: 'Apr' },
      ],
      rows: [
        ['North', '42000', '39500', '44100', '46800'],
        ['South', '31200', '30400', '33950', '35100'],
        ['East', '28800', '29100', '30500', '31900'],
        ['West', '36500', '35200', '37800', '40100'],
      ],
      steps: ['Source', 'Promoted Headers', 'Changed Type'],
    },
    steps: [
      { text: 'Select the column(s) to keep as they are — here Region.', mock: { highlight: ['header'] } },
      {
        text: 'Transform › Any Column › Unpivot Columns ▾ › Unpivot Other Columns.',
        mock: { tab: 'Transform', highlight: ['tab:Transform', 'btn:unpivot', 'menu:Unpivot Other Columns'], menu: { under: 'unpivot', items: ['Unpivot Columns', 'Unpivot Other Columns', 'Unpivot Only Selected Columns'] } },
      },
      { text: 'Rename Attribute → Month and Value → Budget, then set their types.', mock: { highlight: ['header'] } },
    ],
    m: 'Table.UnpivotOtherColumns(#"Changed Type", {"Region"}, "Attribute", "Value")',
    tips: ['Unpivot Other Columns keeps working when May appears next month; Unpivot (selected) Columns hard-codes Jan–Apr.'],
    lab: 'pql-1',
  },

  // ── Clean text & values
  {
    id: 'replace-values',
    title: 'Replace values',
    category: 'Clean text & values',
    where: 'Home › Transform › Replace Values  ·  right-click › Replace Values…',
    summary: 'Swap text inside cells (e.g. remove "$"), or replace whole values like blanks with null.',
    steps: [
      { text: 'Select the column, then Home › Transform › Replace Values.', mock: { tab: 'Home', highlight: ['btn:replace-values'], selectedCol: 4 } },
      { text: 'Enter what to find and what to replace it with. Leave "Replace With" empty to delete the text.', mock: { dialog: { title: 'Replace Values', fields: [['Value To Find', '$'], ['Replace With', '']], footer: '▸ Advanced options: Match entire cell contents · Replace using special characters' }, highlight: ['dlg:0', 'dlg:1'] } },
    ],
    m: 'Table.ReplaceValue(#"Prev", "$", "", Replacer.ReplaceText, {"Amount"})',
    tips: ['To turn empty cells into real nulls (so Fill Down works), find nothing and replace with null.', 'Replace Errors… (right-click) swaps error cells for a value.'],
    lab: 'pql-6',
  },
  {
    id: 'format-text',
    title: 'Trim, clean and change case',
    category: 'Clean text & values',
    where: 'Transform › Text Column › Format ▾',
    summary: 'Fix stray spaces, invisible characters and inconsistent capitals.',
    steps: [
      {
        text: 'Select text columns, then Transform › Text Column › Format.',
        mock: { tab: 'Transform', highlight: ['tab:Transform', 'btn:format'], selectedCol: 2, menu: { under: 'format', items: ['lowercase', 'UPPERCASE', 'Capitalize Each Word', '-', 'Trim', 'Clean', 'Add Prefix', 'Add Suffix'] } },
      },
      {
        text: 'Trim removes leading/trailing spaces (not double spaces inside). Clean removes non-printing characters.',
        mock: { tab: 'Transform', highlight: ['menu:Trim', 'menu:Clean'], selectedCol: 2, menu: { under: 'format', items: ['lowercase', 'UPPERCASE', 'Capitalize Each Word', '-', 'Trim', 'Clean', 'Add Prefix', 'Add Suffix'] } },
      },
    ],
    m: 'Table.TransformColumns(#"Prev", {{"Name", Text.Trim, type text}})',
    tips: ['Add Column › From Text › Format does the same but keeps the original column.'],
    lab: 'pql-2',
  },
  {
    id: 'split-column',
    title: 'Split a column',
    category: 'Clean text & values',
    where: 'Home › Transform › Split Column ▾  ·  Transform › Text Column',
    summary: 'Break "Austin, TX" into City and State, or split codes by a delimiter or position.',
    steps: [
      {
        text: 'Select the column, then Home › Split Column › By Delimiter.',
        mock: { tab: 'Home', highlight: ['btn:split-column', 'menu:By Delimiter'], selectedCol: 2, menu: { under: 'split-column', items: ['By Delimiter', 'By Number of Characters', 'By Positions', 'By Lowercase to Uppercase', 'By Uppercase to Lowercase', 'By Digit to Non-Digit', 'By Non-Digit to Digit'] } },
      },
      {
        text: 'Pick the delimiter and where to split: Left-most, Right-most, or Each occurrence.',
        mock: { dialog: { title: 'Split Column by Delimiter', fields: [['Select or enter delimiter', 'Comma ▾'], ['Split at', '● Left-most delimiter   ○ Right-most delimiter   ○ Each occurrence of the delimiter']] }, highlight: ['dlg:0', 'dlg:1'] },
      },
    ],
    m: 'Table.SplitColumn(#"Prev", "Location", Splitter.SplitTextByEachDelimiter({","}, QuoteStyle.Csv, false), {"Location.1", "Location.2"})',
    tips: ['The second part keeps its leading space — trim it afterwards.'],
    lab: 'pql-2',
  },
  {
    id: 'fill-down',
    title: 'Fill down blank cells',
    category: 'Clean text & values',
    where: 'Transform › Any Column › Fill ▾ › Down',
    summary: 'Copy a group label (shown once in a report) into the empty cells below it.',
    scene: {
      columns: [
        { type: 'ABC', name: 'Department' },
        { type: 'ABC', name: 'Team' },
        { type: '123', name: 'Headcount' },
      ],
      rows: [
        ['Engineering', 'Platform', '14'],
        ['null', 'Mobile', '9'],
        ['null', 'Data', '7'],
        ['Sales', 'Enterprise', '11'],
        ['null', 'SMB', '8'],
      ],
    },
    steps: [
      {
        text: 'Select the column, then Transform › Any Column › Fill › Down.',
        mock: { tab: 'Transform', highlight: ['tab:Transform', 'btn:fill', 'menu:Down'], menu: { under: 'fill', items: ['Down', 'Up'] } },
      },
      { text: 'Or right-click the header › Fill › Down.', mock: { context: COLUMN_MENU, highlight: ['ctx:Fill ▸'] } },
    ],
    m: 'Table.FillDown(#"Prev", {"Department"})',
    tips: ['Fill only fills null — not empty text "". From CSV files, Replace Values (nothing → null) first.'],
    lab: 'pql-5',
  },
  {
    id: 'remove-errors',
    title: 'Find and remove errors',
    category: 'Clean text & values',
    where: 'Home › Reduce Rows › Remove Rows ▾ › Remove Errors',
    summary: 'Errors appear when a value can’t convert (e.g. "TBD" to Date). Decide whether to drop or replace them.',
    steps: [
      { text: 'Turn on View › Data Preview › Column quality to see the % of errors in each column.', mock: { tab: 'View', quality: true, highlight: ['tab:View', 'btn:column-quality', 'quality'] } },
      { text: 'Select the column, then Home › Remove Rows › Remove Errors.', mock: { tab: 'Home', selectedCol: 4, highlight: ['menu:Remove Errors'], menu: { under: 'remove-rows', items: ['Remove Top Rows', 'Remove Bottom Rows', 'Remove Alternate Rows', '-', 'Remove Duplicates', 'Remove Blank Rows', 'Remove Errors'] } } },
      { text: 'To keep the rows, right-click › Replace Errors… and give a value instead.', mock: { context: COLUMN_MENU, highlight: ['ctx:Replace Errors…', 'ctx:Remove Errors'] } },
    ],
    m: 'Table.RemoveRowsWithErrors(#"Changed Type", {"TxnDate"})',
    tips: ['Keep Rows › Keep Errors shows just the problem rows so you can inspect them.'],
    lab: 'pql-6',
  },

  // ── Combine queries
  {
    id: 'merge',
    title: 'Merge queries (lookup / join)',
    category: 'Combine queries',
    where: 'Home › Combine › Merge Queries ▾',
    summary: 'Bring columns from another query by matching a key — like XLOOKUP or a SQL join.',
    steps: [
      { text: 'Home › Combine › Merge Queries (or Merge Queries as New to keep both originals).', mock: { tab: 'Home', highlight: ['btn:merge-queries'], menu: { under: 'merge-queries', items: ['Merge Queries', 'Merge Queries as New'] } } },
      {
        text: 'Click the key column in the top table, choose the second table, click its key column, and pick the Join Kind.',
        mock: { dialog: { title: 'Merge', fields: [['Sales', 'OrderID   ProductCode (selected)   Qty'], ['Products ▾', 'Code (selected)   ProductName   Category   UnitPrice'], ['Join Kind', 'Left Outer (all from first, matching from second) ▾']], footer: 'The selection matches 10 of 12 rows from the first table.' }, highlight: ['dlg:0', 'dlg:1', 'dlg:2'] },
      },
      { text: 'A new column of tables appears. Click the ⇿ expand icon in its header and tick the columns you want.', mock: { expandable: true, selectedCol: -1, highlight: ['expand-icon'] } },
    ],
    m: 'Table.NestedJoin(#"Prev", {"ProductCode"}, Products, {"Code"}, "Products", JoinKind.LeftOuter)',
    tips: [
      'Matching is case-sensitive and exact: "p-102" won’t match "P-102". Check the "matches X of Y rows" message.',
      'Left Outer keeps every row from the first table; Inner silently drops unmatched rows; Left Anti finds rows with no match.',
    ],
    lab: 'pql-4',
  },
  {
    id: 'append',
    title: 'Append queries (stack tables)',
    category: 'Combine queries',
    where: 'Home › Combine › Append Queries ▾',
    summary: 'Put tables with the same columns on top of each other — e.g. one file per region or month.',
    steps: [
      { text: 'Home › Combine › Append Queries ▾ › Append Queries as New.', mock: { tab: 'Home', highlight: ['btn:append-queries', 'menu:Append Queries as New'], menu: { under: 'append-queries', items: ['Append Queries', 'Append Queries as New'] } } },
      { text: 'Choose Two tables, or Three or more tables and add each one to the list.', mock: { dialog: { title: 'Append', fields: [['○ Two tables   ● Three or more tables', ''], ['Tables to append', 'Sales_North   Sales_South   Sales_West']] }, highlight: ['dlg:1'] } },
    ],
    m: 'Table.Combine({Sales_North, Sales_South, Sales_West})',
    tips: ['Columns are matched by name. A column named differently in one file becomes a separate column full of nulls — rename it first.', 'For a whole folder of files, use Get data › Folder and Combine Files instead.'],
    lab: 'pql-3',
  },
  {
    id: 'reference',
    title: 'Reference vs Duplicate a query',
    category: 'Combine queries',
    where: 'Queries pane › right-click a query',
    summary: 'Reference builds on another query’s result; Duplicate copies all its steps.',
    steps: [
      { text: 'Right-click the query in the Queries pane.', mock: { highlight: ['query:Sales'], queryContext: QUERY_MENU } },
      { text: 'Reference: the new query starts from Sales’s output — change Sales and it follows. Duplicate: an independent copy.', mock: { queryContext: QUERY_MENU, highlight: ['qctx:Reference', 'qctx:Duplicate'] } },
    ],
    tips: ['Use Reference to create a staging query once and build several outputs from it.'],
    lab: 'pql-3',
  },

  // ── Add columns
  {
    id: 'custom-column',
    title: 'Add a custom column',
    category: 'Add columns',
    where: 'Add Column › General › Custom Column',
    summary: 'Write a small M formula per row, e.g. [Qty] * [UnitPrice].',
    steps: [
      { text: 'Add Column › General › Custom Column.', mock: { tab: 'Add Column', highlight: ['tab:Add Column', 'btn:custom-column'] } },
      { text: 'Name the column, then write the formula. Double-click a name in Available columns to insert [Column].', mock: { dialog: { title: 'Custom Column', fields: [['New column name', 'Line Total'], ['Custom column formula', '= [Qty] * [UnitPrice]']], footer: '✓ No syntax errors have been detected.' }, highlight: ['dlg:0', 'dlg:1'] } },
      { text: 'Custom columns come out as type Any (ABC123) — set the type with the header icon afterwards.', mock: { highlight: ['type-icon'], selectedCol: 4 } },
    ],
    m: 'Table.AddColumn(#"Prev", "Line Total", each [Qty] * [UnitPrice])',
    tips: ['M is case-sensitive: Text.Upper works, text.upper doesn’t.', '"if … then … else" always needs the else in M.'],
    lab: 'pql-4',
  },
  {
    id: 'conditional-column',
    title: 'Add a conditional column',
    category: 'Add columns',
    where: 'Add Column › General › Conditional Column',
    summary: 'If-then-else rules without writing M — e.g. loyalty tiers or size bands.',
    steps: [
      { text: 'Add Column › General › Conditional Column.', mock: { tab: 'Add Column', highlight: ['tab:Add Column', 'btn:conditional-column'] } },
      { text: 'Add a clause per rule, then the Else value. Clauses are tested top to bottom.', mock: { dialog: { title: 'Add Conditional Column', fields: [['If', 'Spend   is greater than or equal to   1000   Then  Gold'], ['Else If', 'Spend   is greater than or equal to   500   Then  Silver'], ['Else', 'Bronze']] }, highlight: ['dlg:0', 'dlg:1', 'dlg:2'] } },
    ],
    m: 'Table.AddColumn(#"Prev", "Tier", each if [Spend] >= 1000 then "Gold" else if [Spend] >= 500 then "Silver" else "Bronze")',
    tips: ['Put the strictest rule first, or everyone over 500 matches "Silver" before reaching "Gold".'],
    lab: 'pql-8',
  },
  {
    id: 'date-parts',
    title: 'Extract year, month or quarter from a date',
    category: 'Add columns',
    where: 'Add Column › From Date & Time › Date ▾',
    summary: 'Add Year, Month, Quarter, Month Name… from a Date column.',
    steps: [
      { text: 'Make sure the column is a Date type (📅 icon) — otherwise every row becomes an error.', mock: { highlight: ['type-icon'], selectedCol: 1 } },
      {
        text: 'Select it, then Add Column › From Date & Time › Date › Year (or Month › Name of Month, Quarter…).',
        mock: { tab: 'Add Column', selectedCol: 1, highlight: ['tab:Add Column', 'btn:date', 'menu:Year ▸'], menu: { under: 'date', items: ['Age', 'Date Only', 'Parse', '-', 'Year ▸', 'Month ▸', 'Quarter ▸', 'Week ▸', 'Day ▸', '-', 'Combine Date and Time'] } },
      },
    ],
    m: 'Table.AddColumn(#"Prev", "Year", each Date.Year([OrderDate]), Int64.Type)',
    tips: ['The same menu under Transform › Date & Time Column replaces the column instead of adding one.', 'For reporting, a proper Date table is better than year columns on every fact table.'],
    lab: 'pql-7',
  },
  {
    id: 'merge-columns',
    title: 'Merge (concatenate) columns',
    category: 'Add columns',
    where: 'Transform › Text Column › Merge Columns  ·  Add Column › From Text',
    summary: 'Join First Name and Last Name into one column with a separator.',
    steps: [
      { text: 'Ctrl-click to select the columns in the order you want them joined.', mock: { highlight: ['header'] } },
      { text: 'Transform › Merge Columns replaces them; Add Column › Merge Columns keeps the originals.', mock: { tab: 'Add Column', highlight: ['tab:Add Column', 'btn:merge-columns'] } },
      { text: 'Choose a separator and a name.', mock: { dialog: { title: 'Merge Columns', fields: [['Separator', 'Space ▾'], ['New column name (optional)', 'Customer Name']] }, highlight: ['dlg:0', 'dlg:1'] } },
    ],
    m: 'Table.CombineColumns(#"Prev", {"First Name", "Last Name"}, Combiner.CombineTextByDelimiter(" ", QuoteStyle.None), "Customer Name")',
    lab: 'pql-8',
  },

  // ── Data quality & folding
  {
    id: 'profiling',
    title: 'Profile your data (quality, distribution, profile)',
    category: 'Data quality & folding',
    where: 'View › Data Preview',
    summary: 'See errors, empties, distinct and unique counts before you trust a column.',
    steps: [
      { text: 'View › Data Preview: tick Column quality, Column distribution and Column profile.', mock: { tab: 'View', quality: true, highlight: ['tab:View', 'btn:column-quality', 'btn:column-distribution', 'btn:column-profile'] } },
      { text: 'Column quality shows Valid / Error / Empty percentages under each header.', mock: { tab: 'View', quality: true, highlight: ['quality'] } },
      { text: 'By default profiling only reads the top 1,000 rows. Click the status bar text and choose "Column profiling based on entire data set".', mock: { tab: 'View', quality: true, highlight: ['status'] } },
    ],
    tips: ['Classic exam trap: "distinct count looks wrong" — the profile was only based on the top 1,000 rows.', 'Distinct = how many different values; Unique = values that appear exactly once.'],
  },
  {
    id: 'query-folding',
    title: 'Check query folding',
    category: 'Data quality & folding',
    where: 'Applied Steps › right-click › View Native Query',
    summary: 'Folding means Power Query turns your steps into the source’s own query (e.g. SQL), so the database does the work.',
    steps: [
      { text: 'Right-click the last step in Applied Steps.', mock: { highlight: ['step:Changed Type'], stepContext: STEP_MENU } },
      { text: 'If View Native Query is enabled, the query still folds. If it’s greyed out, folding stopped at or before this step.', mock: { stepContext: STEP_MENU, highlight: ['sctx:View Native Query'] } },
    ],
    tips: [
      'Do foldable steps (filter rows, remove columns, rename, group by) first; steps like Index Column, custom M functions or changing type on some sources can break folding.',
      'Incremental refresh needs the RangeStart/RangeEnd filter to fold.',
    ],
  },
  {
    id: 'parameters',
    title: 'Create parameters (e.g. for incremental refresh)',
    category: 'Data quality & folding',
    where: 'Home › Parameters › Manage Parameters ▾ › New Parameter',
    summary: 'Parameters hold values like a server name or a date range that you can change without editing steps.',
    steps: [
      { text: 'Home › Parameters › Manage Parameters ▾ › New Parameter.', mock: { tab: 'Home', highlight: ['btn:manage-parameters', 'menu:New Parameter'], menu: { under: 'manage-parameters', items: ['Manage Parameters', 'Edit Parameters', 'New Parameter'] } } },
      { text: 'For incremental refresh create RangeStart and RangeEnd, both of type Date/Time, then filter the date column between them.', mock: { dialog: { title: 'Manage Parameters', fields: [['Name', 'RangeStart'], ['Type', 'Date/Time'], ['Current Value', '01/01/2024 00:00:00']] }, highlight: ['dlg:0', 'dlg:1'] } },
    ],
    tips: ['The names must be exactly RangeStart and RangeEnd, and the type Date/Time — exam favourite.'],
  },
  {
    id: 'disable-load',
    title: 'Stop a query loading into the model',
    category: 'Data quality & folding',
    where: 'Queries pane › right-click › Enable load',
    summary: 'Staging and helper queries feed other queries but shouldn’t become tables in the model.',
    steps: [
      { text: 'Right-click the query in the Queries pane and untick Enable load. Its name turns italic.', mock: { highlight: ['query:Products'], queryContext: QUERY_MENU } },
      { text: 'Untick Include in report refresh for data that never changes (it then won’t refresh).', mock: { queryContext: QUERY_MENU, highlight: ['qctx:✓ Enable load', 'qctx:✓ Include in report refresh'] } },
    ],
    tips: ['Disabling load keeps the model small and clean — a common "optimize the model" answer.'],
    lab: 'pql-3',
  },
];
