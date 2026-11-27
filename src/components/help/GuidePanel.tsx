import React from 'react';
import { PlayCircle } from 'lucide-react';
import { TOUR_PAGES } from '../../data/tours';

interface Props {
  onReplayTour: (key: string, hash: string) => void;
  onOpenDevices: () => void;
}

interface Section {
  id: string;
  title: string;
  tours?: string[];             // tour keys this section can replay
  body: React.ReactNode;
}

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm leading-relaxed text-slate-300">{children}</p>
);
const B: React.FC<{ children: React.ReactNode }> = ({ children }) => <strong className="font-bold text-white">{children}</strong>;
const List: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="space-y-1.5 pl-1">
    {items.map((it, i) => (
      <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

const SECTIONS = (openDevices: () => void): Section[] => [
  {
    id: 'start',
    title: 'Getting started',
    tours: ['dashboard'],
    body: (
      <>
        <P>
          PL-300 Studio prepares you for Microsoft’s Power BI Data Analyst exam (PL-300). It runs entirely in your
          browser: there’s nothing to install and no account. A sensible order for a first week:
        </P>
        <List
          items={[
            <>Read a module in the <B>Study plan</B> and tick the skills you could explain to someone.</>,
            <>Answer that domain’s <B>practice questions</B> in Study mode, and read the explanations.</>,
            <>Do the matching <B>lab</B>: Power Query for Prepare the Data, DAX for Model the Data.</>,
            <>Review <B>flashcards</B> for ten minutes a day.</>,
            <>Once a week, sit a <B>timed exam</B> and a <B>case study</B> to see where you really are.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'score',
    title: 'Your readiness score',
    body: (
      <>
        <P>
          Home shows a simulated score out of 1000. Like the real exam, <B>700 is the pass mark</B>. It’s worked out in two
          steps.
        </P>
        <P>
          <B>Mastery per domain.</B> Each of the four exam domains gets a percentage: 35% from the skills you’ve ticked,
          45% from practice questions answered correctly, and 20% from its labs (Power Query labs count for Prepare the
          Data, DAX challenges for Model the Data and Manage and Secure).
        </P>
        <P>
          <B>The score.</B> The four masteries are weighted like the exam (27.5% each for Prepare, Model and Visualize,
          17.5% for Manage and Secure) and make up 80% of the score. Case studies add 12% and matrix drills 8%.
        </P>
        <P>
          The domain with the lowest mastery is shown as <B>your weakest area</B>, with a shortcut to practise just that
          domain. Aim to get all four bars past the 70% line before booking the exam.
        </P>
      </>
    ),
  },
  {
    id: 'study',
    title: 'Study plan',
    tours: ['curriculum'],
    body: (
      <>
        <P>
          The Study plan follows Microsoft Learn’s PL-300 learning path, one card per module, plus a hand-picked list of
          videos.
        </P>
        <List
          items={[
            <><B>Tick skills</B> as you learn them. They count towards your mastery, so be honest.</>,
            <><B>Open on Learn</B> takes you to the official module.</>,
            <><B>Details</B> shows the exam traps for that module, the DAX or M patterns to know, and a notes box that saves as you type.</>,
            <><B>Videos</B> can be filtered by domain and marked as watched.</>,
            <>Use the domain buttons or the search box to narrow everything down.</>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'practice',
    title: 'Practice',
    tours: ['simulator/mcq', 'simulator/dax', 'simulator/powerquery', 'simulator/pqlab', 'simulator/casestudy'],
    body: (
      <>
        <P>Five ways to practise, each in its own tab:</P>
        <List
          items={[
            <>
              <B>Practice questions.</B> Scenario questions written like the exam’s. Study mode marks each answer straight
              away and explains it. Timed exam gives you 90 seconds a question, hides the answers and marks everything at
              the end (or when time runs out). Filter by domain and difficulty; options are shuffled each time.
            </>,
            <>
              <B>DAX builder.</B> Eight measures with gaps. Pick a slot, then the function that goes there, and Check
              formula. Run it on sample data evaluates your measure on a small Sales, Product, Customer and Date model with
              the databites DAX engine, and compares it with the reference answer. You can also switch to Write it
              myself and type the whole measure.
            </>,
            <>
              <B>Step order.</B> Put Power Query steps in the right order to turn the source into the target, and learn
              which steps fold back to the source.
            </>,
            <>
              <B>Power Query lab.</B> Eight messy datasets and a working imitation of the Power Query Editor: select
              columns, use the ribbon, and watch the applied steps and the M code build up. Check compares your table with
              the target. Download the CSV to repeat it in Power BI Desktop.
            </>,
            <>
              <B>Case studies.</B> Several tabs of exhibits and a set of questions, like the exam’s case study section.
              Highlight evidence shows which line of the exhibits answers the question.
            </>,
          ]}
        />
        <P>Show solution is always there, but a lab only counts as done when you get it right without it.</P>
      </>
    ),
  },
  {
    id: 'guides',
    title: 'Guides & cheat sheets',
    tours: ['matrix/dax', 'matrix/pq'],
    body: (
      <List
        items={[
          <><B>DAX cheat sheet.</B> Every function the exam tests, with syntax, an example and the trap to avoid, plus the patterns worth memorising. The copy button puts the code on your clipboard.</>,
          <><B>Power Query guides.</B> How to do each common task, step by step, on a drawing of the Power Query Editor with the button for each step highlighted.</>,
          <><B>Matrix drills.</B> Quick-fire scenarios on workspace roles, storage modes, RLS and choosing visuals. Your best streak counts towards the score.</>,
          <><B>Reference tables.</B> Roles, storage modes and filter modifiers side by side.</>,
        ]}
      />
    ),
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    tours: ['flashcards'],
    body: (
      <>
        <P>
          Flashcards use four boxes. Flip a card (Space, or click it), then say how well you knew it: <B>Again</B> puts it
          in box 1, <B>Hard</B> in box 2, <B>Good</B> in box 3 and <B>Easy</B> in box 4. Boxes 1 and 2 are your review
          pile; boxes 3 and 4 count as mastered on Home.
        </P>
        <P>
          Use To review to go through only the cards you’re shaky on. Add your own cards with New card; they’re saved and
          synced like everything else. Arrow keys move between cards.
        </P>
      </>
    ),
  },
  {
    id: 'progress',
    title: 'Your progress and other devices',
    tours: ['help/devices'],
    body: (
      <>
        <P>
          Everything you do is saved in this browser as you go. Clearing your browser’s site data would delete it, so
          either keep a backup file or turn on sync.
        </P>
        <P>
          <B>Sync</B> links your devices with a sync code instead of an account. Each save from any device becomes a
          new numbered version, so two devices never overwrite each other, and you can roll back to any of the last 15.{' '}
          <button onClick={openDevices} className="font-semibold text-accent-ink underline-offset-2 hover:underline">
            Set it up under Link devices
          </button>
          , where there’s a step-by-step guide and answers to common questions.
        </P>
      </>
    ),
  },
  {
    id: 'keys',
    title: 'Keyboard shortcuts',
    body: (
      <List
        items={[
          <><B>Flashcards:</B> Space flips, ← and → move between cards.</>,
          <><B>Walkthroughs:</B> → and ← step through, Esc closes.</>,
          <><B>Everywhere:</B> Tab moves between controls, and Enter or Space presses the focused one.</>,
        ]}
      />
    ),
  },
];

export const GuidePanel: React.FC<Props> = ({ onReplayTour, onOpenDevices }) => {
  const sections = SECTIONS(onOpenDevices);
  const label = (key: string) => TOUR_PAGES.find((t) => t.key === key);

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Guide contents" className="hidden lg:block">
        <div className="sticky top-20 space-y-0.5">
          <p className="px-3 pb-1 text-xs font-bold text-slate-500">Contents</p>
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#guide-${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(`guide-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="block rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      <div className="min-w-0 space-y-4">
        {sections.map((s) => (
          <section
            key={s.id}
            id={`guide-${s.id}`}
            className="scroll-mt-20 rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <h2 className="text-lg font-extrabold text-white">{s.title}</h2>
            <div className="mt-3 space-y-3">{s.body}</div>
            {s.tours && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                {s.tours.map((key) => {
                  const page = label(key);
                  if (!page) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => onReplayTour(key, page.hash)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-600"
                    >
                      <PlayCircle className="h-3.5 w-3.5 text-accent-ink" />
                      Show me {page.label}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};
