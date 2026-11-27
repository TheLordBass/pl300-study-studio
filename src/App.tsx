import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Brain,
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

const NAV_ITEMS: {
  id: MainTab;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Home', short: 'Home', icon: LayoutDashboard },
  { id: 'curriculum', label: 'Curriculum & Videos', short: 'Learn', icon: BookOpen },
  { id: 'simulator', label: 'Exam Simulator', short: 'Exam', icon: Target },
  { id: 'matrix', label: 'Cheat Sheets & Guides', short: 'Guides', icon: Flame },
  { id: 'flashcards', label: 'Flashcards', short: 'Cards', icon: Brain },
];

const TABS: MainTab[] = NAV_ITEMS.map((n) => n.id);
const SUB_TABS: SimulatorSubTab[] = ['mcq', 'dax', 'powerquery', 'pqlab', 'casestudy'];

const GUIDE_SECTIONS: GuideSection[] = ['dax', 'pq', 'drills', 'cheatsheets'];

/** Read "#/simulator/dax" or "#/matrix/pq" style hashes so refreshes and links keep the page. */
function readHash(): { tab: MainTab; sub?: SimulatorSubTab; guide?: GuideSection } {
  const [tab, sub] = window.location.hash.replace(/^#\/?/, '').split('/');
  const main = TABS.includes(tab as MainTab) ? (tab as MainTab) : 'dashboard';
  return {
    tab: main,
    sub: main === 'simulator' && SUB_TABS.includes(sub as SimulatorSubTab) ? (sub as SimulatorSubTab) : undefined,
    guide: main === 'matrix' && GUIDE_SECTIONS.includes(sub as GuideSection) ? (sub as GuideSection) : undefined,
  };
}

export function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<MainTab>(() => readHash().tab);
  const [simSubTab, setSimSubTab] = useState<SimulatorSubTab>(() => readHash().sub ?? 'mcq');
  const [guideSection, setGuideSection] = useState<GuideSection>(() => readHash().guide ?? 'dax');
  const [domainFilter, setDomainFilter] = useState<DomainId | 'all'>('all');
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Keep the URL hash in sync with the current view.
  useEffect(() => {
    const next =
      activeTab === 'simulator'
        ? `#/simulator/${simSubTab}`
        : activeTab === 'matrix'
        ? `#/matrix/${guideSection}`
        : `#/${activeTab}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next);
    }
  }, [activeTab, simSubTab, guideSection]);

  useEffect(() => {
    const onHash = () => {
      const { tab, sub, guide } = readHash();
      setActiveTab(tab);
      if (sub) setSimSubTab(sub);
      if (guide) setGuideSection(guide);
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

  const resetProgress = () => {
    setProgress(INITIAL_PROGRESS);
  };


  const readinessScore = computeReadinessScore(
    computeDomainAnalytics(progress),
    progress
  );
  const isPassing = readinessScore >= 700;
  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab)!;
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

        <nav className="flex flex-1 flex-col items-center gap-2">
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
            <h2 className="hidden truncate text-lg font-extrabold text-white md:block">{activeItem.label}</h2>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5"
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
              onImportProgress={setProgress}
              onResetProgress={resetProgress}
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
        </main>
      </div>

      {/* ===== Phone bottom navigation ===== */}
      <nav
        aria-label="Main"
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
