import { Flashcard, MatrixDrill } from '../types/pl300';
import { shuffle } from '../utils/shuffle';

export const WORKSPACE_ROLE_MATRIX = [
  {
    capability: 'View & interact with reports / dashboards',
    admin: 'Yes',
    member: 'Yes',
    contributor: 'Yes',
    viewer: 'Yes',
  },
  {
    capability: 'Subject to Row-Level Security (RLS)',
    admin: 'No (Bypasses)',
    member: 'No (Bypasses)',
    contributor: 'No (Bypasses)',
    viewer: 'YES (Enforced)',
  },
  {
    capability: 'Publish, edit & delete reports / datasets',
    admin: 'Yes',
    member: 'Yes',
    contributor: 'Yes',
    viewer: 'No',
  },
  {
    capability: 'Schedule refreshes & configure gateways',
    admin: 'Yes',
    member: 'Yes',
    contributor: 'Yes',
    viewer: 'No',
  },
  {
    capability: 'Publish or update Workspace App',
    admin: 'Yes',
    member: 'Yes',
    contributor: 'Only if delegated',
    viewer: 'No',
  },
  {
    capability: 'Add Members, Contributors, or Viewers',
    admin: 'Yes',
    member: 'Yes',
    contributor: 'No',
    viewer: 'No',
  },
  {
    capability: 'Add/remove Admins or delete workspace',
    admin: 'Yes',
    member: 'No',
    contributor: 'No',
    viewer: 'No',
  },
];

export const STORAGE_MODE_MATRIX = [
  {
    feature: 'Data Location',
    importMode: 'Copied & compressed in VertiPaq RAM',
    directQuery: 'Stays in source DB; queried live',
    dualMode: 'Cached in RAM + can act DirectQuery',
  },
  {
    feature: 'Visual Performance',
    importMode: 'Fastest (sub-second in-memory)',
    directQuery: 'Depends on source DB & network latency',
    dualMode: 'Fast for slicers; live when joined to DQ fact',
  },
  {
    feature: 'Data Freshness',
    importMode: 'As of last scheduled refresh (8 Pro / 48 PPU)',
    directQuery: 'Near real-time on visual interaction',
    dualMode: 'Cached dim updates on refresh; DQ fact live',
  },
  {
    feature: 'DAX & Power Query Limits',
    importMode: 'Full DAX & Power Query support',
    directQuery: 'Restricted M folding & slower Time Intel',
    dualMode: 'Must follow DirectQuery source limits',
  },
  {
    feature: 'Best PL-300 Use Case',
    importMode: 'Default choice (<1GB Pro / <10GB Premium)',
    directQuery: 'Massive datasets or strict real-time SLA',
    dualMode: 'Dimension tables shared with DQ facts',
  },
];

export const DAX_MODIFIER_MATRIX = [
  {
    fn: 'CALCULATE(expr, filter1, ...)',
    role: 'Modifies filter context & triggers context transition',
    trap: 'Simple predicates like Col = "X" OVERWRITE existing slicers on Col!',
  },
  {
    fn: 'KEEPFILTERS(predicate)',
    role: 'Intersects new filter with active slicers on same column',
    trap: 'Essential when a page slicer and CALCULATE filter touch the same column.',
  },
  {
    fn: 'ALL(Table / Col)',
    role: 'Removes ALL filters (both visual & external slicers)',
    trap: 'Use for Grand Total / % of All Categories regardless of slicers.',
  },
  {
    fn: 'ALLSELECTED(Table / Col)',
    role: 'Removes inner visual filters while KEEPING external slicers',
    trap: 'Use for % of Selected Total or slicer-responsive RANKX.',
  },
  {
    fn: 'ALLEXCEPT(Table, Col1, ...)',
    role: 'Clears all filters on Table EXCEPT specified columns',
    trap: 'If a visual filters by Col2, it gets cleared; only Col1 filters survive.',
  },
  {
    fn: 'USERELATIONSHIP(col1, col2)',
    role: 'Temporarily activates an inactive relationship inside CALCULATE',
    trap: 'Requires an inactive dashed relationship to already exist in Model view.',
  },
];

const RAW_MATRIX_DRILLS: MatrixDrill[] = [
  // Workspace Roles (6)
  {
    id: 'md-w1',
    category: 'Workspace Roles',
    scenario:
      'A manager needs to view reports in the Finance workspace and be restricted by Dynamic Row-Level Security (RLS) so they only see their own department.',
    options: ['Viewer', 'Contributor', 'Member', 'Admin'],
    correctOption: 'Viewer',
    explanation:
      'RLS ONLY restricts users assigned the Viewer role (or App consumers without workspace write rights). Contributor, Member, and Admin all bypass RLS.',
    ruleOfThumb: 'RLS must apply? -> Viewer (or Workspace App)!',
  },
  {
    id: 'md-w2',
    category: 'Workspace Roles',
    scenario:
      'An analyst needs to publish new PBIX files and edit existing reports in a workspace, but must NOT be allowed to add new users or delete the workspace.',
    options: ['Viewer', 'Contributor', 'Member', 'Admin'],
    correctOption: 'Contributor',
    explanation:
      'Contributor is the least-privilege role that allows publishing/editing content and scheduling refreshes while blocking user management.',
    ruleOfThumb: 'Publish/Edit content, NO user management -> Contributor.',
  },
  {
    id: 'md-w3',
    category: 'Workspace Roles',
    scenario:
      'A BI lead must be able to publish and update the Workspace App and add Analysts as Contributors, while NOT being permitted to delete the workspace or assign other Admins.',
    options: ['Viewer', 'Contributor', 'Member', 'Admin'],
    correctOption: 'Member',
    explanation:
      'Member can manage content, publish/update Apps, and add Members/Contributors/Viewers, but cannot add Admins or delete the workspace.',
    ruleOfThumb: 'Publish Apps + add non-Admin users -> Member.',
  },
  {
    id: 'md-w4',
    category: 'Workspace Roles',
    scenario:
      'You need to transfer full ownership of a workspace, including the ability to update workspace settings, add other Admins, or permanently delete the workspace.',
    options: ['Viewer', 'Contributor', 'Member', 'Admin'],
    correctOption: 'Admin',
    explanation:
      'Only the Admin role can delete a workspace, manage workspace settings/connections, and add or remove other Admins.',
    ruleOfThumb: 'Delete workspace or add Admins -> Admin only.',
  },
  {
    id: 'md-w5',
    category: 'Workspace Roles',
    scenario:
      'Your HR team wants 200 employees to consume 3 polished reports from a single workspace while seeing ONLY the subset of reports meant for their division (Sales vs Ops) without accessing workspace drafts.',
    options: [
      'Add all 200 employees as Workspace Contributors',
      'Publish a Workspace App with separate App Audiences',
      'Give all 200 employees Workspace Member access',
      'Email PBIX files weekly',
    ],
    correctOption: 'Publish a Workspace App with separate App Audiences',
    explanation:
      'Workspace Apps decouple report consumption from workspace authoring, and App Audiences allow up to 25 tailored content/permission views from a single workspace.',
    ruleOfThumb: 'Tailored read-only distribution per stakeholder group -> Workspace App Audiences.',
  },
  {
    id: 'md-w6',
    category: 'Workspace Roles',
    scenario:
      'A dataset owner without Admin rights wants to signal to the organization that their dataset is useful and ready for reuse, before formal governance team certification.',
    options: [
      'Certify the dataset',
      'Promote the dataset',
      'Assign Viewer role to Everyone',
      'Enable Auto Date/Time',
    ],
    correctOption: 'Promote the dataset',
    explanation:
      'Any semantic model owner (Member/Admin/Contributor with write access) can **Promote** their own dataset. **Certify** requires explicit tenant authorization from Power BI Admins.',
    ruleOfThumb: 'Self-endorsement = Promoted | Formal CoE approval = Certified.',
  },

  // Storage Modes (6)
  {
    id: 'md-s1',
    category: 'Storage Modes',
    scenario:
      'A 15 MB Excel/SQL sales dataset refreshes overnight and business users demand sub-second slicer and cross-filter performance plus full DAX Time Intelligence.',
    options: ['Import', 'DirectQuery', 'Dual', 'Live Connection'],
    correctOption: 'Import',
    explanation:
      'Import mode stores compressed columnar data in VertiPaq RAM, delivering the fastest query speed and unrestricted DAX & Power Query capabilities.',
    ruleOfThumb: 'Default choice unless data size or real-time latency forbids it -> Import.',
  },
  {
    id: 'md-s2',
    category: 'Storage Modes',
    scenario:
      'An enterprise warehouse holds 4 billion banking transactions that cannot be duplicated into Power BI memory due to size and strict 1-minute data latency requirements.',
    options: ['Import', 'DirectQuery', 'Dual', 'Calculated Table'],
    correctOption: 'DirectQuery',
    explanation:
      'DirectQuery leaves the 4B rows in the source database and translates visual interactions into live source SQL queries.',
    ruleOfThumb: 'Too huge to import OR near real-time SLA -> DirectQuery.',
  },
  {
    id: 'md-s3',
    category: 'Storage Modes',
    scenario:
      'In a Composite model, FactLiveOrders uses DirectQuery and FactTargets uses Import. Both fact tables slice by DimProduct (2,000 rows). Which mode minimizes cross-source overhead and keeps Product slicers instant?',
    options: ['Import', 'DirectQuery', 'Dual', 'Disconnected'],
    correctOption: 'Dual',
    explanation:
      'Dual mode lets DimProduct serve slicers and joins against FactTargets from RAM (Import) while also joining natively in SQL when queried alongside FactLiveOrders (DirectQuery).',
    ruleOfThumb: 'Dimension shared by DirectQuery & Import facts -> Dual.',
  },
  {
    id: 'md-s4',
    category: 'Storage Modes',
    scenario:
      'An analyst creates a new thin PBIX report that connects directly to an already-published Certified Enterprise Semantic Model in the Power BI Service with no local tables.',
    options: ['Import', 'DirectQuery', 'Dual', 'Live Connection'],
    correctOption: 'Live Connection',
    explanation:
      'Connecting exclusively to a published Power BI semantic model (or SSAS/Azure AS) with no local model uses a Live Connection.',
    ruleOfThumb: 'Thin report on an existing published Semantic Model -> Live Connection.',
  },
  {
    id: 'md-s5',
    category: 'Storage Modes',
    scenario:
      'You have an Import model of 80M rows where 78M rows are historical years (2020–2025) that never change, and only the last 7 days update daily. Refreshes take 90 minutes.',
    options: [
      'Switch everything to DirectQuery',
      'Enable Incremental Refresh on Import mode with RangeStart/RangeEnd',
      'Switch the Date table to Dual mode',
      'Enable Auto Date/Time',
    ],
    correctOption: 'Enable Incremental Refresh on Import mode with RangeStart/RangeEnd',
    explanation:
      'Incremental Refresh preserves fast Import mode performance while partitioning historical years once and refreshing only the recent rolling window.',
    ruleOfThumb: 'Large historical Import table + small daily deltas -> Incremental Refresh.',
  },
  {
    id: 'md-s6',
    category: 'Storage Modes',
    scenario:
      'You need to join an Import Excel lookup table with a DirectQuery Azure SQL table in the same PBIX without importing the SQL table.',
    options: [
      'Standard Import model',
      'Composite model (Import + DirectQuery)',
      'Live Connection only',
      'Append Queries in Power Query',
    ],
    correctOption: 'Composite model (Import + DirectQuery)',
    explanation:
      'Combining tables from Import and DirectQuery sources in the same semantic model creates a Composite model.',
    ruleOfThumb: 'Mixing Import + DirectQuery in one PBIX -> Composite Model.',
  },

  // Security (RLS/OLS) (6)
  {
    id: 'md-r1',
    category: 'Security (RLS/OLS)',
    scenario:
      'Sales reps across 50 countries should only see sales rows for their assigned country, managed automatically via a single security role linked to a User-Country mapping table.',
    options: [
      'Static RLS (50 manual roles)',
      'Dynamic RLS using USERPRINCIPALNAME()',
      'Object-Level Security (OLS)',
      'Workspace Contributor role',
    ],
    correctOption: 'Dynamic RLS using USERPRINCIPALNAME()',
    explanation:
      'Dynamic RLS scales to 50 or 50,000 users using ONE role and a DAX filter matching USERPRINCIPALNAME() against a permissions table.',
    ruleOfThumb: 'Many users/regions mapped via user email table -> Dynamic RLS.',
  },
  {
    id: 'md-r2',
    category: 'Security (RLS/OLS)',
    scenario:
      'Everyone in the HR department can see all employee rows, EXCEPT non-executives must be completely blocked from querying or seeing the [BaseSalary] and [Bonus] columns in any visual or Analyze in Excel.',
    options: [
      'Dynamic Row-Level Security (RLS)',
      'Object-Level Security (OLS)',
      'Hiding columns in Report View',
      'Bookmark visibility toggle',
    ],
    correctOption: 'Object-Level Security (OLS)',
    explanation:
      'RLS restricts ROWS; Object-Level Security (OLS) restricts entire TABLES or COLUMNS (like Salary) at the semantic model engine level — whereas hiding in Report View is cosmetic only.',
    ruleOfThumb: 'Hide sensitive COLUMNS or TABLES securely -> Object-Level Security (OLS).',
  },
  {
    id: 'md-r3',
    category: 'Security (RLS/OLS)',
    scenario:
      'Before publishing to the Power BI Service, you want to verify in Power BI Desktop that your Dynamic RLS role filters data properly for user "maria@contoso.com".',
    options: [
      'Publish first and email Maria',
      'Modeling -> View as -> check the Role AND "Other user" = maria@contoso.com',
      'Change USERPRINCIPALNAME() to "maria@contoso.com" temporarily',
      'Test using Performance Analyzer',
    ],
    correctOption: 'Modeling -> View as -> check the Role AND "Other user" = maria@contoso.com',
    explanation:
      'In Power BI Desktop, "View as" lets you impersonate BOTH the RLS role and an arbitrary "Other user" UPN to test USERPRINCIPALNAME() locally.',
    ruleOfThumb: 'Testing Dynamic RLS in Desktop -> View as -> Role + Other user.',
  },
  {
    id: 'md-r4',
    category: 'Security (RLS/OLS)',
    scenario:
      'You only have 3 fixed regions (North, South, West) with no employee mapping table and no frequent changes expected. Which security approach is simplest?',
    options: [
      'Static RLS (3 roles: [Region]="North", etc.)',
      'Dynamic RLS with USERPRINCIPALNAME()',
      'Object-Level Security',
      'Separate PBIX files per region',
    ],
    correctOption: 'Static RLS (3 roles: [Region]="North", etc.)',
    explanation:
      'Static RLS with explicit filter rules per role is ideal for a small, fixed set of categories while keeping a single PBIX and single dataset.',
    ruleOfThumb: 'Few fixed groups, no user-table needed -> Static RLS.',
  },
  {
    id: 'md-r5',
    category: 'Security (RLS/OLS)',
    scenario:
      'You want to enforce Microsoft Purview classification (e.g., "Highly Confidential") that travels with Power BI reports even when users export tables to Excel or PDF.',
    options: [
      'Dynamic RLS',
      'Sensitivity Labels',
      'Workspace App Audiences',
      'Certify Dataset',
    ],
    correctOption: 'Sensitivity Labels',
    explanation:
      'Microsoft Purview Sensitivity Labels propagate downstream from semantic models to reports, dashboards, and exported Excel/PDF/PowerPoint files.',
    ruleOfThumb: 'Protect exported Excel/PDF files via Purview -> Sensitivity Labels.',
  },
  {
    id: 'md-r6',
    category: 'Security (RLS/OLS)',
    scenario:
      'A user belongs to TWO Static RLS roles on the same dataset: Role A ([Country]="USA") and Role B ([Category]="Bikes"). What data does the user see?',
    options: [
      'Intersection (AND): only Bikes in USA',
      'Union (OR): all rows in USA PLUS all Bikes rows globally',
      'Power BI throws a security conflict error',
      'Only Role A applies alphabetically',
    ],
    correctOption: 'Union (OR): all rows in USA PLUS all Bikes rows globally',
    explanation:
      'Multiple RLS roles in Power BI combine additively (logical OR / Union), granting the user access to rows matched by Role A OR Role B.',
    ruleOfThumb: 'Multiple RLS roles assigned to one user = Union (OR), never Intersection!',
  },

  // Visual Selection (6)
  {
    id: 'md-v1',
    category: 'Visual Selection',
    scenario:
      'Show how an opening balance of $500k changes across monthly positive inflows (+Marketing, +Renewals) and negative outflows (-Churn, -Refunds) down to a $620k ending balance.',
    options: ['Ribbon Chart', 'Waterfall Chart', 'Funnel Chart', 'Stacked Column Chart'],
    correctOption: 'Waterfall Chart',
    explanation:
      'Waterfall charts visualize a running total as positive and negative incremental bridges from a starting figure to an ending total.',
    ruleOfThumb: 'Running positive/negative bridge to a total -> Waterfall Chart.',
  },
  {
    id: 'md-v2',
    category: 'Visual Selection',
    scenario:
      'Compare how 6 product lines climbed or dropped in sales RANK over 12 months so leadership immediately spots rank crossovers.',
    options: ['Ribbon Chart', 'Line Chart', 'Waterfall Chart', 'Treemap'],
    correctOption: 'Ribbon Chart',
    explanation:
      'A Ribbon Chart orders categories by rank in each time period and visually highlights rank crossovers with connecting ribbons.',
    ruleOfThumb: 'Rank swaps over time -> Ribbon Chart.',
  },
  {
    id: 'md-v3',
    category: 'Visual Selection',
    scenario:
      'Display the relationship between Marketing Spend (X-axis), Revenue (Y-axis), and Store Size (Bubble Size) animated across 24 months.',
    options: ['Scatter Chart with Play Axis', 'Combo Line & Clustered Column', 'Funnel Chart', 'Matrix'],
    correctOption: 'Scatter Chart with Play Axis',
    explanation:
      'Scatter charts plot two quantitative variables plus bubble size and include a native Play Axis for time animation.',
    ruleOfThumb: '2 numeric axes + bubble size + animation -> Scatter Chart (Play Axis).',
  },
  {
    id: 'md-v4',
    category: 'Visual Selection',
    scenario:
      'Use machine learning inside Power BI to automatically rank which customer attributes (e.g., Contract Type = Month-to-Month, Support Calls > 3) statistically increase the likelihood of Churn.',
    options: ['Decomposition Tree', 'Key Influencers', 'Smart Narrative', 'Anomaly Detection'],
    correctOption: 'Key Influencers',
    explanation:
      'Key Influencers performs statistical regression/decision-tree analysis to identify and rank top drivers and Top Segments for a target metric or state.',
    ruleOfThumb: 'Statistical driver ranking + Top Segments -> Key Influencers.',
  },
  {
    id: 'md-v5',
    category: 'Visual Selection',
    scenario:
      'Allow executives to interactively break down Total Cost across arbitrary hierarchies (Country -> Department -> Vendor OR Vendor -> Country) and ask AI for the highest cost contributor.',
    options: ['Decomposition Tree', 'Key Influencers', 'Matrix with +/- icons', 'Treemap'],
    correctOption: 'Decomposition Tree',
    explanation:
      'Decomposition Tree enables dynamic ad-hoc splitting across dimensions in any order and supports AI Splits ("High value" / "Low value").',
    ruleOfThumb: 'Ad-hoc hierarchical breakdown in any order -> Decomposition Tree.',
  },
  {
    id: 'md-v6',
    category: 'Visual Selection',
    scenario:
      'Visualize sequential conversion drop-off percentages through sales pipeline stages: Leads -> Qualified -> Proposal -> Closed Won.',
    options: ['Funnel Chart', 'Waterfall Chart', 'Gauge', 'Ribbon Chart'],
    correctOption: 'Funnel Chart',
    explanation:
      'Funnel charts are purpose-built for linear sequential stages where each stage narrows down (conversion & drop-off % across stages).',
    ruleOfThumb: 'Sequential pipeline stage conversion -> Funnel Chart.',
  },
];

export const FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    domain: 'prepare',
    category: 'Power Query Profiling',
    front: 'In Power Query Column Distribution, what is the difference between "Distinct" and "Unique"?',
    back: 'Distinct = total count of different values (e.g., [A, A, B] has 2 distinct). Unique = count of values that appear ONLY ONCE ([A, A, B] has 1 unique: B). A primary key column has Distinct == Unique == Row Count.',
    examTrap: 'Remember Column Profiling defaults to the top 1,000 rows unless switched to the entire dataset in the bottom-left status bar.',
  },
  {
    id: 'fc-2',
    domain: 'prepare',
    category: 'Query Folding',
    front: 'How do you verify in Power Query Desktop whether a step folds back to the source database?',
    back: 'Right-click the Applied Step and check if "View Native Query" is clickable (enabled). If grayed out from that step onward, query folding broke at that step.',
    examTrap: 'Always place Filter Rows, Remove Columns, and Group By BEFORE Add Index Column or custom M functions.',
  },
  {
    id: 'fc-3',
    domain: 'prepare',
    category: 'Merge vs Append',
    front: 'When do you use Merge Queries vs. Append Queries, and what does a Left Anti Join return?',
    back: 'Merge = SQL JOIN (combines columns horizontally by matching keys). Append = SQL UNION ALL (stacks rows vertically). Left Anti Join returns ONLY rows from the Left table that have NO match in the Right table (great for finding orphan keys).',
  },
  {
    id: 'fc-4',
    domain: 'prepare',
    category: 'Storage Modes',
    front: 'When should a table use Dual storage mode?',
    back: 'For Dimension tables in a Composite model that are shared between Import and DirectQuery fact tables (or used as slicers over a DirectQuery fact table). Dual caches the dimension for instant slicers while allowing native SQL joins on the DirectQuery side.',
  },
  {
    id: 'fc-5',
    domain: 'prepare',
    category: 'Staging Queries',
    front: 'How do you configure intermediate staging queries in Power Query so they refresh with the report without entering the data model?',
    back: 'Right-click the staging query -> UNCHECK "Enable load", and KEEP "Include in report refresh" checked.',
  },
  {
    id: 'fc-6',
    domain: 'prepare',
    category: 'Data Shaping',
    front: 'Why use "Unpivot Other Columns" on ID/Dimension columns instead of "Unpivot Columns" on month columns?',
    back: 'Unpivot Other Columns hardcodes the stable key columns in M code, so if new month columns (e.g., Apr, May) arrive later in Excel/CSV, they automatically unpivot without breaking.',
    codeSnippet: 'Table.UnpivotOtherColumns(Source, {"Dept", "Year"}, "Month", "Budget")',
  },
  {
    id: 'fc-7',
    domain: 'model',
    category: 'Star Schema',
    front: 'Why should Snowflake dimension chains be flattened into a Star Schema in Power BI?',
    back: 'Star Schema reduces relationship hops during query execution, eliminates complex multi-level filter propagation, simplifies DAX measures, and shrinks model complexity.',
  },
  {
    id: 'fc-8',
    domain: 'model',
    category: 'Relationships',
    front: 'How should you model multiple date columns (OrderDate, ShipDate, DueDate) on a single Fact table?',
    back: 'Keep ONE active relationship (OrderDate -> Date) and create INACTIVE (dashed) relationships for ShipDate and DueDate. Activate them inside measures via CALCULATE(..., USERELATIONSHIP(...)).',
    codeSnippet: 'Shipped Sales = CALCULATE([Sales], USERELATIONSHIP(Sales[ShipDate], \'Date\'[Date]))',
  },
  {
    id: 'fc-9',
    domain: 'model',
    category: 'DAX Context',
    front: 'What is the core difference between Row Context and Filter Context?',
    back: 'Row Context iterates row-by-row (present in Calculated Columns and Iterator functions like SUMX/FILTER). Filter Context is the set of active filters from slicers, rows/columns, and CALCULATE before a Measure evaluates.',
    examTrap: 'Calculated Columns have Row Context by default (not Filter Context); Measures have Filter Context by default (not Row Context).',
  },
  {
    id: 'fc-10',
    domain: 'model',
    category: 'DAX Modifiers',
    front: 'What is the difference between ALL() and ALLSELECTED() inside CALCULATE?',
    back: 'ALL(Col) clears ALL filters on Col, ignoring both the visual cells AND external slicers. ALLSELECTED(Col) clears only the inner visual row/column filters while respecting external slicers and page filters.',
  },
  {
    id: 'fc-11',
    domain: 'model',
    category: 'DAX Modifiers',
    front: 'What does KEEPFILTERS() do inside CALCULATE?',
    back: 'Instead of overwriting an existing slicer/filter on the same column, KEEPFILTERS intersects the CALCULATE predicate with the active filter context.',
    codeSnippet: 'CALCULATE([Sales], KEEPFILTERS(Product[Color] = "Red"))',
  },
  {
    id: 'fc-12',
    domain: 'model',
    category: 'Time Intelligence',
    front: 'What are the 4 requirements for "Mark as Date Table" & Time Intelligence functions?',
    back: '1) At least one column of Date or Date/Time data type, 2) Unique values (no duplicates), 3) No null/blank dates, 4) Contiguous dates covering full years with no gaps.',
  },
  {
    id: 'fc-13',
    domain: 'model',
    category: 'VertiPaq Optimization',
    front: 'Why should you disable "Auto date/time" and split high-cardinality DateTime columns?',
    back: 'Auto date/time builds a hidden LocalDateTable for EVERY date column, bloating RAM. Splitting DateTime (with seconds/ms) into Date + Time/Hour drastically lowers cardinality and improves VertiPaq compression.',
  },
  {
    id: 'fc-14',
    domain: 'model',
    category: 'Performance Analyzer',
    front: 'What are the three timing categories shown in Power BI Performance Analyzer?',
    back: '1) DAX query (time spent by engine running DAX), 2) Visual display (browser rendering time; grows with too many data points), 3) Other (waiting in queue behind other visuals on the page).',
  },
  {
    id: 'fc-15',
    domain: 'visualize',
    category: 'Bookmarks',
    front: 'How do you stop a Bookmark from resetting the user\'s active page slicers?',
    back: 'Click the "..." ellipsis next to the Bookmark and UNCHECK "Data". Keep "Display" checked so visual visibility toggles without touching filter/slicer selections.',
  },
  {
    id: 'fc-16',
    domain: 'visualize',
    category: 'Visual Selection',
    front: 'Distinguish Ribbon Chart vs. Waterfall Chart vs. Funnel Chart.',
    back: 'Ribbon = Rank changes over time. Waterfall = Sequential positive/negative contributions to a total. Funnel = Linear stage conversion & drop-off %.',
  },
  {
    id: 'fc-17',
    domain: 'visualize',
    category: 'AI Visuals',
    front: 'When should you pick Key Influencers vs. Decomposition Tree?',
    back: 'Key Influencers = statistical ranking of factors that drive a metric up/down + Top Segments. Decomposition Tree = interactive root-cause breakdown across dimensions in any order + AI High/Low splits.',
  },
  {
    id: 'fc-18',
    domain: 'visualize',
    category: 'Dashboards vs Reports',
    front: 'Where can Data Alerts be created in Power BI, and on which visual types?',
    back: 'Data Alerts can ONLY be configured on **Dashboard tiles** in the Power BI Service, and ONLY for **Card, KPI, and Gauge** visuals.',
    examTrap: 'You CANNOT create Data Alerts directly inside a Power BI Report page.',
  },
  {
    id: 'fc-19',
    domain: 'visualize',
    category: 'Accessibility',
    front: 'Which Selection Pane setting controls keyboard navigation order?',
    back: 'Tab Order (next to Layer Order in the Selection Pane), paired with descriptive static or DAX-driven Alt Text on every visual.',
  },
  {
    id: 'fc-20',
    domain: 'manage',
    category: 'Row-Level Security',
    front: 'Which workspace roles bypass Row-Level Security (RLS), and which enforces it?',
    back: 'Admin, Member, and Contributor ALL bypass RLS! ONLY the **Viewer** role (and Workspace App users without workspace Edit/Build permissions) is restricted by RLS.',
  },
  {
    id: 'fc-21',
    domain: 'manage',
    category: 'Dynamic RLS',
    front: 'Which DAX function should you use in Dynamic RLS filters, and how do multiple RLS roles combine?',
    back: 'Use USERPRINCIPALNAME() (returns UPN email consistently in Power BI Service). If a user belongs to multiple RLS roles, permissions combine as a UNION (OR), NOT an intersection.',
  },
  {
    id: 'fc-22',
    domain: 'manage',
    category: 'Incremental Refresh',
    front: 'What are the exact parameter rules for Incremental Refresh?',
    back: 'Two parameters named exactly `RangeStart` and `RangeEnd` (case-sensitive), typed as `Date/Time`, filtering the date column with `>= RangeStart and < RangeEnd` while preserving Query Folding.',
  },
  {
    id: 'fc-23',
    domain: 'manage',
    category: 'Gateways & Refresh',
    front: 'What are the daily scheduled refresh limits for Pro vs. Premium/PPU, and when is Standard Gateway required?',
    back: 'Pro = max 8 scheduled refreshes/day. Premium / PPU = max 48 scheduled refreshes/day. Standard On-Premises Data Gateway is required for DirectQuery, Live Connections, and shared multi-user enterprise connections.',
  },
  {
    id: 'fc-24',
    domain: 'manage',
    category: 'Governance & Endorsement',
    front: 'Compare Promoted vs. Certified datasets and OLS vs. RLS.',
    back: 'Promoted = creator self-endorsement; Certified = approved by authorized CoE reviewers. RLS hides ROWS; Object-Level Security (OLS) hides entire TABLES or COLUMNS.',
  },
];

// correctOption is matched by value, so options can be shuffled freely.
export const MATRIX_DRILLS: MatrixDrill[] = RAW_MATRIX_DRILLS.map((d) => ({
  ...d,
  options: shuffle(d.options),
}));
