/* The study plan: six parts, 36 sessions of an hour or so each.

   Each session is a list of tasks. Most tasks point at something in the app
   (a module, a video, a lab, a set of questions) and tick themselves when
   that thing is done. `do` tasks are things done outside the app (in Power BI
   Desktop, on Microsoft Learn) and are ticked by hand; their ids are
   `${session id}.${task index}`, so add new `do` tasks at the end of a
   session rather than in the middle, or ticks will move to the wrong task.

   The order follows the exam's weights: one part for Prepare the Data (25-30%),
   two for Model the Data (25-30%, and it's where most people lose marks),
   one for Visualize and Analyze (25-30%), one for Manage and Secure (15-20%),
   and a final part of review and timed practice. */

import { DomainId } from '../types/pl300';

export type PlanLink = { label: string; hash: string; domain?: DomainId } | { label: string; url: string };

export type PlanTask =
  | { kind: 'module'; id: string }                                  // every skill in it ticked
  | { kind: 'video'; id: string }                                   // marked watched
  | { kind: 'mcq'; domain: DomainId; mode: 'answer' | 'master' }    // every question answered / last answered right
  | { kind: 'dax'; ids: string[] }                                  // DAX builder challenges solved
  | { kind: 'order'; ids: string[] }                                // Step order challenges solved
  | { kind: 'pqlab'; ids: string[] }                                // Power Query lab datasets solved
  | { kind: 'case'; id: string }                                    // every question in the case study right
  | { kind: 'drills'; streak: number; focus: string }               // best drill streak
  | { kind: 'score'; min: number }                                  // readiness score on Home
  | { kind: 'do'; text: string; detail?: string; link?: PlanLink }; // ticked by hand

export interface PlanSession {
  id: string;
  title: string;
  minutes: number;
  focus: string;       // what to concentrate on, and why it matters for the exam
  tasks: PlanTask[];
  doneWhen: string;    // the self-check before moving on
}

export interface PlanPart {
  n: number;
  title: string;
  domain?: DomainId;
  goal: string;
  checkpoint: string[]; // what you can do by the end of it
  sessions: PlanSession[];
}

const SKILLS_OUTLINE = 'https://learn.microsoft.com/credentials/certifications/resources/study-guides/pl-300';

export const STUDY_PLAN: PlanPart[] = [
  {
    n: 1,
    title: 'Get and prepare the data',
    domain: 'prepare',
    goal:
      'Connect to data, choose a storage mode, then clean, shape and combine it in Power Query, keeping query folding intact. Worth 25–30% of the exam.',
    checkpoint: [
      'Choose between Import, DirectQuery, Dual and a live connection, and say what each costs.',
      'Use column quality, distribution and profile to find problems before fixing them.',
      'Unpivot, merge, append, group and fill down without looking up the steps.',
      'Say which steps break query folding and how to check whether a step folds.',
    ],
    sessions: [
      {
        id: 'p1s1',
        title: 'Set up and take a baseline',
        minutes: 60,
        focus:
          'Get the tools ready and find out where you start. Read the official skills outline once: it’s the list the exam is written from, and every part of this plan maps to a section of it. The baseline questions aren’t about getting them right; they show which words and features are new to you.',
        tasks: [
          {
            kind: 'do',
            text: 'Install Power BI Desktop (free, Windows) and open it once',
            detail: 'On a Mac, use a Windows VM or a cloud PC; the labs here still work in any browser.',
            link: { label: 'Get Power BI Desktop', url: 'https://www.microsoft.com/en-us/download/details.aspx?id=58494' },
          },
          {
            kind: 'do',
            text: 'Skim the official PL-300 skills outline',
            detail: 'Note anything you’ve never heard of. Come back to that list at the end of each part.',
            link: { label: 'Skills measured', url: SKILLS_OUTLINE },
          },
          {
            kind: 'do',
            text: 'Answer 10 practice questions across all domains, in Study mode',
            detail: 'Read every explanation, including for the ones you got right.',
            link: { label: 'Practice questions', hash: '#/simulator/mcq' },
          },
          {
            kind: 'do',
            text: 'Take the app’s walkthrough and review 20 flashcards',
            detail: 'Rate them honestly; the ones you mark Again come back first.',
            link: { label: 'Flashcards', hash: '#/flashcards' },
          },
        ],
        doneWhen: 'Power BI Desktop opens, and you have a short list of topics that were new to you.',
      },
      {
        id: 'p1s2',
        title: 'Get data and choose a storage mode',
        minutes: 75,
        focus:
          'The exam asks which connector and storage mode fit a scenario far more than how to click through a connection. Learn the trade-offs: Import is fastest but needs refresh; DirectQuery is always current but slower and limits DAX and Power Query; Dual lets dimension tables serve both. Also know parameters and the difference between a live connection and DirectQuery to a semantic model.',
        tasks: [
          { kind: 'module', id: 'prep-1' },
          { kind: 'video', id: 'vid-3' },
          {
            kind: 'do',
            text: 'In Desktop, connect to an Excel or CSV file and to a web page or folder',
            detail: 'Open Transform data each time. Look at the Source step in the formula bar to see the connector function.',
          },
          {
            kind: 'do',
            text: 'Read the storage modes table',
            link: { label: 'Reference tables', hash: '#/matrix/cheatsheets' },
          },
        ],
        doneWhen: 'Given a scenario (data size, freshness, source), you can pick the storage mode and say why.',
      },
      {
        id: 'p1s3',
        title: 'Profile and clean',
        minutes: 75,
        focus:
          'Profiling comes before cleaning. Column quality shows valid, error and empty percentages; column distribution shows distinct and unique counts; column profile shows statistics and a value distribution. A classic trap: by default profiling only looks at the top 1,000 rows, set in the status bar.',
        tasks: [
          { kind: 'module', id: 'prep-2' },
          { kind: 'video', id: 'vid-4' },
          {
            kind: 'do',
            text: 'Read the editor guides: open the editor, find your way around, applied steps',
            link: { label: 'Power Query guides', hash: '#/matrix/pq' },
          },
          { kind: 'pqlab', ids: ['pql-2'] },
        ],
        doneWhen: 'You can name the three profiling views, what each shows, and how to profile the whole table.',
      },
      {
        id: 'p1s4',
        title: 'Shape: unpivot, split, types',
        minutes: 75,
        focus:
          'Turning wide spreadsheets into long tables is the most tested transformation. Know Unpivot other columns versus Unpivot columns (the first survives new columns appearing), when to promote headers, and why setting data types late (and once) is better than early and often.',
        tasks: [
          { kind: 'module', id: 'prep-3' },
          { kind: 'pqlab', ids: ['pql-1'] },
          { kind: 'order', ids: ['pq-1'] },
          {
            kind: 'do',
            text: 'Read the guides on unpivot, split a column and change data types',
            link: { label: 'Power Query guides', hash: '#/matrix/pq' },
          },
          {
            kind: 'do',
            text: 'Open the Advanced Editor on a query you built and read its M, step by step',
            detail: 'Each step is a line in a let … in block that refers to the step before it.',
          },
        ],
        doneWhen: 'You can unpivot a month-per-column table and explain why Unpivot other columns is the safer choice.',
      },
      {
        id: 'p1s5',
        title: 'Combine: merge and append',
        minutes: 75,
        focus:
          'Merge adds columns (a join); append adds rows (a union). Know all six join kinds, and that a left anti join finds rows with no match, which is how you find orphaned keys. Combining files from a folder builds a helper function and a sample file; know what each is for.',
        tasks: [
          { kind: 'video', id: 'vid-5' },
          { kind: 'pqlab', ids: ['pql-3', 'pql-4'] },
          { kind: 'order', ids: ['pq-5'] },
        ],
        doneWhen: 'You can say which join kind answers “which orders have no matching customer?”.',
      },
      {
        id: 'p1s6',
        title: 'Query folding, and check yourself',
        minutes: 90,
        focus:
          'Folding means Power Query turns your steps into a single query the source runs. It matters for big tables and is required for incremental refresh. Filtering, removing columns and grouping usually fold; adding an index, custom M functions and some type changes often don’t. Right-click a step and look at View Native Query to check.',
        tasks: [
          { kind: 'video', id: 'vid-2' },
          { kind: 'order', ids: ['pq-2'] },
          { kind: 'pqlab', ids: ['pql-5', 'pql-6'] },
          { kind: 'mcq', domain: 'prepare', mode: 'answer' },
        ],
        doneWhen: 'Every Prepare question answered, and you could explain to someone why step order matters for folding.',
      },
    ],
  },

  {
    n: 2,
    title: 'Model the data',
    domain: 'model',
    goal:
      'Build a star schema with the right relationships, then write your first measures and understand evaluation context, the idea behind almost every hard DAX question.',
    checkpoint: [
      'Split a flat table into facts and dimensions, and say why a star beats a snowflake.',
      'Set cardinality and cross-filter direction, and handle a second date with an inactive relationship.',
      'Explain row context, filter context and context transition in your own words.',
      'Choose between a measure and a calculated column, and use CALCULATE with ALL, ALLEXCEPT and KEEPFILTERS.',
    ],
    sessions: [
      {
        id: 'p2s1',
        title: 'Star schema',
        minutes: 75,
        focus:
          'Fact tables hold events and numbers (sales lines); dimension tables describe them (product, customer, date). Relationships run one-to-many from dimension to fact. Snowflaked dimensions (product → subcategory → category) work, but flattening them gives simpler filters and faster models.',
        tasks: [
          { kind: 'module', id: 'mod-1' },
          { kind: 'video', id: 'vid-6' },
          { kind: 'order', ids: ['pq-4', 'pq-6'] },
          {
            kind: 'do',
            text: 'In Desktop, load the sample dataset from the start screen and draw its model on paper',
            detail: 'Mark each table as fact or dimension, and each relationship’s “one” and “many” side.',
          },
        ],
        doneWhen: 'You can look at a flat table and say which columns become which dimension.',
      },
      {
        id: 'p2s2',
        title: 'Relationships and the date table',
        minutes: 75,
        focus:
          'Know one-to-many, one-to-one and many-to-many cardinality, single versus both cross-filter direction (and why Both is risky), and that only one relationship between two tables can be active. Time intelligence needs a proper date table marked as one, with every date and no gaps.',
        tasks: [
          { kind: 'video', id: 'vid-8' },
          { kind: 'dax', ids: ['dax-4'] },
          {
            kind: 'do',
            text: 'Create a date table with CALENDARAUTO or CALENDAR, add Year and Month columns, and mark it as a date table',
            detail: 'Then relate it to the fact table and use it in a visual instead of the fact table’s own dates.',
          },
          {
            kind: 'do',
            text: 'Read the USERELATIONSHIP and CALENDAR entries in the DAX cheat sheet',
            link: { label: 'DAX cheat sheet', hash: '#/matrix/dax' },
          },
        ],
        doneWhen: 'You can explain why an order date and a ship date need two relationships, one inactive.',
      },
      {
        id: 'p2s3',
        title: 'Measures, columns and iterators',
        minutes: 75,
        focus:
          'Calculated columns are computed at refresh and stored, row by row; measures are computed at query time, in whatever filters the visual applies. Prefer measures for anything aggregated. Iterators (SUMX, AVERAGEX) walk a table row by row, and RELATED reaches across to the one side of a relationship.',
        tasks: [
          { kind: 'module', id: 'mod-2' },
          { kind: 'dax', ids: ['dax-5'] },
          {
            kind: 'do',
            text: 'Write five measures in Desktop: Total Sales, Total Cost, Margin, Margin % (with DIVIDE), and Order Count',
            detail: 'Use DIVIDE rather than /, so a zero denominator gives blank instead of an error.',
          },
          {
            kind: 'do',
            text: 'Read the aggregation and iterator entries in the DAX cheat sheet',
            link: { label: 'DAX cheat sheet', hash: '#/matrix/dax' },
          },
        ],
        doneWhen: 'You can say why SUM(Sales[Qty] * Sales[Price]) isn’t valid DAX and what to write instead.',
      },
      {
        id: 'p2s4',
        title: 'Evaluation context',
        minutes: 75,
        focus:
          'The single most important idea in DAX. Filter context is the set of filters on a cell (slicers, rows, columns). Row context is “the current row” inside a calculated column or an iterator; it does not filter anything by itself. CALCULATE turns row context into filter context (context transition), which is why a measure used in a calculated column behaves differently from the same expression written inline.',
        tasks: [
          { kind: 'video', id: 'vid-7' },
          {
            kind: 'do',
            text: 'In your notes for the DAX module, explain row context, filter context and context transition in three sentences',
            detail: 'Use the notes box under Details on the “Create DAX Measures” module. Writing it down is the test.',
          },
          {
            kind: 'do',
            text: 'Review the DAX flashcards until none are in box 1',
            link: { label: 'Flashcards', hash: '#/flashcards' },
          },
        ],
        doneWhen: 'Your three-sentence explanation would make sense to someone who’s never used DAX.',
      },
      {
        id: 'p2s5',
        title: 'CALCULATE and filter modifiers',
        minutes: 90,
        focus:
          'CALCULATE changes the filter context, then evaluates. ALL removes filters (for “% of total”), ALLEXCEPT removes all but some, ALLSELECTED keeps what the user picked in slicers (for “% of visible total”), and KEEPFILTERS adds a filter instead of replacing one. Expect at least one question that hinges on which of these to use.',
        tasks: [
          { kind: 'video', id: 'vid-10' },
          { kind: 'dax', ids: ['dax-3', 'dax-6'] },
          {
            kind: 'do',
            text: 'Read the filter modifier table side by side',
            link: { label: 'Reference tables', hash: '#/matrix/cheatsheets' },
          },
        ],
        doneWhen: 'You can say what ALL, ALLSELECTED and KEEPFILTERS would each return in a visual filtered by a slicer.',
      },
      {
        id: 'p2s6',
        title: 'Group, derive, and check yourself',
        minutes: 75,
        focus:
          'Close the loop between Power Query and the model: some logic belongs upstream (grouping, conditional columns), some in DAX. As a rule, do it in Power Query if it’s fixed per row and needed for filtering or relationships; do it in DAX if it must respond to filters.',
        tasks: [
          { kind: 'pqlab', ids: ['pql-7', 'pql-8'] },
          { kind: 'mcq', domain: 'model', mode: 'answer' },
          {
            kind: 'do',
            text: 'Write down three model-design rules you’d give a colleague, in the module notes',
          },
        ],
        doneWhen: 'Every Model question answered, and you could defend where each calculation lives.',
      },
    ],
  },

  {
    n: 3,
    title: 'DAX in depth and model performance',
    domain: 'model',
    goal:
      'Time intelligence, ranking and the patterns the exam likes, then make a model smaller and faster. Finish with your first full case study.',
    checkpoint: [
      'Write YTD, prior-year and year-over-year % measures without notes.',
      'Rank with RANKX in a way that respects slicers, and use variables to make measures readable.',
      'Use Performance Analyzer and know the usual fixes: fewer columns, lower cardinality, the right data types.',
      'Answer a full case study, finding the evidence in the exhibits.',
    ],
    sessions: [
      {
        id: 'p3s1',
        title: 'Time intelligence',
        minutes: 90,
        focus:
          'TOTALYTD, DATESYTD, SAMEPERIODLASTYEAR, DATEADD and PARALLELPERIOD all need a marked date table and a filter on its dates. Know the difference between DATEADD (shifts the current dates) and PARALLELPERIOD (returns whole periods), and how a fiscal year end changes TOTALYTD.',
        tasks: [
          { kind: 'module', id: 'mod-3' },
          { kind: 'video', id: 'vid-9' },
          { kind: 'dax', ids: ['dax-1', 'dax-2'] },
          {
            kind: 'do',
            text: 'In Desktop, write Sales YTD, Sales PY and YoY % (with DIVIDE), and put them in a matrix by year and month',
          },
        ],
        doneWhen: 'Your YoY % shows blank, not an error, for the first year.',
      },
      {
        id: 'p3s2',
        title: 'Ranking, variables and table functions',
        minutes: 75,
        focus:
          'RANKX over ALL(Table) ranks against everything; over ALLSELECTED it respects slicers. Variables (VAR … RETURN) are evaluated once and make measures easier to read and debug. Know FILTER versus a plain CALCULATE filter, and TOPN, SUMMARIZE and ADDCOLUMNS for calculated tables.',
        tasks: [
          { kind: 'dax', ids: ['dax-8'] },
          {
            kind: 'do',
            text: 'Rewrite your Margin % measure with VAR and RETURN',
          },
          {
            kind: 'do',
            text: 'Read the table functions and patterns in the DAX cheat sheet',
            link: { label: 'DAX cheat sheet', hash: '#/matrix/dax' },
          },
        ],
        doneWhen: 'You can say why a RANKX measure shows 1 on every row, and the fix.',
      },
      {
        id: 'p3s3',
        title: 'Hierarchies, quick measures and calculated tables',
        minutes: 60,
        focus:
          'Smaller topics that turn up as single questions: building hierarchies, quick measures (and reading the DAX they generate), calculated tables and when to use them, field parameters for switching what a visual shows, and calculation groups for reusing time-intelligence logic.',
        tasks: [
          {
            kind: 'do',
            text: 'Create a Year → Quarter → Month hierarchy, a quick measure, and a field parameter in Desktop',
            detail: 'Open each quick measure’s DAX afterwards and read it.',
          },
        ],
        doneWhen: 'You know where each of these lives in Desktop and what problem it solves.',
      },
      {
        id: 'p3s4',
        title: 'Make the model smaller and faster',
        minutes: 75,
        focus:
          'VertiPaq compresses columns, so cost comes from the number of columns and how many distinct values each has. Remove columns you don’t use, split date-times into date and time, prefer integers to text keys, and turn off Auto date/time. Performance Analyzer shows which visual is slow and whether the time goes on DAX or rendering.',
        tasks: [
          { kind: 'video', id: 'vid-11' },
          {
            kind: 'do',
            text: 'Run Performance Analyzer on a report page in Desktop and copy the slowest visual’s query',
          },
          {
            kind: 'drills',
            streak: 5,
            focus: 'Storage modes',
          },
        ],
        doneWhen: 'You can list four ways to reduce a model’s size and say which helps most.',
      },
      {
        id: 'p3s5',
        title: 'DAX without hints',
        minutes: 75,
        focus:
          'Recognising the right function in a list is easier than writing it. Switch the DAX builder to Write it myself and type measures from scratch; the runner evaluates them on sample data so you see if they’re right.',
        tasks: [
          {
            kind: 'do',
            text: 'Write three DAX builder measures from scratch with Write it myself, and run them',
            link: { label: 'DAX builder', hash: '#/simulator/dax' },
          },
          { kind: 'mcq', domain: 'model', mode: 'master' },
        ],
        doneWhen: 'Every Model question’s latest answer is right.',
      },
      {
        id: 'p3s6',
        title: 'First case study',
        minutes: 60,
        focus:
          'Case studies give you several tabs of requirements and a run of questions. Read the questions first, then hunt for the line in the exhibits that answers each one: the requirements usually rule out all but one option. You can’t go back into a case study after leaving it in the real exam.',
        tasks: [{ kind: 'case', id: 'cs-1' }],
        doneWhen: 'Full marks, and for each question you can point to the sentence that decided it.',
      },
    ],
  },

  {
    n: 4,
    title: 'Visualize and analyze',
    domain: 'visualize',
    goal:
      'Choose the right visual, format it accessibly, make reports interactive with bookmarks, drill-through and tooltips, and use the built-in AI and analytics features. Worth 25–30%.',
    checkpoint: [
      'Pick the right visual for a comparison, trend, part-to-whole, distribution or relationship.',
      'Make a report accessible: alt text, tab order, contrast, not relying on colour.',
      'Build bookmarks, a drill-through page, a report page tooltip and sync slicers.',
      'Know what Key influencers, Decomposition tree, Q&A and anomaly detection each answer.',
    ],
    sessions: [
      {
        id: 'p4s1',
        title: 'Choosing visuals',
        minutes: 75,
        focus:
          'Line charts for trends over time, bar and column for comparing categories, a matrix for detail, a card or KPI for one number, a scatter for relationships, and pie or donut only for a few parts of a whole. The exam often describes a business question and asks which visual answers it.',
        tasks: [
          { kind: 'module', id: 'vis-1' },
          { kind: 'drills', streak: 8, focus: 'Visual selection' },
          {
            kind: 'do',
            text: 'Build a one-page report in Desktop: a KPI card, a trend, a category comparison and a slicer',
          },
        ],
        doneWhen: 'For any business question, you can name the visual and the field wells you’d use.',
      },
      {
        id: 'p4s2',
        title: 'Formatting, themes and accessibility',
        minutes: 60,
        focus:
          'Report themes (JSON) set colours and fonts across a report. Accessibility is tested directly: alt text on visuals, a logical tab order (in the Selection pane), enough contrast, markers or labels so colour isn’t the only signal, and the keyboard shortcuts screen-reader users rely on.',
        tasks: [
          { kind: 'video', id: 'vid-15' },
          {
            kind: 'do',
            text: 'On your report, add alt text to each visual, set the tab order, and apply a built-in theme',
          },
        ],
        doneWhen: 'You can list five things that make a report accessible.',
      },
      {
        id: 'p4s3',
        title: 'Bookmarks, drill-through and navigation',
        minutes: 75,
        focus:
          'Bookmarks capture a page’s state (filters, visibility, sort); know the Data, Display and Current page options. Drill-through passes filters to a detail page; drill-down moves through a hierarchy within one visual. Combine bookmarks with buttons and the Selection pane for show/hide panels, and use the page navigator.',
        tasks: [
          { kind: 'module', id: 'vis-2' },
          { kind: 'video', id: 'vid-12' },
          {
            kind: 'do',
            text: 'Add a drill-through page, two bookmarks driven by buttons, and sync a slicer across pages',
          },
        ],
        doneWhen: 'You can explain the difference between drill-down and drill-through, and between a bookmark’s Data and Display options.',
      },
      {
        id: 'p4s4',
        title: 'Tooltips, interactions and conditional formatting',
        minutes: 60,
        focus:
          'Report page tooltips show a small page on hover. Edit interactions decides whether selecting one visual filters, highlights or does nothing to another. Conditional formatting can use rules, a colour scale or a field value (a measure returning a colour name or hex code).',
        tasks: [
          { kind: 'video', id: 'vid-14' },
          {
            kind: 'do',
            text: 'Build a report page tooltip, change one visual’s interactions to None, and colour a column by a measure',
          },
        ],
        doneWhen: 'You can set up a tooltip page from memory.',
      },
      {
        id: 'p4s5',
        title: 'AI visuals and analytics',
        minutes: 75,
        focus:
          'Key influencers explains what drives a metric; Decomposition tree breaks it down by dimensions you pick (or AI picks); Q&A answers typed questions; Smart narrative writes a summary. The Analytics pane adds trend, forecast, constant and percentile lines. Also know grouping, binning, clustering and anomaly detection on line charts.',
        tasks: [
          { kind: 'module', id: 'vis-3' },
          { kind: 'video', id: 'vid-13' },
          {
            kind: 'do',
            text: 'Add a Key influencers visual, a Decomposition tree, and a forecast to a line chart',
          },
        ],
        doneWhen: 'Given a business question, you can say which AI visual answers it.',
      },
      {
        id: 'p4s6',
        title: 'Check yourself',
        minutes: 60,
        focus:
          'Go back over the visuals questions, and the videos and modules you skipped. Paginated reports, mobile layout and dashboards (pinning tiles in the service) also sit in this domain: read about them on Learn if they’re new.',
        tasks: [
          { kind: 'mcq', domain: 'visualize', mode: 'master' },
        ],
        doneWhen: 'Every Visualize question’s latest answer is right.',
      },
    ],
  },

  {
    n: 5,
    title: 'Manage and secure',
    domain: 'manage',
    goal:
      'Workspaces, roles and apps, sharing and endorsement, refresh and gateways, and row-level security. The smallest domain (15–20%), but the questions are very predictable.',
    checkpoint: [
      'Pick the least-privileged workspace role for a task (Viewer, Contributor, Member, Admin).',
      'Choose between an app, sharing and a workspace role to give people access.',
      'Say when you need a gateway, and set up scheduled and incremental refresh.',
      'Build static and dynamic RLS, test it with View as, and know what OLS and Build permission do.',
    ],
    sessions: [
      {
        id: 'p5s1',
        title: 'Workspaces and roles',
        minutes: 60,
        focus:
          'Viewers only view; Contributors create and edit content; Members also share and publish apps; Admins also manage access and delete the workspace. Questions often ask for the least privilege that allows a task, so learn exactly where each line falls.',
        tasks: [
          { kind: 'module', id: 'man-1' },
          { kind: 'video', id: 'vid-16' },
          { kind: 'drills', streak: 10, focus: 'Workspace roles' },
          {
            kind: 'do',
            text: 'Read the workspace roles table until you can recreate it',
            link: { label: 'Reference tables', hash: '#/matrix/cheatsheets' },
          },
        ],
        doneWhen: 'You can fill in the roles table from memory.',
      },
      {
        id: 'p5s2',
        title: 'Sharing, apps, endorsement and labels',
        minutes: 60,
        focus:
          'Apps are the standard way to give a large audience read-only access, with audiences for different groups. Know promoted versus certified endorsement, sensitivity labels and how they follow data when it’s exported, subscriptions and data alerts (alerts only on dashboard tiles with a card, KPI or gauge), and pinning to dashboards.',
        tasks: [
          {
            kind: 'do',
            text: 'Publish your report to My workspace (a free account is enough) and pin a tile to a new dashboard',
            detail: 'If you can’t sign in to the service, read the Learn module on dashboards instead.',
          },
          {
            kind: 'do',
            text: 'Write a one-line rule for when to use an app, direct sharing, or a workspace role',
          },
        ],
        doneWhen: 'You can say what a certified semantic model is and who can certify one.',
      },
      {
        id: 'p5s3',
        title: 'Refresh and gateways',
        minutes: 75,
        focus:
          'Cloud sources need no gateway; on-premises sources need one. The standard gateway serves many users and DirectQuery; the personal gateway is for one person and Import only. Incremental refresh needs RangeStart and RangeEnd parameters (date/time type), a filter on them that folds, and a policy set in Desktop.',
        tasks: [
          { kind: 'module', id: 'man-2' },
          { kind: 'video', id: 'vid-18' },
          { kind: 'order', ids: ['pq-3'] },
        ],
        doneWhen: 'You can set up incremental refresh in the right order and say why folding matters for it.',
      },
      {
        id: 'p5s4',
        title: 'Row-level security',
        minutes: 75,
        focus:
          'RLS roles are defined in Desktop with DAX filters and members are added in the service. Static RLS hard-codes values ([Region] = "West"); dynamic RLS compares a column with USERPRINCIPALNAME(). Test with View as in Desktop. RLS applies to Viewers only: workspace Admins, Members and Contributors see everything.',
        tasks: [
          { kind: 'module', id: 'man-3' },
          { kind: 'video', id: 'vid-17' },
          { kind: 'dax', ids: ['dax-7'] },
          {
            kind: 'do',
            text: 'Create a static role and a dynamic role in Desktop, and test both with View as',
          },
        ],
        doneWhen: 'You can say why RLS seems not to work for a workspace Member.',
      },
      {
        id: 'p5s5',
        title: 'OLS, permissions and drills',
        minutes: 60,
        focus:
          'Object-level security hides tables or columns (set with Tabular Editor). Build permission lets people make their own reports on a semantic model. Read permission alone lets them view. Run the security drills until the patterns feel automatic.',
        tasks: [
          { kind: 'drills', streak: 12, focus: 'Security (RLS/OLS)' },
          {
            kind: 'do',
            text: 'Review the Manage and Secure flashcards until none are in box 1',
            link: { label: 'Flashcards', hash: '#/flashcards' },
          },
        ],
        doneWhen: 'You can name the permission someone needs to build a report on your semantic model.',
      },
      {
        id: 'p5s6',
        title: 'Second case study, and check yourself',
        minutes: 75,
        focus:
          'The second case study mixes domains, as the real ones do. Afterwards, go over the Manage questions until each is right.',
        tasks: [
          { kind: 'case', id: 'cs-2' },
          { kind: 'mcq', domain: 'manage', mode: 'master' },
        ],
        doneWhen: 'Full marks on the case study, and every Manage question’s latest answer is right.',
      },
    ],
  },

  {
    n: 6,
    title: 'Review and exam practice',
    goal:
      'Close your gaps, practise under time pressure, and get ready for exam day. Aim for a readiness score of 750 or more before you sit the exam.',
    checkpoint: [
      'Every domain on Home is past the 70% line.',
      'You can finish a timed exam with time to spare and explain each wrong answer.',
      'You’ve booked the exam and know how the day works.',
    ],
    sessions: [
      {
        id: 'p6s1',
        title: 'Your weakest area',
        minutes: 90,
        focus:
          'Home shows your weakest domain. Spend this session only on it: re-read the module’s exam traps, answer its questions again, and review its flashcards. Practising what you’re already good at feels productive but moves the score least.',
        tasks: [
          {
            kind: 'do',
            text: 'Work through the weakest area on Home: its traps, its questions, its flashcards',
            link: { label: 'Home', hash: '#/dashboard' },
          },
        ],
        doneWhen: 'Your weakest domain has moved up on Home.',
      },
      {
        id: 'p6s2',
        title: 'First timed exam',
        minutes: 90,
        focus:
          'Sit a timed exam in one go, without notes. Afterwards, go through every wrong answer and write down why the right answer is right. Patterns in your mistakes matter more than the score: misreading the question, not knowing a feature, or confusing two similar ones.',
        tasks: [
          {
            kind: 'do',
            text: 'Sit a timed exam (Practice questions → Timed exam) and review every wrong answer',
            link: { label: 'Practice questions', hash: '#/simulator/mcq' },
          },
          {
            kind: 'do',
            text: 'Try Microsoft’s exam sandbox to see the real interface and question types',
            link: { label: 'Exam sandbox', url: 'https://aka.ms/examdemo' },
          },
        ],
        doneWhen: 'You have a written list of what you got wrong and why.',
      },
      {
        id: 'p6s3',
        title: 'Full review',
        minutes: 150,
        focus:
          'A long, broad review of all four domains. Pause it whenever something sounds unfamiliar and look it up in the modules or cheat sheets.',
        tasks: [
          { kind: 'video', id: 'vid-1' },
          {
            kind: 'do',
            text: 'Skim the skills outline again and tick off everything you could explain',
            link: { label: 'Skills measured', url: SKILLS_OUTLINE },
          },
        ],
        doneWhen: 'Nothing in the skills outline is a complete unknown.',
      },
      {
        id: 'p6s4',
        title: 'Labs and drills, at speed',
        minutes: 75,
        focus:
          'Redo the labs quickly, without Show solution, and push your drill streak. Speed matters: the exam gives you around 100 minutes for 40 to 60 questions, plus case studies.',
        tasks: [
          { kind: 'drills', streak: 15, focus: 'Any category' },
          {
            kind: 'do',
            text: 'Redo three Power Query lab datasets and three DAX challenges without Show solution',
            link: { label: 'Power Query lab', hash: '#/simulator/pqlab' },
          },
          {
            kind: 'do',
            text: 'Review every flashcard in To review',
            link: { label: 'Flashcards', hash: '#/flashcards' },
          },
        ],
        doneWhen: 'No flashcards left in box 1.',
      },
      {
        id: 'p6s5',
        title: 'Second timed exam and booking',
        minutes: 90,
        focus:
          'Sit another timed exam. If the readiness score is 750 or more and every domain is past 70%, book the exam. For an online exam, run the system test on the computer you’ll use, and clear your desk; for a test centre, check the ID you need.',
        tasks: [
          {
            kind: 'do',
            text: 'Sit a second timed exam and review every wrong answer',
            link: { label: 'Practice questions', hash: '#/simulator/mcq' },
          },
          { kind: 'score', min: 750 },
          {
            kind: 'do',
            text: 'Book the exam, and run the online system test if you’re sitting it at home',
            link: { label: 'Exam page', url: 'https://learn.microsoft.com/credentials/certifications/data-analyst-associate/' },
          },
        ],
        doneWhen: 'The exam is booked, and the score on Home is 750 or more.',
      },
      {
        id: 'p6s6',
        title: 'The day before',
        minutes: 45,
        focus:
          'Light review only. Read the cheat sheets and reference tables once, look over your notes and your list of mistakes, then stop. On the day: read each question’s last sentence first, flag and move on rather than getting stuck, and use the Microsoft Learn site the exam lets you open for lookups, sparingly, since it costs time.',
        tasks: [
          {
            kind: 'do',
            text: 'Read the DAX cheat sheet and the reference tables once',
            link: { label: 'DAX cheat sheet', hash: '#/matrix/dax' },
          },
          {
            kind: 'do',
            text: 'Read your module notes and your list of mistakes',
          },
        ],
        doneWhen: 'You’ve stopped studying and got some sleep.',
      },
    ],
  },
];

export const PLAN_SESSIONS: PlanSession[] = STUDY_PLAN.flatMap((p) => p.sessions);

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
