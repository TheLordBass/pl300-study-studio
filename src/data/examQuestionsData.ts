import {
  CaseStudy,
  DaxChallenge,
  MCQQuestion,
  PowerQueryChallenge,
} from '../types/pl300';

export const MCQ_QUESTIONS: MCQQuestion[] = [
  // PREPARE (5)
  {
    id: 'mcq-p1',
    domain: 'prepare',
    topic: 'Column Profiling',
    difficulty: 'Exam Trap',
    scenario:
      'You import a 500,000-row Sales CSV into Power Query Editor. You enable Column Distribution and Column Profile on the CustomerID column and notice Distinct: 420 and Unique: 0. However, you know there are over 12,000 customers in the database.',
    question: 'Why does Column Profile show only 420 distinct values, and what should you change?',
    options: [
      'Column Profile caches stale metadata; click Refresh Preview to load all 12,000 customers.',
      'By default, Power Query profiles only the top 1,000 rows; switch the bottom-left status bar to "Column profiling based on entire data set".',
      'CustomerID has a Text data type instead of Whole Number; change the data type first.',
      'Enable "Column quality" in the View tab to reveal hidden distinct values.',
    ],
    correctIndices: [1],
    explanation:
      'Power Query Editor defaults to "Column profiling based on top 1000 rows" for responsiveness. Switching the bottom-left status bar setting to "Column profiling based on entire data set" forces profiling across all 500,000 rows.',
    examTip:
      'Any PL-300 question mentioning unexpected Distinct/Min/Max counts on >1,000 rows in Power Query is testing the Top 1,000 rows profiling default.',
  },
  {
    id: 'mcq-p2',
    domain: 'prepare',
    topic: 'Merge Joins',
    difficulty: 'Tricky',
    scenario:
      'You have a FactSales query and a DimProduct query in Power Query. Before loading to the model, you need a separate audit query that lists ONLY the ProductIDs appearing in FactSales that do NOT exist in DimProduct.',
    question: 'Which Merge Queries join kind should you select?',
    options: [
      'Left Outer Join (FactSales as left, DimProduct as right)',
      'Inner Join (FactSales as left, DimProduct as right)',
      'Left Anti Join (FactSales as left, DimProduct as right)',
      'Right Anti Join (FactSales as left, DimProduct as right)',
    ],
    correctIndices: [2],
    explanation:
      'A Left Anti Join returns ONLY rows from the first (left) table that do not have a matching row in the second (right) table — the classic Power BI pattern for detecting orphan fact keys.',
    examTip:
      'Left Anti = only unmatched rows in Left table. Right Anti = only unmatched rows in Right table.',
  },
  {
    id: 'mcq-p3',
    domain: 'prepare',
    topic: 'Query Folding',
    difficulty: 'Exam Trap',
    scenario:
      'You connect to an Azure SQL Database table with 40 million rows. You need to: (1) Filter to the last 2 years of orders, (2) Add an Index column starting from 1, and (3) Rename three columns.',
    question: 'Which step sequence minimizes data transfer and maximizes Query Folding?',
    options: [
      'Add Index Column -> Filter Rows -> Rename Columns',
      'Rename Columns -> Add Index Column -> Filter Rows',
      'Filter Rows -> Rename Columns -> Add Index Column',
      'Disable "Enable load" -> Add Index Column -> Filter Rows',
    ],
    correctIndices: [2],
    explanation:
      'Table.AddIndexColumn generally breaks query folding (or forces local evaluation before later steps fold poorly). Placing Filter Rows and Rename Columns first allows Azure SQL to filter the 40M rows down on the server before the Index column is computed locally.',
    examTip:
      'Always filter rows and select/rename columns FIRST before adding index columns or custom non-folding M steps. Check "View Native Query" on each step.',
  },
  {
    id: 'mcq-p4',
    domain: 'prepare',
    topic: 'Storage Modes',
    difficulty: 'Tricky',
    scenario:
      'Your Power BI report connects to a 2-billion-row FactTelemetry table in Azure Synapse using DirectQuery. You also have a 5,000-row DimDevice table. Report slicers built on DimDevice feel sluggish and generate excessive SQL queries.',
    question: 'What storage mode should you set on DimDevice to optimize slicer performance while keeping FactTelemetry in DirectQuery?',
    options: [
      'Import mode on DimDevice',
      'Dual mode on DimDevice',
      'DirectQuery mode on DimDevice',
      'Switch FactTelemetry to Import mode',
    ],
    correctIndices: [1],
    explanation:
      'Setting DimDevice to Dual mode tells Power BI to cache DimDevice in memory (serving slicers instantaneously like Import) while also allowing it to act as DirectQuery when joined to FactTelemetry on the same source, preventing slow cross-source queries.',
    examTip:
      'Dimension tables shared by both Import and DirectQuery fact tables (or slicing DirectQuery facts) belong in DUAL storage mode.',
  },
  {
    id: 'mcq-p5',
    domain: 'prepare',
    topic: 'Staging Queries',
    difficulty: 'Core',
    scenario:
      'You combine four raw Excel staging queries (Q1, Q2, Q3, Q4) into one FinalSales table using Append Queries. You want FinalSales to refresh on schedule, while avoiding loading duplicate Q1–Q4 tables into the data model.',
    question: 'What should you configure on the Q1–Q4 staging queries in Power Query?',
    options: [
      'Uncheck both "Enable load" and "Include in report refresh"',
      'Uncheck "Enable load" and keep "Include in report refresh" checked',
      'Keep "Enable load" checked and hide the tables in Report View',
      'Delete Q1–Q4 after appending them to FinalSales',
    ],
    correctIndices: [1],
    explanation:
      'Disabling "Enable load" keeps the intermediate staging queries out of the VertiPaq semantic model (saving RAM and avoiding clutter), while keeping "Include in report refresh" checked ensures Q1–Q4 still pull fresh Excel rows whenever FinalSales refreshes.',
    examTip:
      'For helper/staging queries referenced by downstream queries: Enable load = OFF, Include in report refresh = ON.',
  },

  // MODEL (6)
  {
    id: 'mcq-m1',
    domain: 'model',
    topic: 'DAX Context & Iterators',
    difficulty: 'Exam Trap',
    scenario:
      'Your Sales table contains [Quantity] and [UnitDiscountedPrice] columns for each order line. A junior analyst creates the measure: Total Revenue = SUM(Sales[Quantity]) * SUM(Sales[UnitDiscountedPrice]). Users report wildly inflated revenue totals.',
    question: 'Why is the measure wrong, and what DAX expression fixes it?',
    options: [
      'SUM multiplies across different filter contexts; replace with CALCULATE(SUM(Sales[Quantity]) * SUM(Sales[UnitDiscountedPrice])).',
      'Multiplying two SUMs multiplies aggregate totals rather than line-by-line values; replace with SUMX(Sales, Sales[Quantity] * Sales[UnitDiscountedPrice]).',
      'Measures cannot multiply two numeric columns; create a Measure using RELATED() instead.',
      'Wrap the expression in DIVIDE() to normalize row granularity.',
    ],
    correctIndices: [1],
    explanation:
      'SUM(A) * SUM(B) computes (Total Qty) * (Total Price), which grows quadratically. An iterator like SUMX evaluates [Quantity] * [UnitDiscountedPrice] row-by-row over Sales and then sums the line results without storing a calculated column in RAM.',
    examTip:
      'Never multiply SUM(ColA) * SUM(ColB) inside a measure — use SUMX(Table, Table[ColA] * Table[ColB]).',
  },
  {
    id: 'mcq-m2',
    domain: 'model',
    topic: 'Role-Playing Dimensions',
    difficulty: 'Core',
    scenario:
      'Your FactOrders table has OrderDateKey and ShipDateKey, both linked to DimDate[DateKey]. The relationship on OrderDateKey is Active, and the relationship on ShipDateKey is Inactive. You need a [Shipped Sales] measure that filters by ShipDate.',
    question: 'Which approach follows Power BI Star Schema best practice without duplicating DimDate?',
    options: [
      'Set both relationships to Active simultaneously.',
      'Use CALCULATE([Total Sales], USERELATIONSHIP(FactOrders[ShipDateKey], DimDate[DateKey])).',
      'Enable bi-directional cross-filtering on the inactive relationship.',
      'Use RELATED(DimDate[DateKey]) inside a SUMX measure.',
    ],
    correctIndices: [1],
    explanation:
      'Only one active relationship can exist between two tables. USERELATIONSHIP inside CALCULATE temporarily activates the specified inactive relationship for the duration of that measure evaluation.',
    examTip:
      'USERELATIONSHIP() only works inside CALCULATE/CALCULATETABLE and requires an existing inactive relationship line.',
  },
  {
    id: 'mcq-m3',
    domain: 'model',
    topic: 'Filter Modifiers (KEEPFILTERS)',
    difficulty: 'Exam Trap',
    scenario:
      'You write: Red Sales = CALCULATE([Total Sales], DimProduct[Color] = "Red"). You place DimProduct[Color] on a page slicer and select "Blue". In a table visual showing [Red Sales] by Category, numbers still appear instead of blank.',
    question: 'Why does [Red Sales] still show sales when "Blue" is selected in the slicer, and how do you make it respect the user slicer?',
    options: [
      'A bare column predicate inside CALCULATE overwrites existing filters on DimProduct[Color]; wrap it in KEEPFILTERS(DimProduct[Color] = "Red").',
      'Use ALL(DimProduct[Color]) inside CALCULATE instead.',
      'Change the relationship between DimProduct and FactSales to Bi-directional.',
      'Wrap the expression in ALLEXCEPT(DimProduct, DimProduct[Color]).',
    ],
    correctIndices: [0],
    explanation:
      'CALCULATE([Total Sales], DimProduct[Color] = "Red") replaces any filter on DimProduct[Color] with "Red". Wrapping the filter in KEEPFILTERS() intersects the filter with the user slicer ("Blue" AND "Red" = empty), returning BLANK when Blue is chosen.',
    examTip:
      'CALCULATE filter arguments OVERWRITE filters on the same column unless wrapped in KEEPFILTERS().',
  },
  {
    id: 'mcq-m4',
    domain: 'model',
    topic: 'Date Tables & Auto Date/Time',
    difficulty: 'Core',
    scenario:
      'Your PBIX file has 12 tables with a combined 18 date columns and has grown unexpectedly large. Inspection with DAX Studio / Model view shows numerous hidden tables named LocalDateTable_... consuming memory.',
    question: 'What setting should you disable and what modeling pattern should you adopt to shrink the model and preserve Time Intelligence?',
    options: [
      'Disable "Auto date/time" in Options and create a single dedicated Date dimension table marked as Date Table.',
      'Delete all date columns from the fact tables.',
      'Convert all date columns to Text data type.',
      'Switch all tables from Import mode to DirectQuery.',
    ],
    correctIndices: [0],
    explanation:
      'Power BI\'s "Auto date/time" generates a separate hidden calendar table for every date column in the model. Disabling it and creating one shared Date table marked via "Mark as date table" saves significant RAM and avoids broken time intelligence hierarchies.',
    examTip:
      'LocalDateTable bloat = disable "Auto date/time" and use a single shared Date table marked as Date Table.',
  },
  {
    id: 'mcq-m5',
    domain: 'model',
    topic: 'VertiPaq Optimization',
    difficulty: 'Tricky',
    scenario:
      'A 30-million-row FactEvents table includes an EventTimestamp column formatted as Date/Time with millisecond precision (e.g., 2026-04-12 14:22:09.417). You only analyze events by Date and Hour, yet the model exceeds the 1 GB Pro dataset limit.',
    question: 'Which transformation yields the biggest reduction in VertiPaq memory consumption?',
    options: [
      'Format EventTimestamp as "Short Date" in the Power BI Model View Formatting pane.',
      'Split EventTimestamp into a Date column and a separate Hour (integer) column in Power Query, and remove the original high-cardinality Date/Time column.',
      'Create a calculated column in DAX using FORMAT([EventTimestamp], "yyyy-MM-dd HH").',
      'Enable bi-directional filtering on DimDate.',
    ],
    correctIndices: [1],
    explanation:
      'Formatting in Model View only changes visual display, not the underlying millisecond values stored in VertiPaq. Splitting into separate low-cardinality Date (~1,000 unique values) and Hour (24 unique values) columns in Power Query drastically increases dictionary compression and cuts RAM usage.',
    examTip:
      'High-cardinality columns (timestamps with seconds/ms, floating-point IDs, GUIDs) kill VertiPaq compression. Split or remove them in Power Query!',
  },
  {
    id: 'mcq-m6',
    domain: 'model',
    topic: 'Calculated Column vs Measure',
    difficulty: 'Core',
    scenario:
      'You want to group customers into "High", "Medium", and "Low" tiers based on their static CreditScore column so users can place that tier field into a Slicer on the report canvas.',
    question: 'Should you create a Calculated Column or a Measure, and why?',
    options: [
      'A Measure, because measures execute faster on slicers.',
      'A Calculated Column (or Power Query conditional column), because measures cannot be placed on slicers, rows, or axes as categorical buckets.',
      'A Measure wrapped in SUMX(), because slicers require row context.',
      'A Calculated Table containing only CreditScore.',
    ],
    correctIndices: [1],
    explanation:
      'Measures only return scalar results inside visual value wells and CANNOT be dropped into Slicers, Axis, or Legend fields. Static row-level categorization used for slicing/grouping belongs in a Calculated Column (or better yet, Power Query conditional column).',
    examTip:
      'Need to slice/group by it on an Axis, Legend, or Slicer? Column! Need dynamic aggregation responding to user filters? Measure!',
  },

  // VISUALIZE (5)
  {
    id: 'mcq-v1',
    domain: 'visualize',
    topic: 'Bookmarks & Slicer State',
    difficulty: 'Exam Trap',
    scenario:
      'You build two bookmarks ("Revenue View" and "Units View") to toggle between two overlapping charts using buttons and the Selection Pane. Beta testers complain that clicking "Units View" resets their Year and Region slicers back to the state saved when the bookmark was created.',
    question: 'Which Bookmark configuration change fixes this behavior?',
    options: [
      'Turn OFF the "Display" property on both bookmarks.',
      'Turn OFF the "Data" property on both bookmarks (and optionally use "Selected visuals" scoped only to the charts).',
      'Turn OFF the "Current page" property on both bookmarks.',
      'Enable "Sync slicers" across every page in the report.',
    ],
    correctIndices: [1],
    explanation:
      'The Bookmark "Data" property captures filter, slicer, and sort states. Turning OFF "Data" ensures bookmarks only toggle visual visibility ("Display") while preserving whatever slicers the user currently selected.',
    examTip:
      'Bookmarks overwriting slicers = uncheck "Data"! Bookmarks navigating away from current page unexpectedly = uncheck "Current page".',
  },
  {
    id: 'mcq-v2',
    domain: 'visualize',
    topic: 'Visual Selection',
    difficulty: 'Core',
    scenario:
      'The VP of Sales wants a single visual that shows how product categories changed their sales RANK position relative to each other across Q1, Q2, Q3, and Q4.',
    question: 'Which native Power BI visual is purpose-built to highlight rank changes over time?',
    options: [
      'Stacked Area Chart',
      'Ribbon Chart',
      'Waterfall Chart',
      'Funnel Chart',
    ],
    correctIndices: [1],
    explanation:
      'A Ribbon Chart stacks categories by rank in each time period (highest rank at the top) and connects them with ribbons so rank swaps jump off the page visually.',
    examTip:
      'Rank changes over time = Ribbon Chart. Positive/negative sequential bridges = Waterfall Chart. Stage conversion drop-off = Funnel Chart.',
  },
  {
    id: 'mcq-v3',
    domain: 'visualize',
    topic: 'AI Visuals',
    difficulty: 'Tricky',
    scenario:
      'Customer Support leaders ask why Customer Churn Rate spiked to 18% last month. They want an interactive visual that lets them choose which order to split Churn across Region, PlanTier, and Tenure — OR automatically find the highest driver split on demand.',
    question: 'Which visual satisfies this ad-hoc root-cause exploration requirement?',
    options: [
      'Key Influencers visual',
      'Decomposition Tree visual',
      'Q&A visual',
      'Smart Narrative visual',
    ],
    correctIndices: [1],
    explanation:
      'The Decomposition Tree lets users drill down into a metric across multiple dimensions in any order and supports AI Splits ("High value" / "Low value") to find the next strongest contributor path automatically.',
    examTip:
      'Root-cause hierarchical breakdown in any order + AI splits = Decomposition Tree. Statistical ranking of what increases/decreases a metric = Key Influencers.',
  },
  {
    id: 'mcq-v4',
    domain: 'visualize',
    topic: 'Data Alerts & Dashboards',
    difficulty: 'Exam Trap',
    scenario:
      'An operations director wants Power BI to send her an email notification whenever Daily Defect Rate rises above 2.5%. She is looking at a Card visual inside a published multi-page Power BI Report.',
    question: 'What must be done so she can configure a Data Alert?',
    options: [
      'Enable "Data Alerts" in the Card visual formatting pane in Power BI Desktop.',
      'Pin the Card visual to a Power BI Service Dashboard and create the alert on the Dashboard tile.',
      'Convert the Card visual into a Table visual and set a Page-level filter.',
      'Configure an Incremental Refresh alert in Semantic Model settings.',
    ],
    correctIndices: [1],
    explanation:
      'Data Alerts can ONLY be configured on Dashboard tiles (specifically Card, KPI, and Gauge visuals) in the Power BI Service — not directly inside Reports.',
    examTip:
      'Data Alerts = Power BI Service Dashboard tiles ONLY (Cards, KPIs, Gauges).',
  },
  {
    id: 'mcq-v5',
    domain: 'visualize',
    topic: 'Accessibility',
    difficulty: 'Core',
    scenario:
      'Your organization requires all executive Power BI reports to meet internal screen-reader and keyboard-only accessibility standards.',
    question: 'Which two configurations in Power BI Desktop are essential for screen readers and keyboard navigation?',
    options: [
      'Enable "Auto-size" and set Page View to "Fit to width".',
      'Populate Alt Text on visuals (static or DAX measure) and configure logical Tab Order in the Selection Pane.',
      'Disable all visual headers and set theme font size to 8pt.',
      'Use only Custom Visuals downloaded from AppSource.',
    ],
    correctIndices: [1],
    explanation:
      'Screen readers announce visual Alt Text (including dynamic DAX-driven Alt Text), and keyboard users rely on the Selection Pane\'s Tab Order (distinct from Layer Order) to cycle cleanly through slicers and charts.',
    examTip:
      'Selection Pane has two modes: Layer Order (visual stacking) and Tab Order (keyboard navigation sequence).',
  },

  // MANAGE (4)
  {
    id: 'mcq-g1',
    domain: 'manage',
    topic: 'Row-Level Security & Workspace Roles',
    difficulty: 'Exam Trap',
    scenario:
      'You implement Dynamic Row-Level Security using `[SalesRepEmail] = USERPRINCIPALNAME()`, publish the dataset to a workspace, assign all regional managers to the RLS role in Power BI Service, and add them to the workspace with the **Contributor** role so they can see reports. During testing, managers can still see EVERY region\'s sales!',
    question: 'Why are regional managers bypassing RLS, and what is the correct fix?',
    options: [
      'USERPRINCIPALNAME() only works in Power BI Desktop; change it to USERNAME().',
      'Contributor role users have edit permissions in the workspace and therefore BYPASS RLS; change their workspace role to Viewer (or distribute via a Workspace App).',
      'Dynamic RLS requires a Standard On-Premises Data Gateway to enforce filters.',
      'You must also enable Object-Level Security (OLS) on the Sales table.',
    ],
    correctIndices: [1],
    explanation:
      'RLS ONLY restricts users with the **Viewer** role in a workspace (or App users without underlying workspace Edit/Build permissions). Admin, Member, and Contributor roles all bypass RLS automatically.',
    examTip:
      'Admin, Member, Contributor = BYPASS RLS. ONLY **Viewer** enforces RLS!',
  },
  {
    id: 'mcq-g2',
    domain: 'manage',
    topic: 'Workspace Roles & Least Privilege',
    difficulty: 'Tricky',
    scenario:
      'A contractor needs to publish new PBIX reports into a shared Analytics workspace and schedule refreshes on datasets they own, but must NOT be allowed to add/remove workspace users or publish/delete the workspace App.',
    question: 'Which minimum workspace role meets all requirements under the principle of least privilege?',
    options: [
      'Viewer',
      'Contributor',
      'Member',
      'Admin',
    ],
    correctIndices: [1],
    explanation:
      'Contributor can publish, edit, and delete content and schedule refreshes within the workspace, while being blocked from adding workspace members or publishing the Workspace App by default.',
    examTip:
      'Can publish/edit reports WITHOUT managing workspace access? Contributor. Needs to add users or publish Apps? Member.',
  },
  {
    id: 'mcq-g3',
    domain: 'manage',
    topic: 'Incremental Refresh',
    difficulty: 'Exam Trap',
    scenario:
      'You are setting up Incremental Refresh on a 100M-row Orders table in Power BI Desktop before publishing to a Pro workspace.',
    question: 'Which Power Query parameter configuration is mandatory for Incremental Refresh to work?',
    options: [
      'Create two Text parameters named StartDate and EndDate and filter using `>= StartDate and <= EndDate`.',
      'Create two Date/Time parameters named exactly `RangeStart` and `RangeEnd` (case-sensitive) and filter the date column using `>= RangeStart` and `< RangeEnd`.',
      'Create a single Range parameter of type Whole Number.',
      'Enable Auto Date/Time and filter using Date.IsInCurrentYear().',
    ],
    correctIndices: [1],
    explanation:
      'Power BI looks specifically for case-sensitive `RangeStart` and `RangeEnd` parameters of type **Date/Time**. One boundary must be inclusive (`>=` or `>`) and the other exclusive (`<` or `<=`) so boundary timestamps aren\'t duplicated across partitions.',
    examTip:
      'Incremental Refresh checklist: exact names `RangeStart` + `RangeEnd`, type `Date/Time`, one inclusive + one exclusive boundary, and Query Folding preserved.',
  },
  {
    id: 'mcq-g4',
    domain: 'manage',
    topic: 'Data Gateways',
    difficulty: 'Core',
    scenario:
      'Your enterprise report uses DirectQuery against an on-premises SQL Server and needs 15 analysts to configure shared dataset connections and scheduled refreshes centrally.',
    question: 'Which gateway mode must you install?',
    options: [
      'On-premises data gateway (Personal mode)',
      'On-premises data gateway (Standard mode)',
      'Power BI Desktop Gateway connector',
      'No gateway is required for on-premises SQL Server DirectQuery.',
    ],
    correctIndices: [1],
    explanation:
      'Standard mode supports multiple users, centralized credential management, DirectQuery, Live Connections, and Scheduled Refresh. Personal mode only supports Import scheduled refresh for a single user.',
    examTip:
      'DirectQuery or multiple team members on-prem = Standard Gateway. Solo Import refresh on a laptop = Personal Gateway.',
  },
];

export const DAX_CHALLENGES: DaxChallenge[] = [
  {
    id: 'dax-1',
    title: 'Year-to-Date (YTD) Sales',
    domain: 'model',
    difficulty: 'Core',
    businessScenario:
      'Create a measure [YTD Sales] that accumulates [Total Sales] from January 1 up to the current filter date using the dedicated Date table.',
    schemaContext: "Measures: [Total Sales] | Table: 'Date'[Date] (marked as Date Table)",
    templateParts: ['YTD Sales = ', '__SLOT_0__', '([Total Sales], ', '__SLOT_1__', "('Date'[Date]))"],
    correctSlots: ['CALCULATE', 'DATESYTD'],
    tokenPool: ['CALCULATE', 'SUMX', 'DATESYTD', 'SAMEPERIODLASTYEAR', 'ALL', 'VALUES'],
    explanation:
      "CALCULATE modifies the filter context of [Total Sales] by applying the table of dates from Jan 1 through the max visible date returned by DATESYTD('Date'[Date]). (TOTALYTD([Total Sales], 'Date'[Date]) is syntax sugar for this exact pattern.)",
    contextTrap:
      'Watch out for SAMEPERIODLASTYEAR vs DATESYTD — SAMEPERIODLASTYEAR shifts the window back 1 year rather than accumulating from Jan 1.',
  },
  {
    id: 'dax-2',
    title: 'Prior Year (PY) Sales Comparison',
    domain: 'model',
    difficulty: 'Core',
    businessScenario:
      'Create a measure [PY Sales] returning [Total Sales] for the exact equivalent calendar period one year earlier so you can compute YoY growth.',
    schemaContext: "Measures: [Total Sales] | Table: 'Date'[Date] (contiguous marked Date Table)",
    templateParts: ['PY Sales = ', '__SLOT_0__', '([Total Sales], ', '__SLOT_1__', "('Date'[Date]))"],
    correctSlots: ['CALCULATE', 'SAMEPERIODLASTYEAR'],
    tokenPool: ['CALCULATE', 'FILTER', 'SAMEPERIODLASTYEAR', 'DATESYTD', 'PREVIOUSYEAR', 'USERELATIONSHIP'],
    explanation:
      "SAMEPERIODLASTYEAR('Date'[Date]) shifts every selected date in the current filter context back by one year (e.g., Q2 2026 -> Q2 2025, or March 2026 -> March 2025). Unlike PREVIOUSYEAR, it preserves month/quarter granularity!",
    contextTrap:
      'PREVIOUSYEAR returns the ENTIRE previous year regardless of whether you are viewing a month or quarter; SAMEPERIODLASTYEAR matches the current visual granularity.',
  },
  {
    id: 'dax-3',
    title: '% of All Products (Ignore Category Slicer)',
    domain: 'model',
    difficulty: 'Tricky',
    businessScenario:
      'Build [% of All Categories] so each Product Category row in a matrix divides its own [Total Sales] by grand-total sales across ALL categories, even when a Category slicer is active.',
    schemaContext: 'Measures: [Total Sales] | Table: Product[Category]',
    templateParts: [
      '% of All Categories = ',
      '__SLOT_0__',
      '([Total Sales], ',
      '__SLOT_1__',
      '([Total Sales], ',
      '__SLOT_2__',
      '(Product[Category])))',
    ],
    correctSlots: ['DIVIDE', 'CALCULATE', 'ALL'],
    tokenPool: ['DIVIDE', 'CALCULATE', 'SUMX', 'ALL', 'ALLSELECTED', 'KEEPFILTERS'],
    explanation:
      'DIVIDE handles divide-by-zero safely (returning BLANK instead of Infinity). In the denominator, CALCULATE(..., ALL(Product[Category])) removes any filter on Product[Category] (both visual row filters and external Category slicers).',
    contextTrap:
      'If the requirement had asked to respect external slicers while ignoring only the current visual rows, you would use ALLSELECTED() instead of ALL().',
  },
  {
    id: 'dax-4',
    title: 'Activate Inactive Ship Date Relationship',
    domain: 'model',
    difficulty: 'Core',
    businessScenario:
      "Sales[OrderDate] has the active relationship to 'Date'[Date]. Sales[ShipDate] has an INACTIVE relationship. Compute sales grouped by ShipDate.",
    schemaContext: "Measure: [Total Sales] | Inactive relationship: Sales[ShipDate] -> 'Date'[Date]",
    templateParts: [
      'Shipped Sales = ',
      '__SLOT_0__',
      '([Total Sales], ',
      '__SLOT_1__',
      "(Sales[ShipDate], 'Date'[Date]))",
    ],
    correctSlots: ['CALCULATE', 'USERELATIONSHIP'],
    tokenPool: ['CALCULATE', 'SUMX', 'USERELATIONSHIP', 'CROSSFILTER', 'RELATED', 'RELATEDTABLE'],
    explanation:
      'USERELATIONSHIP tells CALCULATE to temporarily enable the inactive relationship between Sales[ShipDate] and Date[Date] while deactivating the conflicting OrderDate relationship for this measure.',
    contextTrap:
      'CROSSFILTER changes cross-filter direction (Single/Both/None) whereas USERELATIONSHIP activates an inactive relationship.',
  },
  {
    id: 'dax-5',
    title: 'Row-by-Row Revenue Across Related Dimension',
    domain: 'model',
    difficulty: 'Tricky',
    businessScenario:
      'The Sales fact table has [OrderQty], and the Product dimension table holds [UnitPrice]. Compute total extended sales dynamically in a measure without adding a calculated column.',
    schemaContext: 'Tables: Sales (many side) -> Product (one side) via ProductKey',
    templateParts: [
      'Extended Sales = ',
      '__SLOT_0__',
      '(Sales, Sales[OrderQty] * ',
      '__SLOT_1__',
      '(Product[UnitPrice]))',
    ],
    correctSlots: ['SUMX', 'RELATED'],
    tokenPool: ['SUMX', 'SUM', 'CALCULATE', 'RELATED', 'RELATEDTABLE', 'LOOKUPVALUE'],
    explanation:
      'SUMX iterates row-by-row over Sales (creating a row context). Because Product is on the "One" side of a 1:Many relationship, RELATED(Product[UnitPrice]) fetches the corresponding product price for each sales row.',
    contextTrap:
      'RELATED pulls from the One side to the Many side inside a row context; RELATEDTABLE pulls a table from the Many side to the One side.',
  },
  {
    id: 'dax-6',
    title: 'Intersect Filter with Existing Slicers',
    domain: 'model',
    difficulty: 'Exam Trap',
    businessScenario:
      'Calculate [High-Margin Sales] for orders where Product[MarginTier] = "High", ensuring that if a user slices Product[MarginTier] to "Low", the visual shows BLANK instead of overriding the slicer.',
    schemaContext: 'Measure: [Total Sales] | Column: Product[MarginTier]',
    templateParts: [
      'High-Margin Sales = ',
      '__SLOT_0__',
      '([Total Sales], ',
      '__SLOT_1__',
      '(Product[MarginTier] = "High"))',
    ],
    correctSlots: ['CALCULATE', 'KEEPFILTERS'],
    tokenPool: ['CALCULATE', 'KEEPFILTERS', 'ALL', 'ALLEXCEPT', 'FILTER', 'REMOVEFILTERS'],
    explanation:
      'Without KEEPFILTERS, Product[MarginTier] = "High" overwrites any external slicer on MarginTier. Wrapping it in KEEPFILTERS intersects ("Low" AND "High" = empty) so the slicer is honored.',
    contextTrap:
      'Whenever an exam scenario says "without overriding existing filters on that same column", think KEEPFILTERS!',
  },
  {
    id: 'dax-7',
    title: 'Dynamic Row-Level Security (RLS) Filter',
    domain: 'manage',
    difficulty: 'Core',
    businessScenario:
      'Write the DAX table filter expression on DimEmployee inside Manage Roles so signed-in Power BI Service users only see rows matching their corporate Microsoft Entra / Azure AD login email.',
    schemaContext: 'Table: DimEmployee[EmailAddress] | Power BI Service Authentication',
    templateParts: ['DimEmployee[EmailAddress] = ', '__SLOT_0__', '()'],
    correctSlots: ['USERPRINCIPALNAME'],
    tokenPool: ['USERPRINCIPALNAME', 'USERNAME', 'CURRENTUSER', 'CUSTOMDATA', 'LOOKUPVALUE'],
    explanation:
      'USERPRINCIPALNAME() consistently returns the user\'s UPN (email, e.g. alex@contoso.com) in the Power BI Service, making it the standard PL-300 function for Dynamic RLS.',
    contextTrap:
      'USERNAME() returns DOMAIN\\username locally in Desktop vs UPN in the Service; Microsoft Learn and PL-300 prefer USERPRINCIPALNAME().',
  },
  {
    id: 'dax-8',
    title: 'Dynamic Customer Ranking Respecting Slicers',
    domain: 'model',
    difficulty: 'Exam Trap',
    businessScenario:
      'Rank customers from 1..N by [Total Sales] inside a table visual. If the user filters the page to Region = "West", the ranking should recalculate 1..N among West customers only (not keep global ranks).',
    schemaContext: 'Measure: [Total Sales] | Visual column: Customer[CustomerName]',
    templateParts: [
      'Customer Rank = ',
      '__SLOT_0__',
      '(',
      '__SLOT_1__',
      '(Customer[CustomerName]), [Total Sales], , ',
      '__SLOT_2__',
      ')',
    ],
    correctSlots: ['RANKX', 'ALLSELECTED', 'DESC'],
    tokenPool: ['RANKX', 'ALL', 'ALLSELECTED', 'VALUES', 'DESC', 'ASC'],
    explanation:
      'ALLSELECTED(Customer[CustomerName]) clears the current row filter of each customer in the table while keeping external Region slicers intact. DESC ranks the highest sales as #1.',
    contextTrap:
      'Using ALL(Customer) would rank against ALL global customers (making West #1 appear as e.g. #4). Use ALLSELECTED for slicer-aware visual rankings!',
  },
];

export const POWER_QUERY_CHALLENGES: PowerQueryChallenge[] = [
  {
    id: 'pq-1',
    title: 'Unpivot Wide Monthly Budget into Star Schema Fact Table',
    difficulty: 'Core',
    scenario:
      'Finance sent a wide Excel workbook where the first two rows contain a report title and blank spacer, headers are in row 3, and every month (Jan, Feb, Mar...) is its own column. Prepare a clean tall FactBudget table.',
    messyTablePreview: {
      headers: ['Column1', 'Column2', 'Column3', 'Column4'],
      rows: [
        ['2026 Budget Report', '', '', ''],
        ['Department', 'Jan', 'Feb', 'Mar'],
        ['Marketing', '12000', '14500', '15000'],
        ['Sales', '28000', '29000', '31000'],
      ],
    },
    cleanTablePreview: {
      headers: ['Department', 'Month', 'BudgetAmount'],
      rows: [
        ['Marketing', 'Jan', '12000'],
        ['Marketing', 'Feb', '14500'],
        ['Sales', 'Jan', '28000'],
      ],
    },
    availableSteps: [
      {
        id: 'pq1-remove-top',
        label: 'Remove Top Rows (1)',
        detail: 'Drops the "2026 Budget Report" title banner row',
        foldsQuery: true,
      },
      {
        id: 'pq1-promote',
        label: 'Use First Row as Headers',
        detail: 'Promotes Department, Jan, Feb, Mar into column names',
        foldsQuery: true,
      },
      {
        id: 'pq1-unpivot',
        label: 'Unpivot Other Columns (select Department)',
        detail: 'Converts Jan, Feb, Mar columns into Attribute & Value rows',
        foldsQuery: true,
      },
      {
        id: 'pq1-rename-type',
        label: 'Rename Columns & Set Data Type (Currency)',
        detail: 'Renames Attribute/Value -> Month/BudgetAmount and types as Decimal/Currency',
        foldsQuery: true,
      },
    ],
    correctStepOrder: ['pq1-remove-top', 'pq1-promote', 'pq1-unpivot', 'pq1-rename-type'],
    explanation:
      'You must strip junk banner rows BEFORE promoting headers, promote headers BEFORE unpivoting (so months become column labels -> Attribute values), and select "Unpivot Other Columns" on Department so future Apr–Dec columns unpivot automatically.',
    queryFoldingNote:
      'Unpivot Other Columns is future-proof! Even if Excel adds Apr–Dec next quarter, selecting Department -> Unpivot Other Columns keeps working without editing M code.',
  },
  {
    id: 'pq-2',
    title: 'Preserve Query Folding on a 50M-Row SQL Table',
    difficulty: 'Exam Trap',
    scenario:
      'You connect to SQL Server FactTransactions (50M rows). You need only Status = "Completed" rows from 2025+, clean column names, and a sequential RowID index column. Order the steps so SQL Server filters the 50M rows instead of Power BI Desktop.',
    messyTablePreview: {
      headers: ['trx_id', 'trx_dt', 'status_cd', 'amt', 'internal_notes'],
      rows: [
        ['901', '2022-01-04', 'Pending', '45.00', 'legacy'],
        ['902', '2025-05-11', 'Completed', '120.50', 'ok'],
      ],
    },
    cleanTablePreview: {
      headers: ['RowID', 'TransactionDate', 'Amount'],
      rows: [
        ['1', '2025-05-11', '120.50'],
      ],
    },
    availableSteps: [
      {
        id: 'pq2-filter',
        label: 'Filter Rows (Status = Completed & Date >= 2025)',
        detail: 'Generates SQL WHERE clause reducing 50M rows at source',
        foldsQuery: true,
      },
      {
        id: 'pq2-remove-cols',
        label: 'Remove Other Columns & Rename',
        detail: 'Generates SQL SELECT with only needed columns and aliases',
        foldsQuery: true,
      },
      {
        id: 'pq2-index',
        label: 'Add Index Column (From 1)',
        detail: 'Breaks query folding — forces remaining steps to run locally in Power BI',
        foldsQuery: false,
      },
    ],
    correctStepOrder: ['pq2-filter', 'pq2-remove-cols', 'pq2-index'],
    explanation:
      'Filter Rows and Remove/Rename Columns fold cleanly into SQL WHERE and SELECT statements. Adding an Index Column breaks query folding and therefore MUST come LAST so only the filtered subset is pulled across the network.',
    queryFoldingNote:
      'Rule of thumb: Native-folding steps (Filter, Choose Columns, Rename, Group By, Merge same source) ALWAYS go BEFORE non-folding steps (Add Index, Custom M functions, Split by delimiter in some sources).',
  },
  {
    id: 'pq-3',
    title: 'Configure Incremental Refresh Parameters & Filter',
    difficulty: 'Exam Trap',
    scenario:
      'Configure an Orders SQL table for Incremental Refresh so historical partitions stay frozen and only recent days refresh, with zero missing or duplicate rows at midnight boundaries.',
    messyTablePreview: {
      headers: ['OrderID', 'OrderDate', 'Amount'],
      rows: [
        ['1001', '2023-01-01 00:00:00', '500'],
        ['1002', '2026-11-15 23:59:59', '820'],
      ],
    },
    cleanTablePreview: {
      headers: ['OrderID', 'OrderDate (Folded Range)', 'Amount'],
      rows: [
        ['1002', '2026-11-15 23:59:59', '820'],
      ],
    },
    availableSteps: [
      {
        id: 'pq3-params',
        label: 'Create Date/Time Parameters: RangeStart & RangeEnd',
        detail: 'Exact case-sensitive names required by the Power BI Service',
        foldsQuery: true,
      },
      {
        id: 'pq3-filter',
        label: 'Filter OrderDate (>= RangeStart AND < RangeEnd)',
        detail: 'One inclusive and one exclusive bound prevents duplicate midnight rows',
        foldsQuery: true,
      },
      {
        id: 'pq3-verify',
        label: 'Verify "View Native Query" & Configure Policy in Desktop',
        detail: 'Confirms partition folding and sets Store/Refresh windows before publishing',
        foldsQuery: true,
      },
    ],
    correctStepOrder: ['pq3-params', 'pq3-filter', 'pq3-verify'],
    explanation:
      'First define RangeStart and RangeEnd as Date/Time parameters. Next filter the Date/Time column using >= RangeStart and < RangeEnd. Finally verify "View Native Query" is enabled before setting the Incremental Refresh policy on the table.',
    queryFoldingNote:
      'If OrderDate is a whole-number integer key (YYYYMMDD), write an integer conversion expression against RangeStart/RangeEnd that still folds back to SQL!',
  },
  {
    id: 'pq-4',
    title: 'Build a Clean Star-Schema Dimension from a Flat Fact Table',
    difficulty: 'Core',
    scenario:
      'Your source system gives you a single flat FactOrders table repeating CustomerName and CustomerCity on millions of rows. Extract a clean DimCustomer table without re-querying the database twice if possible or ensuring unique keys.',
    messyTablePreview: {
      headers: ['OrderID', 'CustID', 'CustName', 'City', 'Amount'],
      rows: [
        ['1', 'C01', 'alice smith ', 'Seattle', '100'],
        ['2', 'C01', 'Alice Smith', 'Seattle', '250'],
      ],
    },
    cleanTablePreview: {
      headers: ['CustID', 'CustName', 'City'],
      rows: [
        ['C01', 'Alice Smith', 'Seattle'],
      ],
    },
    availableSteps: [
      {
        id: 'pq4-ref',
        label: 'Reference Staging FactOrders Query',
        detail: 'Creates DimCustomer inheriting cleaned staging data without duplicating source setup',
        foldsQuery: true,
      },
      {
        id: 'pq4-cols',
        label: 'Choose Columns (CustID, CustName, City)',
        detail: 'Removes order-level columns like OrderID and Amount',
        foldsQuery: true,
      },
      {
        id: 'pq4-clean',
        label: 'Trim & Capitalize Each Word on CustName',
        detail: 'Standardizes "alice smith " and "Alice Smith" before deduplicating',
        foldsQuery: true,
      },
      {
        id: 'pq4-dedupe',
        label: 'Remove Duplicates on CustID',
        detail: 'Guarantees 1-side uniqueness so 1:Many relationship succeeds',
        foldsQuery: true,
      },
    ],
    correctStepOrder: ['pq4-ref', 'pq4-cols', 'pq4-clean', 'pq4-dedupe'],
    explanation:
      'Reference the base query, drop unnecessary fact columns, normalize casing/whitespace BEFORE deduplicating (otherwise "alice smith " and "Alice Smith" stay separate or pick random casing!), then Remove Duplicates on CustID to guarantee a 1:Many relationship.',
    queryFoldingNote:
      'Always Trim/Clean/Standardize text BEFORE Remove Duplicates — Power Query deduplication is case-sensitive!',
  },
  {
    id: 'pq-5',
    title: 'Consolidate Monthly Folder CSVs Cleanly',
    difficulty: 'Tricky',
    scenario:
      'A SharePoint/Local folder receives a new CSV every month (`2026_01.csv`, `2026_02.csv`). Combine them into one table and preserve the source filename so you can trace bad rows.',
    messyTablePreview: {
      headers: ['Content', 'Name', 'Extension', 'Folder Path'],
      rows: [
        ['[Binary]', '2026_01.csv', '.csv', 'C:\\Sales\\'],
        ['[Binary]', '2026_02.csv', '.csv', 'C:\\Sales\\'],
      ],
    },
    cleanTablePreview: {
      headers: ['Source.Name', 'OrderDate', 'Total'],
      rows: [
        ['2026_01.csv', '2026-01-15', '940'],
        ['2026_02.csv', '2026-02-08', '1120'],
      ],
    },
    availableSteps: [
      {
        id: 'pq5-filter-ext',
        label: 'Filter Extension = ".csv" (Exclude temp/archive files)',
        detail: 'Prevents non-CSV files or hidden lock files from crashing Combine Files',
        foldsQuery: false,
      },
      {
        id: 'pq5-combine',
        label: 'Click Combine Files on [Content] Column',
        detail: 'Auto-creates Helper Queries and appends all files keeping [Source.Name]',
        foldsQuery: false,
      },
      {
        id: 'pq5-types',
        label: 'Verify Data Types in Combined Output Query',
        detail: 'Ensures OrderDate and Total have strict types after combining',
        foldsQuery: false,
      },
    ],
    correctStepOrder: ['pq5-filter-ext', 'pq5-combine', 'pq5-types'],
    explanation:
      'Always filter the Folder file list (Extension = ".csv", skip hidden/temp files) BEFORE clicking Combine Files so stray Excel/README files do not break the sample-file helper query.',
    queryFoldingNote:
      'If every CSV inside the folder repeats its header row, Power Query\'s Combine Files helper automatically promotes the header in the Sample File step so headers aren\'t duplicated as data rows.',
  },
  {
    id: 'pq-6',
    title: 'Flatten Snowflake Product Subcategory into Star Schema',
    difficulty: 'Core',
    scenario:
      'Your database uses a normalized Snowflake design: Product -> ProductSubcategory -> ProductCategory. Flatten SubcategoryName and CategoryName directly onto DimProduct and avoid loading the intermediate tables.',
    messyTablePreview: {
      headers: ['ProductID', 'ProductName', 'SubcategoryID'],
      rows: [
        ['101', 'Road Bike 500', 'S1'],
        ['102', 'Helmet Pro', 'S2'],
      ],
    },
    cleanTablePreview: {
      headers: ['ProductID', 'ProductName', 'SubcategoryName', 'CategoryName'],
      rows: [
        ['101', 'Road Bike 500', 'Road Bikes', 'Bikes'],
        ['102', 'Helmet Pro', 'Helmets', 'Accessories'],
      ],
    },
    availableSteps: [
      {
        id: 'pq6-merge-sub',
        label: 'Merge DimProduct with Subcategory (Left Outer on SubcategoryID)',
        detail: 'Brings SubcategoryName & CategoryID into DimProduct',
        foldsQuery: true,
      },
      {
        id: 'pq6-expand-sub',
        label: 'Expand Subcategory Table (Select SubcategoryName & CategoryID)',
        detail: 'Materializes joined fields horizontally without prefix clutter',
        foldsQuery: true,
      },
      {
        id: 'pq6-merge-cat',
        label: 'Merge & Expand Category (on CategoryID -> CategoryName)',
        detail: 'Completes denormalization into a single flat DimProduct table',
        foldsQuery: true,
      },
      {
        id: 'pq6-disable-load',
        label: 'Uncheck "Enable load" on Subcategory & Category Queries',
        detail: 'Prevents redundant snowflake tables from entering the model',
        foldsQuery: true,
      },
    ],
    correctStepOrder: ['pq6-merge-sub', 'pq6-expand-sub', 'pq6-merge-cat', 'pq6-disable-load'],
    explanation:
      'Merging and expanding Subcategory then Category directly into DimProduct turns a 3-table snowflake chain into a single Star Schema dimension, eliminating extra relationship hops and memory overhead.',
    queryFoldingNote:
      'Keep "Include in report refresh" enabled on Subcategory & Category even after disabling "Enable load" so DimProduct receives updated category names on refresh.',
  },
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'cs-1',
    companyName: 'Contoso Omni-Channel Retail',
    industry: 'Global Retail & E-Commerce',
    summary:
      'Contoso is migrating fragmented Excel and SQL Server reports into an enterprise Power BI solution covering store sales, online orders, and regional sales targets.',
    exhibits: [
      {
        id: 'ex-overview',
        title: 'Business Overview',
        content: [
          'Contoso operates 420 retail stores across North America and Europe plus a fast-growing e-commerce storefront.',
          'Executive leadership wants a centralized Power BI Workspace App where regional directors only see stores in their assigned geographic territory.',
          'Finance requires Year-to-Date revenue and Shipped vs. Ordered comparisons across a single unified calendar.',
        ],
      },
      {
        id: 'ex-env',
        title: 'Existing Environment',
        content: [
          'FactOnlineSales contains 180 million rows stored in an on-premises SQL Server data warehouse and must show near-real-time intra-day orders without waiting for a full import.',
          'DimStore (420 rows) and DimDate (3,650 rows) are used to slice both FactOnlineSales and an imported FactStoreBudget table.',
          'FactOnlineSales contains both OrderDateKey and ShipDateKey columns; OrderDateKey is linked via the active relationship to DimDate.',
          'DimEmployee contains EmployeeEmail (matching Microsoft Entra UPN) and AssignedRegion.',
        ],
      },
      {
        id: 'ex-data',
        title: 'Data & Modeling Requirements',
        content: [
          'Slicers built on DimStore must respond instantaneously when users filter pages, while avoiding slow cross-source joins against FactOnlineSales.',
          'Sales managers need a [Shipped Sales] measure grouped by DimDate without duplicating the DimDate table in the model.',
          'The model currently suffers from 14 hidden LocalDateTable_* tables automatically generated for legacy date columns.',
        ],
      },
      {
        id: 'ex-security',
        title: 'Security & Governance Requirements',
        content: [
          'Regional Directors must ONLY view sales rows matching their AssignedRegion in DimEmployee using Dynamic Row-Level Security.',
          'Ten junior BI analysts need permission to author new reports inside a shared Development workspace, while Regional Directors must NEVER bypass Row-Level Security.',
          'The central FactOnlineSales semantic model must carry an official governance badge verified by the BI Center of Excellence.',
        ],
      },
      {
        id: 'ex-report',
        title: 'Reporting & UX Requirements',
        content: [
          'Users want two overlapping chart views ("Revenue by Store" vs "Margin by Store") controlled by buttons without resetting their active Region or Year slicers.',
          'Regional managers want automated email alerts whenever Daily Return Rate exceeds 4%.',
        ],
      },
    ],
    questions: [
      {
        id: 'cs1-q1',
        question:
          'Which storage mode combination should you configure for FactOnlineSales, FactStoreBudget, and the shared DimStore table?',
        options: [
          'FactOnlineSales: Import | FactStoreBudget: Import | DimStore: Import',
          'FactOnlineSales: DirectQuery | FactStoreBudget: Import | DimStore: Dual',
          'FactOnlineSales: DirectQuery | FactStoreBudget: DirectQuery | DimStore: Import',
          'FactOnlineSales: Dual | FactStoreBudget: Import | DimStore: DirectQuery',
        ],
        correctIndex: 1,
        explanation:
          'FactOnlineSales requires near-real-time DirectQuery over 180M rows, FactStoreBudget is imported, and DimStore must be set to Dual so slicers run instantly from VertiPaq cache while still joining cleanly on the SQL Server source for FactOnlineSales.',
        exhibitId: 'ex-data',
        evidenceQuote:
          'Slicers built on DimStore must respond instantaneously when users filter pages, while avoiding slow cross-source joins against FactOnlineSales.',
      },
      {
        id: 'cs1-q2',
        question:
          'How should you implement the [Shipped Sales] measure using the single unified DimDate table?',
        options: [
          'Duplicate DimDate into DimShipDate and create an active relationship.',
          'Activate both OrderDateKey and ShipDateKey relationships simultaneously.',
          'Create an inactive relationship on ShipDateKey -> DimDate and wrap [Total Sales] in CALCULATE(..., USERELATIONSHIP(...)).',
          'Enable bi-directional cross-filtering on the OrderDateKey relationship.',
        ],
        correctIndex: 2,
        explanation:
          'You cannot duplicate DimDate per requirements, nor have two active relationships between the same tables. Keeping ShipDateKey inactive and activating it via USERELATIONSHIP() inside CALCULATE is the exact PL-300 pattern.',
        exhibitId: 'ex-data',
        evidenceQuote:
          'Sales managers need a [Shipped Sales] measure grouped by DimDate without duplicating the DimDate table in the model.',
      },
      {
        id: 'cs1-q3',
        question:
          'How must Regional Directors be granted access to the production Workspace / App so that Dynamic RLS ([EmployeeEmail] = USERPRINCIPALNAME()) cannot be bypassed?',
        options: [
          'Assign Regional Directors to the Workspace Contributor role.',
          'Assign Regional Directors to the Workspace Viewer role (or distribute exclusively via the Workspace App without workspace Edit permissions).',
          'Assign Regional Directors to the Workspace Member role and test with "View as".',
          'Use Object-Level Security (OLS) instead of RLS.',
        ],
        correctIndex: 1,
        explanation:
          'Workspace Admins, Members, and Contributors ALL bypass RLS. Only users with the Viewer role (or App-only consumers) have RLS filters strictly enforced.',
        exhibitId: 'ex-security',
        evidenceQuote:
          'Ten junior BI analysts need permission to author new reports inside a shared Development workspace, while Regional Directors must NEVER bypass Row-Level Security.',
      },
      {
        id: 'cs1-q4',
        question:
          'Which endorsement level should the BI Center of Excellence apply to the FactOnlineSales semantic model?',
        options: [
          'Promoted',
          'Certified',
          'Master Data',
          'Sensitivity: Confidential',
        ],
        correctIndex: 1,
        explanation:
          'Promoted can be set by any dataset owner/member; **Certified** is reserved for authorized reviewers / Center of Excellence governance to indicate an officially vetted source of truth.',
        exhibitId: 'ex-security',
        evidenceQuote:
          'The central FactOnlineSales semantic model must carry an official governance badge verified by the BI Center of Excellence.',
      },
      {
        id: 'cs1-q5',
        question:
          'When configuring the "Revenue by Store" and "Margin by Store" button bookmarks, which Bookmark property MUST be unchecked so active Region/Year slicers are preserved?',
        options: [
          'Display',
          'Data',
          'Current page',
          'All visuals',
        ],
        correctIndex: 1,
        explanation:
          'Unchecking "Data" prevents bookmarks from restoring saved slicer/filter states while keeping "Display" checked so chart visibility switches cleanly.',
        exhibitId: 'ex-report',
        evidenceQuote:
          'Users want two overlapping chart views ("Revenue by Store" vs "Margin by Store") controlled by buttons without resetting their active Region or Year slicers.',
      },
    ],
  },
  {
    id: 'cs-2',
    companyName: 'Litware Manufacturing & IoT Analytics',
    industry: 'Industrial IoT & Supply Chain',
    summary:
      'Litware monitors factory sensor telemetry, machine downtime, and parts inventory across 12 plants using Azure SQL Database and Power BI Premium Per User (PPU).',
    exhibits: [
      {
        id: 'ex2-overview',
        title: 'Business Overview',
        content: [
          'Litware operates 12 manufacturing plants generating 60 million machine telemetry rows per year.',
          'Plant engineers need fast root-cause diagnostics when downtime spikes and clear visibility into sequential month-over-month inventory gains and losses.',
        ],
      },
      {
        id: 'ex2-env',
        title: 'Existing Environment',
        content: [
          'Telemetry resides in an Azure SQL Database table named FactMachineEvents containing columns: EventID, MachineKey, EventTimestamp (Date/Time with milliseconds), StatusCode, and DowntimeMinutes.',
          'Inventory levels are recorded daily as end-of-day snapshots in FactInventorySnapshot[StockQty] — summing StockQty across days produces meaningless inflated numbers.',
        ],
      },
      {
        id: 'ex2-data',
        title: 'Data & Modeling Requirements',
        content: [
          'FactMachineEvents must use Incremental Refresh to avoid reloading all 60M rows daily; Query Folding must remain intact.',
          'High-cardinality millisecond timestamps in EventTimestamp are pushing the PBIX file over memory budgets even though reports only need Date and Hour granularity.',
          'The [Ending Inventory] measure must return ONLY the stock quantity on the last visible date of any selected month, quarter, or year.',
        ],
      },
      {
        id: 'ex2-security',
        title: 'Security & Governance Requirements',
        content: [
          'Plant Supervisors need to create and publish their own ad-hoc reports to a plant workspace, but must NOT be allowed to add/remove workspace users or publish the workspace App.',
          'An on-premises legacy ERP database will soon be added via DirectQuery for multiple report authors to share.',
        ],
      },
      {
        id: 'ex2-report',
        title: 'Reporting & UX Requirements',
        content: [
          'Plant managers want a single visual displaying sequential positive and negative inventory changes starting from Opening Stock to Closing Stock.',
          'Management wants an interactive visual that lets engineers break down Total DowntimeMinutes across Plant -> Line -> Shift -> Machine in whatever order they choose, with AI suggestions for the highest driver.',
        ],
      },
    ],
    questions: [
      {
        id: 'cs2-q1',
        question:
          'To shrink the VertiPaq memory footprint of EventTimestamp while keeping Date and Hour analysis, what should you do in Power Query?',
        options: [
          'Apply a custom format string "yyyy-MM-dd HH" in Power BI Model View.',
          'Duplicate EventTimestamp into separate Date and Hour columns, and remove the original millisecond Date/Time column.',
          'Write a DAX calculated column using FORMAT([EventTimestamp], "hh").',
          'Add an Index column before loading FactMachineEvents.',
        ],
        correctIndex: 1,
        explanation:
          'Display formatting does not alter stored VertiPaq precision. Splitting EventTimestamp into separate low-cardinality Date and Hour columns and dropping the millisecond timestamp drastically shrinks dictionary size.',
        exhibitId: 'ex2-data',
        evidenceQuote:
          'High-cardinality millisecond timestamps in EventTimestamp are pushing the PBIX file over memory budgets even though reports only need Date and Hour granularity.',
      },
      {
        id: 'cs2-q2',
        question:
          'Which DAX pattern correctly computes the semi-additive [Ending Inventory] measure?',
        options: [
          'SUM(FactInventorySnapshot[StockQty])',
          "CALCULATE(SUM(FactInventorySnapshot[StockQty]), LASTDATE('Date'[Date]))",
          "CALCULATE(SUM(FactInventorySnapshot[StockQty]), ALL('Date'[Date]))",
          "TOTALYTD(SUM(FactInventorySnapshot[StockQty]), 'Date'[Date])",
        ],
        correctIndex: 1,
        explanation:
          "Inventory balance is semi-additive: you sum across products/warehouses, NOT across time. Wrapping SUM in CALCULATE(..., LASTDATE('Date'[Date])) filters to only the final day in the selected period.",
        exhibitId: 'ex2-data',
        evidenceQuote:
          'The [Ending Inventory] measure must return ONLY the stock quantity on the last visible date of any selected month, quarter, or year.',
      },
      {
        id: 'cs2-q3',
        question:
          'Which workspace role and gateway mode satisfy Litware\'s governance and legacy ERP DirectQuery requirements?',
        options: [
          'Member role + Personal Gateway',
          'Contributor role + Standard On-Premises Data Gateway',
          'Viewer role + Standard On-Premises Data Gateway',
          'Contributor role + Personal Gateway',
        ],
        correctIndex: 1,
        explanation:
          'Contributor allows publishing/editing workspace reports while blocking user management and App publishing. DirectQuery shared across multiple authors requires the Standard On-Premises Data Gateway.',
        exhibitId: 'ex2-security',
        evidenceQuote:
          'Plant Supervisors need to create and publish their own ad-hoc reports to a plant workspace, but must NOT be allowed to add/remove workspace users or publish the workspace App.',
      },
      {
        id: 'cs2-q4',
        question:
          'Which two native Power BI visuals match the two reporting requirements in the UX exhibit?',
        options: [
          'Ribbon Chart and Key Influencers',
          'Waterfall Chart and Decomposition Tree',
          'Funnel Chart and Smart Narrative',
          'Clustered Bar Chart and Scatter Chart',
        ],
        correctIndex: 1,
        explanation:
          'A Waterfall chart visualizes sequential positive/negative bridges from Opening to Closing totals, and a Decomposition Tree supports arbitrary dimension drill order plus AI High/Low Value splits.',
        exhibitId: 'ex2-report',
        evidenceQuote:
          'Plant managers want a single visual displaying sequential positive and negative inventory changes starting from Opening Stock to Closing Stock.',
      },
      {
        id: 'cs2-q5',
        question:
          'When setting up Incremental Refresh on FactMachineEvents, which filter condition prevents duplicate or missed rows across daily partition boundaries?',
        options: [
          'OrderDate >= RangeStart AND OrderDate <= RangeEnd',
          'EventTimestamp >= RangeStart AND EventTimestamp < RangeEnd',
          'EventTimestamp > RangeStart AND EventTimestamp < RangeEnd',
          'EventTimestamp = RangeStart OR EventTimestamp = RangeEnd',
        ],
        correctIndex: 1,
        explanation:
          'One side must be inclusive (>=) and the other exclusive (<) — or vice versa — so exact midnight timestamps belong to exactly one partition rather than zero or two partitions.',
        exhibitId: 'ex2-data',
        evidenceQuote:
          'FactMachineEvents must use Incremental Refresh to avoid reloading all 60M rows daily; Query Folding must remain intact.',
      },
    ],
  },
];
