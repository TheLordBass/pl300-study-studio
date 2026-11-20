/**
 * Power Query Lab scenarios: realistic messy sources, an analyst's brief,
 * and a reference solution. The target output is whatever the solution
 * produces, so the check never drifts from the solution.
 */
import { Cell, ColType, Op, PQTable } from './table';
import { QueryDef } from './query';

export interface PQScenario {
  id: string;
  title: string;
  difficulty: 'Core' | 'Tricky' | 'Exam Trap';
  skills: string[];
  story: string;
  tasks: string[];
  hints: string[];
  queries: QueryDef[];
  /** The query whose output is checked. */
  check: string;
  checkOrder?: boolean;
  solution: Record<string, Op[]>;
}

const tbl = (columns: string[], rows: Cell[][], type: ColType = 'any'): PQTable => ({
  columns,
  types: columns.map(() => type),
  rows,
});
const raw = (rows: Cell[][]): PQTable =>
  tbl(
    rows[0].map((_, i) => `Column${i + 1}`),
    rows
  );
const csv = (name: string, file: string, columns: string[], rows: Cell[][]): QueryDef => ({
  name,
  source: { kind: 'file', file, format: 'csv', table: tbl(columns, rows.map((r) => r.map((v) => (v === null ? '' : String(v)))), 'text') },
});
const excel = (name: string, file: string, rows: Cell[][]): QueryDef => ({
  name,
  source: { kind: 'file', file, format: 'excel', table: raw(rows) },
});

// Small seeded generator so datasets are identical on every load.
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 1. Unpivot a budget export ─────────────────────────────────────
const budgetRegions: [string, number[]][] = [
  ['North', [42000, 39500, 44100, 46800, 47250, 51000]],
  ['South', [31200, 30400, 33950, 35100, 36200, 38750]],
  ['East', [28800, 29100, 30500, 31900, 33400, 34100]],
  ['West', [36500, 35200, 37800, 40100, 41650, 43900]],
  ['Central', [19400, 18900, 20750, 21300, 22800, 23500]],
];
const budgetTotals = [0, 1, 2, 3, 4, 5].map((m) => budgetRegions.reduce((s, [, v]) => s + v[m], 0));

const s1: PQScenario = {
  id: 'pql-1',
  title: 'Budget workbook export',
  difficulty: 'Core',
  skills: ['Remove top rows', 'Use first row as headers', 'Filter rows', 'Unpivot', 'Data types'],
  story:
    'Finance exports the regional budget from Excel with a title block above the table, one column per month and a Total row at the bottom. You need a tidy, long table for a line chart and a relationship to the Date table.',
  tasks: [
    'Remove the title rows above the real header row',
    'Use the first row as headers',
    'Remove the Total row',
    'Unpivot the month columns into Month and Budget (keep Region)',
    'Set types: Region and Month as Text, Budget as Decimal Number',
  ],
  hints: [
    'Home › Remove Rows › Remove Top Rows: the header row is row 4, so remove 3.',
    'Filter Region: does not equal "Total". Removing bottom rows works too, but a filter survives new regions being added.',
    'Select Region, then Transform › Unpivot Other Columns. It keeps working when July is added next month.',
  ],
  queries: [
    excel('Budget', 'Budget_FY24.xlsx', [
      ['Contoso Ltd — Regional Budget FY24', null, null, null, null, null, null],
      ['Prepared by Finance · exported 01/07/2024', null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      ['Region', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      ...budgetRegions.map(([r, v]) => [r, ...v]),
      ['Total', ...budgetTotals],
    ]),
  ],
  check: 'Budget',
  solution: {
    Budget: [
      { kind: 'removeTopRows', count: 3 },
      { kind: 'promoteHeaders' },
      { kind: 'filterRows', column: 'Region', test: 'notEquals', value: 'Total' },
      { kind: 'unpivot', keep: ['Region'], attribute: 'Month', value: 'Budget' },
      { kind: 'changeType', columns: ['Region', 'Month'], type: 'text' },
      { kind: 'changeType', columns: ['Budget'], type: 'number' },
    ],
  },
};

// ── 2. Clean a CRM contact list ────────────────────────────────────
const s2: PQScenario = {
  id: 'pql-2',
  title: 'CRM contact list clean-up',
  difficulty: 'Core',
  skills: ['Remove blank rows', 'Trim & Proper case', 'Lowercase', 'Remove duplicates', 'Split column', 'Rename'],
  story:
    'Sales exported contacts from three different CRMs. Names have stray spaces and random capitals, the same person appears twice with different email casing, there are blank lines, and City and State are stuck together.',
  tasks: [
    'Remove blank rows',
    'Trim, then Capitalize Each Word in Name',
    'Make Email lowercase, then remove duplicate rows based on Email',
    'Split Location at the left-most comma into City and State, and trim State',
    'Signup Date as Date; Name, Email, City, State as Text',
  ],
  hints: [
    'Order matters: lowercase Email before Remove Duplicates — Table.Distinct is case-sensitive, so "Maria.Garcia@…" and "maria.garcia@…" are different values.',
    'Split Column › By Delimiter: comma, at the left-most delimiter. The state keeps its leading space until you trim it.',
    'Rename Location.1 to City and Location.2 to State (double-click a header in Power BI).',
  ],
  queries: [
    csv('Contacts', 'crm_contacts.csv', ['Name', 'Email', 'Location', 'Signup Date'], [
      ['  maria GARCIA', 'Maria.Garcia@Contoso.com', 'Austin, TX', '2024-01-15'],
      ['james o\'neil ', 'james.oneil@fabrikam.com', 'Denver, CO', '2024-01-22'],
      ['PRIYA SHARMA', 'priya.sharma@northwind.com', 'Seattle, WA', '2024-02-03'],
      ['', '', '', ''],
      ['chen WEI', 'chen.wei@adatum.com', 'Boston, MA', '2024-02-11'],
      ['maria garcia', 'maria.garcia@contoso.com', 'Austin, TX', '2024-01-15'],
      ['Liam Murphy', 'Liam.Murphy@Tailspin.com', 'Chicago, IL', '2024-03-02'],
      ['  sofia rossi  ', 'sofia.rossi@wingtip.com', 'Miami, FL', '2024-03-09'],
      ['', '', '', ''],
      ['AHMED khan', 'ahmed.khan@litware.com', 'Phoenix, AZ', '2024-03-18'],
      ['Liam murphy', 'liam.murphy@tailspin.com', 'Chicago, IL', '2024-03-02'],
      ['Grace lee ', 'grace.lee@proseware.com', 'Portland, OR', '2024-04-06'],
      ['noah brown', 'Noah.Brown@Woodgrove.com', 'Atlanta, GA', '2024-04-14'],
    ]),
  ],
  check: 'Contacts',
  solution: {
    Contacts: [
      { kind: 'removeBlankRows' },
      { kind: 'formatText', columns: ['Name'], fn: 'trim' },
      { kind: 'formatText', columns: ['Name'], fn: 'proper' },
      { kind: 'formatText', columns: ['Email'], fn: 'lower' },
      { kind: 'removeDuplicates', columns: ['Email'] },
      { kind: 'splitColumn', column: 'Location', delimiter: ',', at: 'left' },
      { kind: 'renameColumn', from: 'Location.1', to: 'City' },
      { kind: 'renameColumn', from: 'Location.2', to: 'State' },
      { kind: 'formatText', columns: ['State'], fn: 'trim' },
      { kind: 'changeType', columns: ['Signup Date'], type: 'date' },
      { kind: 'changeType', columns: ['Name', 'Email', 'City', 'State'], type: 'text' },
    ],
  },
};

// ── 3. Append regional files ───────────────────────────────────────
const regionRows = (region: string, seed: number, start: number): Cell[][] => {
  const r = rng(seed);
  const products = ['Road Bike', 'Helmet', 'Gloves', 'Jersey', 'Pump'];
  return Array.from({ length: 6 }, (_, i) => [
    `${region[0]}-${start + i}`,
    `2024-0${1 + Math.floor(i / 2)}-${String(3 + Math.floor(r() * 25)).padStart(2, '0')}`,
    products[Math.floor(r() * products.length)],
    region,
    (Math.round(r() * 90000) / 100 + 20).toFixed(2),
  ]);
};
const s3: PQScenario = {
  id: 'pql-3',
  title: 'Regional sales files (Append)',
  difficulty: 'Core',
  skills: ['Reference query', 'Rename column', 'Append queries', 'Data types'],
  story:
    'Each region sends its own monthly CSV. North and South match, but West’s file calls the amount column "Sales Amount". Build one Sales query that stacks all three.',
  tasks: [
    'In Sales_West, rename "Sales Amount" to "Amount" so the columns line up',
    'In Sales (which references Sales_North), append Sales_South and Sales_West',
    'Set types: OrderDate as Date, Amount as Decimal Number, the rest as Text',
  ],
  hints: [
    'Append matches columns by name. Append before renaming and you get an extra "Sales Amount" column with nulls in the North and South rows.',
    'Fix the source query (Sales_West) rather than the combined one, so the fix applies wherever the query is used.',
    'Home › Append Queries › Three or more tables lets you add both at once.',
  ],
  queries: [
    csv('Sales_North', 'sales_north.csv', ['OrderID', 'OrderDate', 'Product', 'Region', 'Amount'], regionRows('North', 11, 1001)),
    csv('Sales_South', 'sales_south.csv', ['OrderID', 'OrderDate', 'Product', 'Region', 'Amount'], regionRows('South', 22, 2001)),
    csv('Sales_West', 'sales_west.csv', ['OrderID', 'OrderDate', 'Product', 'Region', 'Sales Amount'], regionRows('West', 33, 3001)),
    { name: 'Sales', source: { kind: 'reference', query: 'Sales_North' } },
  ],
  check: 'Sales',
  solution: {
    Sales_West: [{ kind: 'renameColumn', from: 'Sales Amount', to: 'Amount' }],
    Sales: [
      { kind: 'append', queries: ['Sales_South', 'Sales_West'] },
      { kind: 'changeType', columns: ['OrderDate'], type: 'date' },
      { kind: 'changeType', columns: ['Amount'], type: 'number' },
      { kind: 'changeType', columns: ['OrderID', 'Product', 'Region'], type: 'text' },
    ],
  },
};

// ── 4. Merge a product lookup ──────────────────────────────────────
const s4: PQScenario = {
  id: 'pql-4',
  title: 'Order lines + product lookup (Merge)',
  difficulty: 'Exam Trap',
  skills: ['Uppercase', 'Merge queries (Left Outer)', 'Expand', 'Custom column', 'Data types'],
  story:
    'Order lines only carry a product code. Bring in the product name, category and price from the Products list, then work out each line’s total. Some codes were typed in lowercase at the till.',
  tasks: [
    'Uppercase ProductCode in Orders so every code matches the Products list',
    'Merge Orders with Products on ProductCode = Code (Left Outer), expanding ProductName, Category and UnitPrice without a prefix',
    'Set Qty as Whole Number and UnitPrice as Decimal Number',
    'Add a custom column "Line Total" = [Qty] * [UnitPrice], then set it to Decimal Number',
  ],
  hints: [
    'Merges are case-sensitive: "p-102" won’t match "P-102". Fix the key before merging — this is a classic exam trap.',
    'Left Outer keeps every order, even P-999 which isn’t in Products (its columns come back null). Inner would silently drop it.',
    'Set the types before the custom column: multiplying text values gives errors.',
  ],
  queries: [
    csv('Orders', 'order_lines.csv', ['OrderID', 'ProductCode', 'Qty'], [
      ['SO-501', 'P-101', '2'],
      ['SO-502', 'P-104', '1'],
      ['SO-503', 'p-102', '3'],
      ['SO-504', 'P-103', '5'],
      ['SO-505', 'P-101', '1'],
      ['SO-506', 'P-105', '4'],
      ['SO-507', 'p-104', '2'],
      ['SO-508', 'P-999', '1'],
      ['SO-509', 'P-106', '6'],
      ['SO-510', 'P-102', '2'],
      ['SO-511', 'P-103', '1'],
      ['SO-512', 'P-106', '3'],
    ]),
    csv('Products', 'products.csv', ['Code', 'ProductName', 'Category', 'UnitPrice'], [
      ['P-101', 'Road-150', 'Bikes', '1800'],
      ['P-102', 'Mountain-200', 'Bikes', '1250'],
      ['P-103', 'Sport Helmet', 'Accessories', '35'],
      ['P-104', 'Water Bottle', 'Accessories', '9.5'],
      ['P-105', 'Long-Sleeve Jersey', 'Clothing', '49.99'],
      ['P-106', 'Cycling Gloves', 'Clothing', '24.5'],
    ]),
  ],
  check: 'Orders',
  solution: {
    Orders: [
      { kind: 'formatText', columns: ['ProductCode'], fn: 'upper' },
      {
        kind: 'merge',
        query: 'Products',
        leftKey: 'ProductCode',
        rightKey: 'Code',
        join: 'leftOuter',
        expand: ['ProductName', 'Category', 'UnitPrice'],
        prefix: false,
      },
      { kind: 'changeType', columns: ['Qty'], type: 'whole' },
      { kind: 'changeType', columns: ['UnitPrice'], type: 'number' },
      { kind: 'customColumn', name: 'Line Total', formula: '[Qty] * [UnitPrice]' },
      { kind: 'changeType', columns: ['Line Total'], type: 'number' },
    ],
  },
};

// ── 5. Fill down a grouped report ──────────────────────────────────
const s5: PQScenario = {
  id: 'pql-5',
  title: 'Department headcount report (Fill Down)',
  difficulty: 'Tricky',
  skills: ['Use first row as headers', 'Fill down', 'Filter rows', 'Data types'],
  story:
    'HR’s workbook shows each department name once, on the first row of its group, with subtotal rows in between. Power BI needs the department on every row and no subtotals.',
  tasks: [
    'Use the first row as headers',
    'Fill Department down',
    'Remove the Subtotal rows (Team = "Subtotal")',
    'Headcount as Whole Number, Budget as Decimal Number, Department and Team as Text',
  ],
  hints: [
    'Fill Down copies the value above into null cells only. Here the gaps are null because the source is Excel — from a CSV they’d be "" and you’d replace "" with null first.',
    'Fill down before removing the Subtotal rows — or after, both work here because subtotals have a department too. Try it and check.',
  ],
  queries: [
    excel('Headcount', 'hr_headcount.xlsx', [
      ['Department', 'Team', 'Headcount', 'Budget'],
      ['Engineering', 'Platform', 14, 1680000],
      [null, 'Mobile', 9, 1035000],
      [null, 'Data', 7, 868000],
      [null, 'Subtotal', 30, 3583000],
      ['Sales', 'Enterprise', 11, 990000],
      [null, 'SMB', 8, 600000],
      [null, 'Subtotal', 19, 1590000],
      ['Marketing', 'Brand', 4, 340000],
      [null, 'Growth', 6, 498000],
      [null, 'Events', 3, 225000],
      [null, 'Subtotal', 13, 1063000],
      ['Finance', 'FP&A', 5, 475000],
      [null, 'Accounting', 6, 510000],
      [null, 'Subtotal', 11, 985000],
    ]),
  ],
  check: 'Headcount',
  solution: {
    Headcount: [
      { kind: 'promoteHeaders' },
      { kind: 'fillDown', columns: ['Department'] },
      { kind: 'filterRows', column: 'Team', test: 'notEquals', value: 'Subtotal' },
      { kind: 'changeType', columns: ['Headcount'], type: 'whole' },
      { kind: 'changeType', columns: ['Budget'], type: 'number' },
      { kind: 'changeType', columns: ['Department', 'Team'], type: 'text' },
    ],
  },
};

// ── 6. Currency text and bad dates ─────────────────────────────────
const s6: PQScenario = {
  id: 'pql-6',
  title: 'Card transactions with bad values',
  difficulty: 'Exam Trap',
  skills: ['Replace values', 'Change type → errors', 'Remove errors', 'Filter rows'],
  story:
    'The payments export stores amounts as text with a $ sign, mixes date formats, and has "TBD" where a pending transaction has no date yet. Only completed transactions belong in the report.',
  tasks: [
    'Replace "$" with nothing in Amount, then set Amount as Decimal Number',
    'Set TxnDate as Date — some rows will turn into errors',
    'Remove the rows with errors in TxnDate',
    'Keep only rows where Status equals "Completed"',
    'TxnID and Status as Text',
  ],
  hints: [
    'Changing "$1,234.50" straight to a number gives an error. Thousands separators are fine; the $ sign isn’t.',
    'Both 2024-02-05 and 02/07/2024 convert with an English (US) locale. "TBD" can’t, so it becomes an Error cell.',
    'Remove Errors only drops rows with errors in the columns you select — select TxnDate first.',
  ],
  queries: [
    csv('Transactions', 'card_transactions.csv', ['TxnID', 'TxnDate', 'Amount', 'Status'], [
      ['T-9001', '2024-02-01', '$1,234.50', 'Completed'],
      ['T-9002', '02/03/2024', '$75.00', 'Completed'],
      ['T-9003', '2024-02-04', '$310.25', 'Refunded'],
      ['T-9004', 'TBD', '$58.10', 'Pending'],
      ['T-9005', '02/06/2024', '$2,045.00', 'Completed'],
      ['T-9006', '2024-02-07', '$19.99', 'Completed'],
      ['T-9007', 'TBD', '$640.00', 'Completed'],
      ['T-9008', '2024-02-09', '$88.40', 'Completed'],
      ['T-9009', '02/10/2024', '$1,120.00', 'Refunded'],
      ['T-9010', '2024-02-12', '$402.75', 'Completed'],
      ['T-9011', '02/13/2024', '$15.00', 'Pending'],
      ['T-9012', '2024-02-14', '$999.99', 'Completed'],
    ]),
  ],
  check: 'Transactions',
  solution: {
    Transactions: [
      { kind: 'replaceValues', columns: ['Amount'], find: '$', replace: '' },
      { kind: 'changeType', columns: ['Amount'], type: 'number' },
      { kind: 'changeType', columns: ['TxnDate'], type: 'date' },
      { kind: 'removeErrors', columns: ['TxnDate'] },
      { kind: 'filterRows', column: 'Status', test: 'equals', value: 'Completed' },
      { kind: 'changeType', columns: ['TxnID', 'Status'], type: 'text' },
    ],
  },
};

// ── 7. Group by category and year ──────────────────────────────────
const s7Rows: Cell[][] = (() => {
  const r = rng(77);
  const cats = ['Bikes', 'Accessories', 'Clothing', 'Components'];
  const custs = ['Alpine Cycles', 'Bay Riders', 'City Spokes', 'Delta Sports', 'Eastside Bikes'];
  return Array.from({ length: 28 }, (_, i) => {
    const year = i < 13 ? 2023 : 2024;
    const m = 1 + Math.floor(r() * 12);
    const d = 1 + Math.floor(r() * 28);
    const cat = cats[Math.floor(r() * cats.length)];
    const base = { Bikes: 1400, Accessories: 60, Clothing: 90, Components: 300 }[cat]!;
    return [
      `INV-${7000 + i}`,
      `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      custs[Math.floor(r() * custs.length)],
      cat,
      String(Math.round(base * (0.6 + r() * 1.2) * 100) / 100),
    ];
  });
})();
const s7: PQScenario = {
  id: 'pql-7',
  title: 'Revenue summary (Group By)',
  difficulty: 'Tricky',
  skills: ['Data types', 'Add Column › Date › Year', 'Group By (advanced)', 'Sort'],
  story:
    'Leadership wants a small summary table: revenue and number of invoices per category per year, largest first. The invoice file has one row per invoice.',
  tasks: [
    'Set InvoiceDate as Date and Revenue as Decimal Number',
    'Add a Year column from InvoiceDate (Add Column › Date › Year)',
    'Group by Category and Year: "Total Revenue" = Sum of Revenue, "Invoices" = Count Rows',
    'Sort by Total Revenue, descending',
  ],
  hints: [
    'Date › Year only works on a Date column — change the type first or every row is an error.',
    'Use the Advanced option in Group By to group on two columns and add two aggregations.',
    'Group By drops every column you don’t group or aggregate — that’s expected.',
  ],
  queries: [csv('Invoices', 'invoices.csv', ['InvoiceID', 'InvoiceDate', 'Customer', 'Category', 'Revenue'], s7Rows)],
  check: 'Invoices',
  checkOrder: true,
  solution: {
    Invoices: [
      { kind: 'changeType', columns: ['InvoiceDate'], type: 'date' },
      { kind: 'changeType', columns: ['Revenue'], type: 'number' },
      { kind: 'datePart', column: 'InvoiceDate', part: 'year' },
      {
        kind: 'groupBy',
        keys: ['Category', 'Year'],
        aggs: [
          { name: 'Total Revenue', fn: 'sum', column: 'Revenue' },
          { name: 'Invoices', fn: 'count' },
        ],
      },
      { kind: 'sort', column: 'Total Revenue', descending: true },
    ],
  },
};

// ── 8. Conditional tiers ───────────────────────────────────────────
const s8: PQScenario = {
  id: 'pql-8',
  title: 'Customer loyalty tiers',
  difficulty: 'Core',
  skills: ['Merge columns', 'Data types', 'Conditional column', 'Choose columns'],
  story:
    'Marketing wants each customer’s full name and a loyalty tier based on last year’s spend: Gold from 1,000, Silver from 500, Bronze below that. Phone and notes aren’t needed in the model.',
  tasks: [
    'Merge First Name and Last Name into "Customer Name" with a space',
    'Set Spend as Decimal Number',
    'Add a conditional column "Tier": Spend ≥ 1000 → Gold, else Spend ≥ 500 → Silver, else Bronze',
    'Keep only CustomerID, Customer Name, Spend and Tier',
  ],
  hints: [
    'Merge Columns lives on the Transform tab (it replaces the columns) and on Add Column (it keeps them).',
    'Conditional column clauses are checked top to bottom — put the ≥ 1000 test first, or everyone over 500 becomes Silver.',
    'Choose Columns (Remove Other Columns) is safer than removing Phone and Notes: new columns in the file won’t sneak in.',
  ],
  queries: [
    csv('Customers', 'customers.csv', ['CustomerID', 'First Name', 'Last Name', 'Phone', 'Spend', 'Notes'], [
      ['C-01', 'Ana', 'Silva', '555-0101', '1520.40', 'Prefers email'],
      ['C-02', 'Ben', 'Okoro', '555-0102', '480.00', ''],
      ['C-03', 'Chloe', 'Park', '555-0103', '999.99', 'VIP event 2023'],
      ['C-04', 'Dev', 'Shah', '555-0104', '1000', ''],
      ['C-05', 'Ema', 'Novak', '555-0105', '230.50', 'New'],
      ['C-06', 'Felix', 'Wu', '555-0106', '750.00', ''],
      ['C-07', 'Gita', 'Rao', '555-0107', '2210.75', 'Corporate'],
      ['C-08', 'Hugo', 'Lind', '555-0108', '500', ''],
      ['C-09', 'Isla', 'Moore', '555-0109', '64.20', ''],
      ['C-10', 'Jon', 'Berg', '555-0110', '1105.00', 'Referral'],
    ]),
  ],
  check: 'Customers',
  solution: {
    Customers: [
      { kind: 'mergeColumns', columns: ['First Name', 'Last Name'], separator: ' ', name: 'Customer Name' },
      { kind: 'changeType', columns: ['Spend'], type: 'number' },
      {
        kind: 'conditionalColumn',
        name: 'Tier',
        clauses: [
          { column: 'Spend', test: 'greaterOrEqual', value: '1000', output: 'Gold' },
          { column: 'Spend', test: 'greaterOrEqual', value: '500', output: 'Silver' },
        ],
        otherwise: 'Bronze',
      },
      { kind: 'selectColumns', columns: ['CustomerID', 'Customer Name', 'Spend', 'Tier'] },
    ],
  },
};

export const PQ_SCENARIOS: PQScenario[] = [s1, s2, s3, s4, s5, s6, s7, s8];
