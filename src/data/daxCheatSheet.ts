/** DAX cheat sheet: the functions and patterns PL-300 actually tests. */

export type DaxCategory =
  | 'Aggregation'
  | 'Iterators (X functions)'
  | 'Filter context'
  | 'Relationships'
  | 'Time intelligence'
  | 'Logic & math'
  | 'Text'
  | 'Tables'
  | 'Security'
  | 'Information';

export interface DaxEntry {
  name: string;
  category: DaxCategory;
  syntax: string;
  does: string;
  example: string;
  trap?: string;
}

export const DAX_CATEGORIES: DaxCategory[] = [
  'Aggregation',
  'Iterators (X functions)',
  'Filter context',
  'Relationships',
  'Time intelligence',
  'Logic & math',
  'Text',
  'Tables',
  'Security',
  'Information',
];

export const DAX_ENTRIES: DaxEntry[] = [
  // ── Aggregation
  {
    name: 'SUM',
    category: 'Aggregation',
    syntax: 'SUM(<column>)',
    does: 'Adds up a numeric column in the current filter context.',
    example: 'Total Sales = SUM(Sales[SalesAmount])',
    trap: 'Takes one column only. To multiply two columns first (Qty × Price) you need SUMX.',
  },
  {
    name: 'AVERAGE',
    category: 'Aggregation',
    syntax: 'AVERAGE(<column>)',
    does: 'Arithmetic mean of a numeric column, ignoring blanks.',
    example: 'Avg Order Value = AVERAGE(Sales[SalesAmount])',
  },
  {
    name: 'MIN / MAX',
    category: 'Aggregation',
    syntax: 'MIN(<column>) · MAX(<column>) · MIN(<expr1>, <expr2>)',
    does: 'Smallest / largest value in a column, or of two scalar values.',
    example: 'Last Order Date = MAX(Sales[OrderDate])',
  },
  {
    name: 'COUNT / COUNTA',
    category: 'Aggregation',
    syntax: 'COUNT(<column>) · COUNTA(<column>)',
    does: 'COUNT counts non-blank numbers/dates; COUNTA counts any non-blank value.',
    example: 'Orders With Qty = COUNT(Sales[OrderQty])',
  },
  {
    name: 'COUNTROWS',
    category: 'Aggregation',
    syntax: 'COUNTROWS(<table>)',
    does: 'Number of rows in a table (or table expression) — the usual way to count transactions.',
    example: 'Order Count = COUNTROWS(Sales)',
    trap: 'Prefer COUNTROWS(Sales) over COUNT(Sales[ID]): it doesn’t depend on a column having no blanks.',
  },
  {
    name: 'DISTINCTCOUNT',
    category: 'Aggregation',
    syntax: 'DISTINCTCOUNT(<column>)',
    does: 'Number of distinct values, including one BLANK if present.',
    example: 'Customers = DISTINCTCOUNT(Sales[CustomerKey])',
    trap: 'Use DISTINCTCOUNTNOBLANK if a blank shouldn’t count as a value.',
  },

  // ── Iterators
  {
    name: 'SUMX',
    category: 'Iterators (X functions)',
    syntax: 'SUMX(<table>, <expression>)',
    does: 'Evaluates the expression row by row over the table, then sums the results.',
    example: 'Revenue = SUMX(Sales, Sales[OrderQty] * RELATED(Product[UnitPrice]))',
    trap: 'SUM(Qty) * SUM(Price) is not the same — it multiplies the totals, not each row.',
  },
  {
    name: 'AVERAGEX / MINX / MAXX / COUNTX',
    category: 'Iterators (X functions)',
    syntax: 'AVERAGEX(<table>, <expression>)',
    does: 'Row-by-row versions of AVERAGE, MIN, MAX and COUNT.',
    example: 'Avg Line Value = AVERAGEX(Sales, Sales[OrderQty] * Sales[UnitPrice])',
  },
  {
    name: 'RANKX',
    category: 'Iterators (X functions)',
    syntax: 'RANKX(<table>, <expression>, [value], [ASC|DESC], [SKIP|DENSE])',
    does: 'Rank of the current item among the rows of the table, by the expression.',
    example: 'Customer Rank = RANKX(ALLSELECTED(Customer[CustomerName]), [Total Sales], , DESC)',
    trap: 'Without ALL/ALLSELECTED the table only contains the current customer, so everyone ranks 1.',
  },
  {
    name: 'CONCATENATEX',
    category: 'Iterators (X functions)',
    syntax: 'CONCATENATEX(<table>, <expression>, [delimiter])',
    does: 'Joins the expression’s value for each row into one text.',
    example: 'Selected Regions = CONCATENATEX(VALUES(Geo[Region]), Geo[Region], ", ")',
  },

  // ── Filter context
  {
    name: 'CALCULATE',
    category: 'Filter context',
    syntax: 'CALCULATE(<expression>, <filter1>, <filter2>, …)',
    does: 'Evaluates the expression in a modified filter context. The only function (with CALCULATETABLE) that changes filters; also triggers context transition.',
    example: 'Bike Sales = CALCULATE([Total Sales], Product[Category] = "Bikes")',
    trap: 'A simple filter like Product[Category] = "Bikes" replaces any existing filter on that column — wrap it in KEEPFILTERS to intersect instead.',
  },
  {
    name: 'FILTER',
    category: 'Filter context',
    syntax: 'FILTER(<table>, <condition>)',
    does: 'Returns the rows of a table that meet a condition — an iterator that returns a table.',
    example: 'Big Orders = CALCULATE([Total Sales], FILTER(Sales, Sales[SalesAmount] > 1000))',
    trap: 'Use FILTER for conditions on measures; for a plain column condition, a boolean filter in CALCULATE is faster.',
  },
  {
    name: 'ALL / REMOVEFILTERS',
    category: 'Filter context',
    syntax: 'ALL(<table> | <column>, …) · REMOVEFILTERS(…)',
    does: 'Ignores filters on the table or columns. REMOVEFILTERS is the clearer name when used inside CALCULATE.',
    example: '% of Total = DIVIDE([Total Sales], CALCULATE([Total Sales], ALL(Product)))',
  },
  {
    name: 'ALLEXCEPT',
    category: 'Filter context',
    syntax: 'ALLEXCEPT(<table>, <column1>, …)',
    does: 'Removes every filter on the table except the listed columns.',
    example: '% of Category = DIVIDE([Total Sales], CALCULATE([Total Sales], ALLEXCEPT(Product, Product[Category])))',
  },
  {
    name: 'ALLSELECTED',
    category: 'Filter context',
    syntax: 'ALLSELECTED(<table> | <column>)',
    does: 'Removes filters coming from the visual’s rows/columns but keeps slicer and page filters.',
    example: '% of Visible Total = DIVIDE([Total Sales], CALCULATE([Total Sales], ALLSELECTED(Product)))',
    trap: 'ALL = grand total of everything; ALLSELECTED = total of what the user has selected in slicers.',
  },
  {
    name: 'KEEPFILTERS',
    category: 'Filter context',
    syntax: 'CALCULATE(<expr>, KEEPFILTERS(<filter>))',
    does: 'Adds the filter on top of existing ones (intersection) instead of overwriting them.',
    example: 'High-Margin Sales = CALCULATE([Total Sales], KEEPFILTERS(Product[MarginTier] = "High"))',
  },
  {
    name: 'VALUES / DISTINCT',
    category: 'Filter context',
    syntax: 'VALUES(<column> | <table>) · DISTINCT(<column>)',
    does: 'Distinct visible values of a column as a one-column table. VALUES includes the blank row from an invalid relationship; DISTINCT doesn’t.',
    example: 'Products Sold = COUNTROWS(VALUES(Sales[ProductKey]))',
  },
  {
    name: 'SELECTEDVALUE',
    category: 'Filter context',
    syntax: 'SELECTEDVALUE(<column>, [alternate])',
    does: 'The value of the column when exactly one is in context; otherwise the alternate (or BLANK).',
    example: 'Title = "Sales for " & SELECTEDVALUE(Geo[Region], "all regions")',
  },
  {
    name: 'HASONEVALUE / ISFILTERED',
    category: 'Filter context',
    syntax: 'HASONEVALUE(<column>) · ISFILTERED(<column>)',
    does: 'True when exactly one value is visible / when the column is directly filtered.',
    example: 'Region Sales = IF(HASONEVALUE(Geo[Region]), [Total Sales])',
  },
  {
    name: 'USERELATIONSHIP',
    category: 'Filter context',
    syntax: 'CALCULATE(<expr>, USERELATIONSHIP(<col1>, <col2>))',
    does: 'Activates an existing inactive relationship (dotted line) for this calculation only.',
    example: "Sales by Ship Date = CALCULATE([Total Sales], USERELATIONSHIP(Sales[ShipDate], 'Date'[Date]))",
    trap: 'It cannot create a relationship — the inactive one must already exist in the model.',
  },
  {
    name: 'CROSSFILTER',
    category: 'Filter context',
    syntax: 'CROSSFILTER(<col1>, <col2>, <Both|OneWay|None>)',
    does: 'Changes a relationship’s filter direction inside CALCULATE.',
    example: 'Customers Who Bought = CALCULATE(DISTINCTCOUNT(Customer[CustomerKey]), CROSSFILTER(Sales[CustomerKey], Customer[CustomerKey], Both))',
    trap: 'Safer than setting the model relationship to Both, which can make filters ambiguous.',
  },
  {
    name: 'TREATAS',
    category: 'Filter context',
    syntax: 'TREATAS(<table expression>, <column1>, …)',
    does: 'Applies values from one table as filters on columns of an unrelated table (a virtual relationship).',
    example: 'Budget for Selection = CALCULATE(SUM(Budget[Amount]), TREATAS(VALUES(Product[Category]), Budget[Category]))',
  },

  // ── Relationships
  {
    name: 'RELATED',
    category: 'Relationships',
    syntax: 'RELATED(<column>)',
    does: 'From the many side, fetches a value from the one side (lookup up the relationship) in a row context.',
    example: 'Sales[Category] = RELATED(Product[Category])',
    trap: 'Needs a row context — use it in a calculated column or inside an iterator like SUMX.',
  },
  {
    name: 'RELATEDTABLE',
    category: 'Relationships',
    syntax: 'RELATEDTABLE(<table>)',
    does: 'From the one side, returns the related rows on the many side.',
    example: 'Customer[Order Count] = COUNTROWS(RELATEDTABLE(Sales))',
  },
  {
    name: 'LOOKUPVALUE',
    category: 'Relationships',
    syntax: 'LOOKUPVALUE(<result col>, <search col>, <value>, …)',
    does: 'Finds a value by matching columns, without needing a relationship.',
    example: 'Sales[Rate] = LOOKUPVALUE(FX[Rate], FX[Currency], Sales[Currency], FX[Date], Sales[OrderDate])',
    trap: 'Errors if more than one different value matches. Prefer RELATED when a relationship exists.',
  },

  // ── Time intelligence
  {
    name: 'TOTALYTD / DATESYTD',
    category: 'Time intelligence',
    syntax: "TOTALYTD(<expr>, 'Date'[Date], [year end]) · CALCULATE(<expr>, DATESYTD('Date'[Date]))",
    does: 'Year-to-date total. Optional year-end date for fiscal years, e.g. "6/30".',
    example: "YTD Sales = TOTALYTD([Total Sales], 'Date'[Date])",
    trap: 'Needs a proper date table marked as a date table with contiguous dates.',
  },
  {
    name: 'DATESMTD / DATESQTD',
    category: 'Time intelligence',
    syntax: "DATESMTD('Date'[Date]) · DATESQTD('Date'[Date])",
    does: 'Month-to-date / quarter-to-date sets of dates for CALCULATE.',
    example: "MTD Sales = CALCULATE([Total Sales], DATESMTD('Date'[Date]))",
  },
  {
    name: 'SAMEPERIODLASTYEAR',
    category: 'Time intelligence',
    syntax: "SAMEPERIODLASTYEAR('Date'[Date])",
    does: 'The visible dates shifted back one year.',
    example: "PY Sales = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))",
  },
  {
    name: 'DATEADD',
    category: 'Time intelligence',
    syntax: "DATEADD('Date'[Date], <number>, DAY|MONTH|QUARTER|YEAR)",
    does: 'Shifts the visible dates by any interval, forwards or back.',
    example: "Prev Month Sales = CALCULATE([Total Sales], DATEADD('Date'[Date], -1, MONTH))",
  },
  {
    name: 'PREVIOUSMONTH / PARALLELPERIOD',
    category: 'Time intelligence',
    syntax: "PREVIOUSMONTH('Date'[Date]) · PARALLELPERIOD('Date'[Date], -1, YEAR)",
    does: 'Whole previous month / whole parallel period, regardless of how many days are visible.',
    example: "Last Month = CALCULATE([Total Sales], PREVIOUSMONTH('Date'[Date]))",
    trap: 'PARALLELPERIOD returns the full period; DATEADD keeps the same partial range.',
  },
  {
    name: 'DATESINPERIOD / DATESBETWEEN',
    category: 'Time intelligence',
    syntax: "DATESINPERIOD('Date'[Date], <end>, -3, MONTH) · DATESBETWEEN('Date'[Date], <start>, <end>)",
    does: 'Rolling windows and explicit date ranges.',
    example: "Rolling 3M = CALCULATE([Total Sales], DATESINPERIOD('Date'[Date], MAX('Date'[Date]), -3, MONTH))",
  },
  {
    name: 'CALENDAR / CALENDARAUTO',
    category: 'Time intelligence',
    syntax: 'CALENDAR(<start>, <end>) · CALENDARAUTO([fiscal year end month])',
    does: 'Creates a calculated date table with one row per day.',
    example: 'Date = CALENDAR(DATE(2023, 1, 1), DATE(2025, 12, 31))',
    trap: 'Then Mark as date table (Table tools) so time intelligence works with any date column type.',
  },

  // ── Logic & math
  {
    name: 'DIVIDE',
    category: 'Logic & math',
    syntax: 'DIVIDE(<numerator>, <denominator>, [alternate])',
    does: 'Safe division: returns BLANK (or the alternate) instead of an error when dividing by zero.',
    example: 'Margin % = DIVIDE([Profit], [Total Sales])',
    trap: 'The exam prefers DIVIDE over the / operator for ratios.',
  },
  {
    name: 'IF',
    category: 'Logic & math',
    syntax: 'IF(<condition>, <then>, [else])',
    does: 'Returns one value or another. Without else, returns BLANK.',
    example: 'Status = IF([Total Sales] > [Target], "On track", "Behind")',
  },
  {
    name: 'SWITCH',
    category: 'Logic & math',
    syntax: 'SWITCH(<expr>, <value1>, <result1>, …, [else]) · SWITCH(TRUE(), <cond1>, <result1>, …)',
    does: 'Cleaner than nested IFs. SWITCH(TRUE(), …) tests conditions top to bottom.',
    example: 'Tier = SWITCH(TRUE(), [Spend] >= 1000, "Gold", [Spend] >= 500, "Silver", "Bronze")',
  },
  {
    name: 'VAR … RETURN',
    category: 'Logic & math',
    syntax: 'VAR <name> = <expr> … RETURN <result>',
    does: 'Stores intermediate results: easier to read, and each is evaluated once.',
    example: 'YoY % =\nVAR Cur = [Total Sales]\nVAR Prev = [PY Sales]\nRETURN DIVIDE(Cur - Prev, Prev)',
    trap: 'A variable is evaluated where it’s defined — CALCULATE later can’t change its value.',
  },
  {
    name: 'AND / OR / && / ||',
    category: 'Logic & math',
    syntax: 'AND(<a>, <b>) · <a> && <b> && <c>',
    does: 'Logical tests. AND/OR take exactly two arguments; the operators chain any number.',
    example: 'Flag = IF(Sales[Qty] > 10 && Sales[Discount] = 0, 1, 0)',
  },
  {
    name: 'BLANK / ISBLANK / COALESCE',
    category: 'Logic & math',
    syntax: 'BLANK() · ISBLANK(<value>) · COALESCE(<v1>, <v2>, …)',
    does: 'Work with empty values. COALESCE returns the first non-blank argument.',
    example: 'Sales or 0 = COALESCE([Total Sales], 0)',
    trap: 'Turning blanks into 0 makes visuals show every row, including ones with no data.',
  },
  {
    name: 'IFERROR',
    category: 'Logic & math',
    syntax: 'IFERROR(<value>, <value if error>)',
    does: 'Catches errors. Usually a sign the logic could be written safely (e.g. DIVIDE) instead.',
    example: 'Safe Ratio = IFERROR([A] / [B], 0)',
  },
  {
    name: 'ROUND / INT / MOD / ABS',
    category: 'Logic & math',
    syntax: 'ROUND(<number>, <digits>) · INT(<number>)',
    does: 'Rounding and basic arithmetic helpers.',
    example: 'Rounded = ROUND([Total Sales], 0)',
  },

  // ── Text
  {
    name: '& / CONCATENATE',
    category: 'Text',
    syntax: '<text1> & <text2> · CONCATENATE(<text1>, <text2>)',
    does: 'Joins text. CONCATENATE takes exactly two arguments; & chains any number.',
    example: 'Customer[Full Name] = Customer[First] & " " & Customer[Last]',
  },
  {
    name: 'FORMAT',
    category: 'Text',
    syntax: 'FORMAT(<value>, <format string>)',
    does: 'Converts a value to text with a format.',
    example: 'Month Label = FORMAT(\'Date\'[Date], "mmm yyyy")',
    trap: 'The result is text — it sorts alphabetically (Apr, Aug, Dec…) unless you set Sort by column.',
  },
  {
    name: 'LEFT / RIGHT / MID / LEN',
    category: 'Text',
    syntax: 'LEFT(<text>, <n>) · MID(<text>, <start>, <n>)',
    does: 'Extract parts of text.',
    example: 'Product[Prefix] = LEFT(Product[Code], 3)',
  },
  {
    name: 'SEARCH / FIND / SUBSTITUTE',
    category: 'Text',
    syntax: 'SEARCH(<find>, <within>, [start], [not found]) · SUBSTITUTE(<text>, <old>, <new>)',
    does: 'SEARCH is case-insensitive, FIND case-sensitive. SUBSTITUTE replaces text.',
    example: 'Has Bike = IF(SEARCH("bike", Product[Name], 1, 0) > 0, "Yes", "No")',
  },
  {
    name: 'UPPER / LOWER / TRIM',
    category: 'Text',
    syntax: 'UPPER(<text>) · TRIM(<text>)',
    does: 'Change case and remove extra spaces.',
    example: 'Code = UPPER(TRIM(Product[RawCode]))',
    trap: 'Text cleaning usually belongs in Power Query, not DAX calculated columns.',
  },

  // ── Tables
  {
    name: 'SUMMARIZECOLUMNS',
    category: 'Tables',
    syntax: 'SUMMARIZECOLUMNS(<group col>, …, <name>, <expr>, …)',
    does: 'Grouped table with measures — what visuals generate behind the scenes.',
    example: 'Sales by Category = SUMMARIZECOLUMNS(Product[Category], "Sales", [Total Sales])',
  },
  {
    name: 'SUMMARIZE / ADDCOLUMNS',
    category: 'Tables',
    syntax: 'SUMMARIZE(<table>, <group col>, …) · ADDCOLUMNS(<table>, <name>, <expr>)',
    does: 'Group a table, then add calculated columns to it.',
    example: 'ADDCOLUMNS(SUMMARIZE(Sales, Customer[Name]), "Sales", [Total Sales])',
    trap: 'Add measures with ADDCOLUMNS, not inside SUMMARIZE.',
  },
  {
    name: 'SELECTCOLUMNS',
    category: 'Tables',
    syntax: 'SELECTCOLUMNS(<table>, <name>, <expr>, …)',
    does: 'Picks and renames columns of a table expression.',
    example: 'SELECTCOLUMNS(Customer, "Name", Customer[CustomerName], "Region", Customer[Region])',
  },
  {
    name: 'TOPN',
    category: 'Tables',
    syntax: 'TOPN(<n>, <table>, <order by expr>, [ASC|DESC])',
    does: 'The top N rows by an expression.',
    example: 'Top 5 Sales = CALCULATE([Total Sales], TOPN(5, ALL(Product[ProductName]), [Total Sales]))',
  },
  {
    name: 'GENERATESERIES',
    category: 'Tables',
    syntax: 'GENERATESERIES(<start>, <end>, [step])',
    does: 'A one-column table of numbers — what what-if parameters create.',
    example: 'Discount % = GENERATESERIES(0, 0.3, 0.05)',
  },

  // ── Security
  {
    name: 'USERPRINCIPALNAME',
    category: 'Security',
    syntax: 'USERPRINCIPALNAME()',
    does: 'The signed-in user’s UPN (usually their email). The standard function for dynamic RLS.',
    example: 'DimEmployee[EmailAddress] = USERPRINCIPALNAME()',
    trap: 'USERNAME() returns DOMAIN\\user in Desktop but the UPN in the Service — USERPRINCIPALNAME is consistent.',
  },
  {
    name: 'Role filter (RLS)',
    category: 'Security',
    syntax: "Table[Column] = <value>  (Modeling › Manage roles)",
    does: 'A true/false DAX expression per row; the role sees only rows where it’s true. Filters flow through relationships.',
    example: 'Geo[Region] = "West"',
    trap: 'RLS applies to Viewers only. Workspace Admins, Members and Contributors see all data.',
  },

  // ── Information
  {
    name: 'ISINSCOPE',
    category: 'Information',
    syntax: 'ISINSCOPE(<column>)',
    does: 'True when the column is the current grouping level in a hierarchy — handy for different totals at each level.',
    example: 'Label = IF(ISINSCOPE(Product[ProductName]), "Product", "Subtotal")',
  },
  {
    name: 'Measure vs calculated column',
    category: 'Information',
    syntax: 'Measure: evaluated at query time · Column: evaluated at refresh, stored',
    does: 'Measures respond to filters and use no storage; calculated columns are computed per row and can be used in slicers and relationships.',
    example: 'Use a column to slice by "Price Band"; use a measure for "Total Sales".',
    trap: 'Columns increase model size and are calculated at refresh — not per user selection.',
  },
];

export interface DaxPattern {
  title: string;
  why: string;
  code: string;
}

export const DAX_PATTERNS: DaxPattern[] = [
  {
    title: 'Year-over-year growth %',
    why: 'The most-asked time intelligence pattern: compare with the same period last year.',
    code:
      "YoY % =\nVAR Cur = [Total Sales]\nVAR Prev = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))\nRETURN DIVIDE(Cur - Prev, Prev)",
  },
  {
    title: '% of grand total',
    why: 'Remove filters on the dimension in the denominator only.',
    code: '% of Total =\nDIVIDE([Total Sales], CALCULATE([Total Sales], ALL(Product)))',
  },
  {
    title: 'Running total',
    why: 'Sum every date up to the latest visible one.',
    code:
      "Running Total =\nCALCULATE(\n    [Total Sales],\n    FILTER(ALL('Date'[Date]), 'Date'[Date] <= MAX('Date'[Date]))\n)",
  },
  {
    title: 'Rank that respects slicers',
    why: 'ALLSELECTED ranks among the items the user can see.',
    code: 'Rank =\nRANKX(ALLSELECTED(Customer[CustomerName]), [Total Sales], , DESC, DENSE)',
  },
  {
    title: 'Dynamic row-level security',
    why: 'One role for everyone; each user sees their own rows.',
    code: 'DimEmployee[EmailAddress] = USERPRINCIPALNAME()',
  },
  {
    title: 'Measure based on an inactive relationship',
    why: 'Report by ship date while order date stays the active relationship.',
    code: "Sales by Ship Date =\nCALCULATE([Total Sales], USERELATIONSHIP(Sales[ShipDate], 'Date'[Date]))",
  },
  {
    title: 'Dynamic title',
    why: 'Show what the user filtered on in a visual title (Format › Title › fx).',
    code: 'Title =\n"Sales for " & SELECTEDVALUE(Geo[Region], "all regions")',
  },
];
