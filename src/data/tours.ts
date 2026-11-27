/* The walkthroughs: a few spotlight steps over a page, the first time it's
   opened (and again from Help → Guide → Show me around).

   Each step lights up one real thing on the page, found by its data-tour
   attribute, and says what it's for in a sentence or two. A step whose thing
   isn't on screen, or is hidden at this width, is skipped.

   Keys are pages, with the sub-page where a page has several modes:
   'simulator/dax', 'matrix/pq', 'help/devices' and so on.

   `rev`: raise it whenever a release changes something a tour describes (a
   layout, a name, what a button does), and rewrite the steps in the same
   release. Anyone who saw an older rev sees the tour again. */

export interface TourStep {
  at: string;            // a data-tour value
  title: string;
  text: string;
}

export interface Tour {
  rev: number;
  steps: TourStep[];
}

export const TOURS: Record<string, Tour> = {
  dashboard: {
    rev: 1,
    steps: [
      {
        at: 'nav',
        title: 'Five places to study',
        text: 'Home, the Study plan, Practice, Guides & cheat sheets and Flashcards. The rail (or the bar at the bottom on a phone) is always there.',
      },
      {
        at: 'score',
        title: 'Your simulated score',
        text: 'Out of 1000, like the real exam, where 700 passes. It’s built from everything you do here, weighted by how much each exam domain is worth.',
      },
      {
        at: 'next-step',
        title: 'Where to go next',
        text: 'Your weakest domain right now. Practise it for questions on just that domain, or read its modules.',
      },
      {
        at: 'domains',
        title: 'Mastery by domain',
        text: 'Each bar is one of the four exam domains. Aim to get every one past the 70% line.',
      },
      {
        at: 'labs',
        title: 'Hands-on labs',
        text: 'The practical side: Power Query and DAX you actually run, case studies and quick-fire drills.',
      },
      {
        at: 'help',
        title: 'Help and your other devices',
        text: 'The full guide lives here, along with sync: link your phone and laptop so your progress follows you.',
      },
    ],
  },

  curriculum: {
    rev: 2,
    steps: [
      {
        at: 'cur-switch',
        title: 'Plan, modules and videos',
        text: 'The Plan takes you to exam day one session at a time. Modules follow Microsoft Learn’s official PL-300 path, and Videos are hand-picked walkthroughs.',
      },
      {
        at: 'plan-overview',
        title: 'Set your schedule',
        text: 'Pick a start date and the days you can study, and add your exam date if it’s booked. Every session gets a date, and you’ll see if you fall behind.',
      },
      {
        at: 'plan-next',
        title: 'Your next session',
        text: 'What to focus on, a few tasks and a check before moving on. Most tasks tick themselves when you do them in the app; the rest you tick by hand.',
      },
      {
        at: 'plan-parts',
        title: 'Six parts',
        text: 'One per exam domain (two for modelling, where most marks are lost), then review and timed practice. Open any session to read it or work ahead.',
      },
      {
        at: 'cur-filters',
        title: 'Narrow it down',
        text: 'Pick a domain, or search for a skill or topic such as RLS or query folding.',
      },
      {
        at: 'cur-module',
        title: 'Tick off skills',
        text: 'Tick a skill once you could explain it to someone. Details opens exam traps, the patterns to know and space for your own notes.',
      },
    ],
  },

  'simulator/mcq': {
    rev: 1,
    steps: [
      { at: 'sim-tabs', title: 'Five ways to practise', text: 'Exam-style questions, DAX, Power Query step order, the Power Query Lab and case studies.' },
      {
        at: 'mcq-modes',
        title: 'Study or timed',
        text: 'Study mode explains each answer as you go. Timed exam gives you a clock and marks everything at the end, like the real thing.',
      },
      {
        at: 'mcq-map',
        title: 'Jump around',
        text: 'Every question, coloured by how you did. Flag one to come back to it.',
      },
    ],
  },

  'simulator/dax': {
    rev: 1,
    steps: [
      { at: 'dax-list', title: 'Eight DAX challenges', text: 'From time intelligence to row-level security, each one a classic exam scenario.' },
      { at: 'dax-slots', title: 'Fill the slots', text: 'Pick a slot, then the function that belongs there. Check formula tells you which slots are wrong.' },
      {
        at: 'dax-runner',
        title: 'Run it for real',
        text: 'Runs your measure on a small sample model in your browser, and shows your result next to the reference answer.',
      },
    ],
  },

  'simulator/powerquery': {
    rev: 1,
    steps: [
      { at: 'pq-seq-data', title: 'Before and after', text: 'The raw source on the left, what you need on the right.' },
      {
        at: 'pq-seq-steps',
        title: 'Order the steps',
        text: 'Add transformations in the order you’d apply them. Each one says whether it folds back to the source.',
      },
    ],
  },

  'simulator/pqlab': {
    rev: 1,
    steps: [
      { at: 'pqlab-brief', title: 'The brief', text: 'What the finished table should look like. Stuck? Show a hint, or open the guide for where things are in Power BI.' },
      {
        at: 'pqlab-ribbon',
        title: 'A working editor',
        text: 'Click a column header to select it, then use the ribbon, as in Power BI. Every action adds an applied step.',
      },
      {
        at: 'pqlab-steps',
        title: 'Applied steps',
        text: 'Click a step to see the table at that point, or delete it. Check compares your result with the target.',
      },
    ],
  },

  'simulator/casestudy': {
    rev: 1,
    steps: [
      { at: 'case-exhibits', title: 'Read the exhibits', text: 'Like the exam, each case has several tabs of background. Tip: read the questions first.' },
      {
        at: 'case-questions',
        title: 'Answer and highlight',
        text: 'Highlight evidence marks the line in the exhibits that gives the answer away.',
      },
    ],
  },

  'matrix/dax': {
    rev: 1,
    steps: [
      { at: 'guide-tabs', title: 'Guides and cheat sheets', text: 'DAX functions, Power Query how-tos, quick drills and reference tables.' },
      { at: 'dax-search', title: 'Find a function', text: 'Search by name or by what you want to do, like running total.' },
    ],
  },

  'matrix/pq': {
    rev: 1,
    steps: [
      { at: 'pq-guide-list', title: 'How to do it', text: 'Every common Power Query task, grouped by what it does.' },
      {
        at: 'pq-guide-mock',
        title: 'Where to click',
        text: 'A drawing of the Power Query Editor with the button for each step highlighted and numbered.',
      },
    ],
  },

  'matrix/drills': {
    rev: 1,
    steps: [{ at: 'guide-tabs', title: 'Quick-fire drills', text: 'Short scenarios on roles, storage modes, RLS and visuals. Keep your streak going.' }],
  },

  flashcards: {
    rev: 1,
    steps: [
      { at: 'fc-filters', title: 'Pick a deck', text: 'All cards, just the ones due for review, or one domain.' },
      {
        at: 'fc-card',
        title: 'Flip and rate',
        text: 'Press Space or click to flip, then rate how well you knew it. Again and Hard keep it in your review pile; Good and Easy count it as mastered.',
      },
      { at: 'fc-new', title: 'Your own cards', text: 'Add cards for things you keep forgetting. They sync with everything else.' },
    ],
  },

  'help/devices': {
    rev: 1,
    steps: [
      {
        at: 'sync-panel',
        title: 'Link your devices',
        text: 'Get a sync code here, then type it on your phone or another computer. Your progress follows you, with every save numbered so you can roll back.',
      },
    ],
  },
};

/** Where each tour can be replayed from (Help → Guide). */
export const TOUR_PAGES: { key: string; label: string; hash: string }[] = [
  { key: 'dashboard', label: 'Home', hash: '#/dashboard' },
  { key: 'curriculum', label: 'Study plan', hash: '#/curriculum' },
  { key: 'simulator/mcq', label: 'Practice questions', hash: '#/simulator/mcq' },
  { key: 'simulator/dax', label: 'DAX builder', hash: '#/simulator/dax' },
  { key: 'simulator/powerquery', label: 'Step order', hash: '#/simulator/powerquery' },
  { key: 'simulator/pqlab', label: 'Power Query lab', hash: '#/simulator/pqlab' },
  { key: 'simulator/casestudy', label: 'Case studies', hash: '#/simulator/casestudy' },
  { key: 'matrix/dax', label: 'DAX cheat sheet', hash: '#/matrix/dax' },
  { key: 'matrix/pq', label: 'Power Query guides', hash: '#/matrix/pq' },
  { key: 'flashcards', label: 'Flashcards', hash: '#/flashcards' },
  { key: 'help/devices', label: 'Link devices', hash: '#/help/devices' },
];

const SEEN_KEY = 'pl300_tours_seen_v1';

function readSeen(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function tourDue(key: string): boolean {
  const tour = TOURS[key];
  return Boolean(tour) && (readSeen()[key] ?? 0) < tour.rev;
}

export function markTourSeen(key: string) {
  const tour = TOURS[key];
  if (!tour) return;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ ...readSeen(), [key]: tour.rev }));
  } catch {
    /* storage blocked: the tour just shows again next time */
  }
}

/** Skipping turns off every tour (they stay available from Help → Guide). */
export function markAllToursSeen() {
  const all: Record<string, number> = {};
  for (const [k, t] of Object.entries(TOURS)) all[k] = t.rev;
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch {
    /* storage blocked */
  }
}

export function resetTour(key: string) {
  const seen = readSeen();
  delete seen[key];
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    /* storage blocked */
  }
}
