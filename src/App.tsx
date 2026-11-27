import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Brain,
  CircleHelp,
  Flame,
  LayoutDashboard,
  Moon,
  Sun,
  Target,
} from 'lucide-react';
import {
  DomainId,
  Flashcard,
  MainTab,
  SimulatorSubTab,
  UserProgress,
} from './types/pl300';
import {
  INITIAL_PROGRESS,
  computeDomainAnalytics,
  computeReadinessScore,
  loadProgress,
  saveProgress,
} from './utils/progressHelpers';
import { useTheme } from './utils/theme';
import { DashboardView } from './components/DashboardView';
import { CurriculumHubView } from './components/CurriculumHubView';
import { ExamSimulatorView } from './components/ExamSimulatorView';
import { CheatSheetMatrixView, GuideSection } from './components/CheatSheetMatrixView';
import { FlashcardsView } from './components/FlashcardsView';
import { HELP_SECTIONS, HelpSection, HelpView } from './components/help/HelpView';
import { Tour } from './components/Tour';
import { readSeenVersion, releasesSince, WhatsNew, writeSeenVersion } from './components/WhatsNew';
import { resetTour, tourDue } from './data/tours';
import { cloudSync } from './sync/engine';
import { isEmptyProgress } from './sync/merge';
import { useSyncStatus } from './sync/useSyncStatus';
import { APP_VERSION, CHANGELOG, Release } from './version';

const NAV_ITEMS: {
  id: MainTab;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Home', short: 'Home', icon: LayoutDashboard },
  { id: 'curriculum', label: 'Study plan', short: 'Study', icon: BookOpen },
  { id: 'simulator', label: 'Practice', short: 'Practice', icon: Target },
  { id: 'matrix', label: 'Guides & cheat sheets', short: 'Guides', icon: Flame },
  { id: 'flashcards', label: 'Flashcards', short: 'Cards', icon: Brain },
];

const TABS: MainTab[] = [...NAV_ITEMS.map((n) => n.id), 'help'];
const SUB_TABS: SimulatorSubTab[] = ['mcq', 'dax', 'powerquery', 'pqlab', 'casestudy'];

const GUIDE_SECTIONS: GuideSection[] = ['dax', 'pq', 'drills', 'cheatsheets'];

/** Read "#/simulator/dax" or "#/matrix/pq" style hashes so refreshes and links keep the page. */
function readHash(): { tab: MainTab; sub?: SimulatorSubTab; guide?: GuideSection; help?: HelpSection } {
  const [tab, sub] = window.location.hash.replace(/^#\/?/, '').split('/');
  const main = TABS.includes(tab as MainTab) ? (tab as MainTab) : 'dashboard';
  return {
    tab: main,
    sub: main === 'simulator' && SUB_TABS.includes(sub as SimulatorSubTab) ? (sub as SimulatorSubTab) : undefined,
    guide: main === 'matrix' && GUIDE_SECTIONS.includes(sub as GuideSection) ? (sub as GuideSection) : undefined,
    help: main === 'help' && HELP_SECTIONS.includes(sub as HelpSection) ? (sub as HelpSection) : undefined,
  };
}

/** Releases to announce on this visit: none for a brand-new user (the walkthrough covers them). */
function initialWhatsNew(progress: UserProgress): Release[] {
  const seen = readSeenVersion();
  if (seen === null) {
    // No record: someone new, or someone from before 2.0 (which didn't record it).
    if (isEmptyProgress(progress)) {
      writeSeenVersion(APP_VERSION);
      return [];
    }
    return CHANGELOG.slice(0, 1);
  }
  return releasesSince(seen);
}

export function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<MainTab>(() => readHash().tab);
  const [simSubTab, setSimSubTab] = useState<SimulatorSubTab>(() => readHash().sub ?? 'mcq');
  const [guideSection, setGuideSection] = useState<GuideSection>(() => readHash().guide ?? 'dax');
  const [helpSection, setHelpSection] = useState<HelpSection>(() => readHash().help ?? 'guide');
  const [whatsNew, setWhatsNew] = useState<Release[]>(() => initialWhatsNew(progress));
  const [activeTour, setActiveTour] = useState<string | null>(null);
  const sync = useSyncStatus();
  const [domainFilter, setDomainFilter] = useState<DomainId | 'all'>('all');
  // Which tab the Study plan opens on: the modules when a link asks for one domain’s, else the plan.
  const [curSection, setCurSection] = useState<'plan' | 'modules'>('plan');
  const [theme, toggleTheme] = useTheme();

  // Sync reads the latest progress through a ref, and can put a new copy in place.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  useEffect(() => {
    cloudSync.start(
      () => progressRef.current,
      (next) => {
        progressRef.current = next;
        setProgress(next);
      }
    );
  }, []);

  useEffect(() => {
    saveProgress(progress);
    cloudSync.changed();
  }, [progress]);

  // Keep the URL hash in sync with the current view.
  useEffect(() => {
    const next =
      activeTab === 'simulator'
        ? `#/simulator/${simSubTab}`
        : activeTab === 'matrix'
        ? `#/matrix/${guideSection}`
        : activeTab === 'help'
        ? `#/help/${helpSection}`
        : `#/${activeTab}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [activeTab, simSubTab, guideSection, helpSection]);

  // The page's walkthrough, the first time it's opened (after any What's new note).
  const pageKey =
    activeTab === 'simulator'
      ? `simulator/${simSubTab}`
      : activeTab === 'matrix'
      ? `matrix/${guideSection}`
      : activeTab === 'help'
      ? `help/${helpSection}`
      : activeTab;
  useEffect(() => {
    if (activeTour || whatsNew.length || !tourDue(pageKey)) return;
    const t = setTimeout(() => setActiveTour(pageKey), 700);
    return () => clearTimeout(t);
  }, [pageKey, activeTour, whatsNew.length]);

  const closeTour = useCallback(() => setActiveTour(null), []);
  const closeWhatsNew = useCallback(() => {
    writeSeenVersion(APP_VERSION);
    setWhatsNew([]);
  }, []);

  useEffect(() => {
    const onHash = () => {
      const { tab, sub, guide, help } = readHash();
      setActiveTab(tab);
      if (sub) setSimSubTab(sub);
      if (guide) setGuideSection(guide);
      if (help) setHelpSection(help);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleNavigateTab = (
    tab: MainTab,
    subTab?: SimulatorSubTab,
    filter?: DomainId | 'all'
  ) => {
    setActiveTab(tab);
    if (subTab) setSimSubTab(subTab);
    if (filter !== undefined) setDomainFilter(filter);
    if (tab === 'curriculum') setCurSection(filter && filter !== 'all' ? 'modules' : 'plan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSkill = (skillId: string) => {
    setProgress((prev) => ({
      ...prev,
      completedSkills: prev.completedSkills.includes(skillId)
        ? prev.completedSkills.filter((id) => id !== skillId)
        : [...prev.completedSkills, skillId],
    }));
  };

  const toggleVideo = (videoId: string) => {
    setProgress((prev) => ({
      ...prev,
      watchedVideos: prev.watchedVideos.includes(videoId)
        ? prev.watchedVideos.filter((id) => id !== videoId)
        : [...prev.watchedVideos, videoId],
    }));
  };

  const updateModuleNote = (moduleId: string, note: string) => {
    setProgress((prev) => ({
      ...prev,
      moduleNotes: { ...prev.moduleNotes, [moduleId]: note },
    }));
  };

  const recordMcq = (questionId: string, correct: boolean) => {
    setProgress((prev) => {
      const existing = prev.mcqHistory[questionId];
      return {
        ...prev,
        mcqHistory: {
          ...prev.mcqHistory,
          [questionId]: {
            correct,
            attempts: (existing?.attempts ?? 0) + 1,
            lastAnswered: Date.now(),
          },
        },
      };
    });
  };

  const markDaxCompleted = (challengeId: string) => {
    setProgress((prev) =>
      prev.daxCompleted.includes(challengeId)
        ? prev
        : { ...prev, daxCompleted: [...prev.daxCompleted, challengeId] }
    );
  };

  const markPqCompleted = (challengeId: string) => {
    setProgress((prev) =>
      prev.pqCompleted.includes(challengeId)
        ? prev
        : { ...prev, pqCompleted: [...prev.pqCompleted, challengeId] }
    );
  };

  const markPqLabCompleted = (scenarioId: string) => {
    setProgress((prev) =>
      prev.pqLabCompleted.includes(scenarioId)
        ? prev
        : { ...prev, pqLabCompleted: [...prev.pqLabCompleted, scenarioId] }
    );
  };

  const recordCaseStudyScore = (caseStudyId: string, score: number) => {
    setProgress((prev) => ({
      ...prev,
      caseStudyScores: {
        ...prev.caseStudyScores,
        [caseStudyId]: Math.max(prev.caseStudyScores[caseStudyId] ?? 0, score),
      },
    }));
  };

  const recordMatrixDrill = (correct: boolean, streak: number) => {
    setProgress((prev) => ({
      ...prev,
      matrixStats: {
        total: prev.matrixStats.total + 1,
        correct: prev.matrixStats.correct + (correct ? 1 : 0),
        bestStreak: Math.max(prev.matrixStats.bestStreak, streak),
      },
    }));
  };

  const rateFlashcard = (cardId: string, box: number) => {
    setProgress((prev) => ({
      ...prev,
      flashcardRatings: {
        ...prev.flashcardRatings,
        [cardId]: { box, lastReviewed: Date.now() },
      },
    }));
  };

  const addCustomFlashcard = (card: Omit<Flashcard, 'id'>) => {
    const newCard: Flashcard = {
      ...card,
      id: `custom-${Date.now()}`,
    };
    setProgress((prev) => ({
      ...prev,
      customFlashcards: [newCard, ...prev.customFlashcards],
    }));
  };

  const deleteCustomFlashcard = (cardId: string) => {
    setProgress((prev) => {
      // Drop the card's rating too, so it no longer counts as "mastered".
      const { [cardId]: _removed, ...ratings } = prev.flashcardRatings;
      void _removed;
      return {
        ...prev,
        customFlashcards: prev.customFlashcards.filter((c) => c.id !== cardId),
        flashcardRatings: ratings,
      };
    });
  };

  const updateStudyPlan = (patch: Partial<UserProgress['studyPlan']>) => {
    setProgress((prev) => ({ ...prev, studyPlan: { ...prev.studyPlan, ...patch, at: Date.now() } }));
  };

  const togglePlanTask = (taskId: string) => {
    setProgress((prev) => {
      const done = prev.studyPlan.done;
      return {
        ...prev,
        studyPlan: {
          ...prev.studyPlan,
          done: done.includes(taskId) ? done.filter((id) => id !== taskId) : [...done, taskId],
        },
      };
    });
  };

  /** Go to a page by its hash (from a study plan task), optionally filtered to a domain. */
  const openFromPlan = (hash: string, domain?: DomainId) => {
    if (domain) setDomainFilter(domain);
    window.location.hash = hash;
    window.scrollTo({ top: 0 });
  };

  const resetProgress = () => {
    setProgress(INITIAL_PROGRESS);
  };


  const readinessScore = computeReadinessScore(
    computeDomainAnalytics(progress),
    progress
  );
  const isPassing = readinessScore >= 700;
  const pageLabel = activeTab === 'help' ? 'Help' : NAV_ITEMS.find((n) => n.id === activeTab)!.label;

  /** Opens a page by its hash and replays its walkthrough. */
  const replayTour = (key: string, hash: string) => {
    resetTour(key);
    setActiveTour(null);
    window.location.hash = hash;
    window.scrollTo({ top: 0 });
  };
  const themeLabel = theme === 'light' ? 'Dark theme' : 'Light theme';

  /** A rail button with a label that slides out on hover or keyboard focus. */
  const RailTip: React.FC<{ label: string }> = ({ label }) => (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-950 opacity-0 shadow-lg transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );

  return (
    <div className="min-h-screen text-slate-100">
      {/* ===== Icon rail (tablet & desktop) ===== */}
      <aside
        aria-label="Main navigation"
        className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center border-r border-slate-800 bg-slate-900 py-4 md:flex"
      >
        <button
          onClick={() => handleNavigateTab('dashboard')}
          aria-label="PL-300 Studio home"
          className="group relative mb-6"
        >
          <LogoMark />
          <RailTip label="PL-300 Studio" />
        </button>

        <nav className="flex flex-1 flex-col items-center gap-2" data-tour="nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigateTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                  isActive
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-[22px] w-[22px]" />
                <RailTip label={item.label} />
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => handleNavigateTab('help')}
            aria-label="Help and linked devices"
            aria-current={activeTab === 'help' ? 'page' : undefined}
            data-tour="help"
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition ${
              activeTab === 'help' ? 'bg-accent text-on-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CircleHelp className="h-5 w-5" />
            <SyncDot on={sync.on} error={Boolean(sync.error)} />
            <RailTip label={sync.on ? (sync.error ? 'Help · sync needs attention' : 'Help · devices linked') : 'Help & link devices'} />
          </button>
          <button
            onClick={() => handleNavigateTab('dashboard')}
            aria-label={`Readiness ${readinessScore} of 1000`}
            className="group relative flex h-12 w-12 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950"
          >
            <span className={`text-sm font-black tabular-nums leading-none ${isPassing ? 'text-emerald-300' : 'text-white'}`}>
              {readinessScore}
            </span>
            <span className="mt-1 h-1 w-7 overflow-hidden rounded-full bg-slate-800">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${readinessScore / 10}%` }} />
            </span>
            <RailTip label="Exam readiness (700 to pass)" />
          </button>
          <button
            onClick={toggleTheme}
            aria-label={themeLabel}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <RailTip label={themeLabel} />
          </button>
        </div>
      </aside>

      <div className="md:pl-[76px]">
        {/* ===== Top bar ===== */}
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
            {/* Phones: logo; tablet & desktop: page title */}
            <button
              onClick={() => handleNavigateTab('dashboard')}
              className="flex items-center gap-2.5 md:hidden"
              aria-label="PL-300 Studio home"
            >
              <LogoMark />
              <span className="text-[17px] font-extrabold tracking-tight text-white">PL-300 Studio</span>
            </button>
            <p className="hidden min-w-0 truncate text-sm md:block">
              <span className="font-extrabold text-white">PL-300 Studio</span>
              <span className="mx-2 text-slate-600">/</span>
              <span className="font-semibold text-slate-400">{pageLabel}</span>
            </p>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 md:hidden"
                title="Simulated readiness score — 700 is the pass mark"
              >
                <span className="hidden text-xs font-semibold text-slate-400 sm:block">Readiness</span>
                <span className="text-base font-black tabular-nums text-white">{readinessScore}</span>
                <span className="relative hidden h-2 w-20 overflow-hidden rounded-full bg-slate-800 sm:block">
                  <span
                    className={`absolute inset-y-0 left-0 rounded-full ${isPassing ? 'bg-emerald-400' : 'bg-accent'}`}
                    style={{ width: `${readinessScore / 10}%` }}
                  />
                  <span className="absolute inset-y-0 left-[70%] w-0.5 bg-slate-100" />
                </span>
              </div>
              <button
                onClick={() => handleNavigateTab('help')}
                aria-label="Help and linked devices"
                title="Help & link devices"
                data-tour="help"
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition md:hidden ${
                  activeTab === 'help' ? 'border-accent bg-accent text-on-accent' : 'border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <CircleHelp className="h-4 w-4" />
                <SyncDot on={sync.on} error={Boolean(sync.error)} />
              </button>
              <button
                onClick={toggleTheme}
                aria-label={themeLabel}
                title={themeLabel}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 text-slate-300 transition hover:text-white md:hidden"
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        <main
          key={activeTab}
          className="mx-auto max-w-7xl animate-rise px-4 pb-28 pt-6 sm:px-6 md:pb-14"
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              progress={progress}
              onNavigateTab={handleNavigateTab}
              onOpenDevices={() => {
                setHelpSection('devices');
                handleNavigateTab('help');
              }}
            />
          )}

          {activeTab === 'curriculum' && (
            <CurriculumHubView
              progress={progress}
              selectedDomainFilter={domainFilter}
              onChangeDomainFilter={setDomainFilter}
              onToggleSkill={toggleSkill}
              onToggleVideo={toggleVideo}
              onUpdateModuleNote={updateModuleNote}
              initialSection={curSection}
              readinessScore={readinessScore}
              onUpdatePlan={updateStudyPlan}
              onTogglePlanTask={togglePlanTask}
              onOpen={openFromPlan}
            />
          )}

          {activeTab === 'simulator' && (
            <ExamSimulatorView
              progress={progress}
              activeSubTab={simSubTab}
              domainFilter={domainFilter}
              onChangeSubTab={setSimSubTab}
              onChangeDomainFilter={setDomainFilter}
              onRecordMcq={recordMcq}
              onMarkDaxCompleted={markDaxCompleted}
              onMarkPqCompleted={markPqCompleted}
              onMarkPqLabCompleted={markPqLabCompleted}
              onRecordCaseStudyScore={recordCaseStudyScore}
            />
          )}

          {activeTab === 'matrix' && (
            <CheatSheetMatrixView
              progress={progress}
              subMode={guideSection}
              onChangeSubMode={setGuideSection}
              onNavigate={(t) => handleNavigateTab('simulator', t)}
              onRecordMatrixDrill={recordMatrixDrill}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsView
              progress={progress}
              onRateFlashcard={rateFlashcard}
              onAddCustomFlashcard={addCustomFlashcard}
              onDeleteCustomFlashcard={deleteCustomFlashcard}
            />
          )}

          {activeTab === 'help' && (
            <HelpView
              section={helpSection}
              onChangeSection={setHelpSection}
              progress={progress}
              onReplaceProgress={setProgress}
              onReplayTour={replayTour}
              onShowWhatsNew={() => setWhatsNew(CHANGELOG.slice(0, 1))}
              onResetProgress={resetProgress}
            />
          )}
        </main>
      </div>

      {whatsNew.length > 0 && (
        <WhatsNew
          releases={whatsNew}
          onClose={closeWhatsNew}
          onOpen={(hash) => {
            closeWhatsNew();
            window.location.hash = hash;
          }}
        />
      )}
      {activeTour && <Tour key={activeTour} tourKey={activeTour} onDone={closeTour} />}

      {/* ===== Phone bottom navigation ===== */}
      <nav
        aria-label="Main"
        data-tour="nav"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigateTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] font-bold ${
                  isActive ? 'text-accent-ink' : 'text-slate-400'
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-xl transition ${
                    isActive ? 'bg-accent text-on-accent' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {item.short}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** A small dot on the Help button: green when devices are linked, red when sync needs a look. */
function SyncDot({ on, error }: { on: boolean; error: boolean }) {
  if (!on && !error) return null;
  return (
    <span
      aria-hidden="true"
      className={`absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-slate-900 ${error ? 'bg-rose-400' : 'bg-emerald-400'}`}
    />
  );
}

/** Green tile with three cream bars — a tiny column chart. */
function LogoMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9 shrink-0" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="var(--color-accent)" />
      <rect x="5" y="12" width="3.2" height="7" rx="1.2" fill="var(--color-on-accent)" />
      <rect x="10.4" y="8" width="3.2" height="11" rx="1.2" fill="var(--color-on-accent)" />
      <rect x="15.8" y="4.5" width="3.2" height="14.5" rx="1.2" fill="var(--color-on-accent)" />
    </svg>
  );
}

export default App;
