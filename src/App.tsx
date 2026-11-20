import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Brain,
  Flame,
  LayoutDashboard,
  Menu,
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
import { Sparkle } from './components/ui/Sparkle';
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
const SIDEBAR_KEY = 'pl300_sidebar_collapsed';

/** Read "#/simulator/dax" style hashes so refreshes and shared links keep the page. */
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
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });

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

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, c ? '0' : '1');
      } catch {
        // ignore
      }
      return !c;
    });
  };

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

  const ThemeButton = (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme === 'light' ? 'Dark theme' : 'Light theme'}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 hover:text-white"
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ===== Desktop sidebar ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-slate-900 transition-[width] duration-300 lg:flex ${
          collapsed ? 'w-[76px]' : 'w-[272px]'
        }`}
      >
        <div className="flex h-16 items-center gap-1 px-4">
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          {!collapsed && (
            <button
              onClick={() => handleNavigateTab('dashboard')}
              className="flex items-center gap-2 truncate rounded-full px-2 py-1 text-left"
            >
              <span className="text-lg font-medium tracking-tight text-white">PL-300</span>
              <span className="text-lg font-medium tracking-tight gemini-text">Studio</span>
            </button>
          )}
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigateTab(item.id)}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-12 w-full items-center gap-4 rounded-full text-sm font-medium transition ${
                  collapsed ? 'justify-center px-0' : 'px-4'
                } ${
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Readiness mini card */}
        <div className="space-y-2 p-3">
          {!collapsed ? (
            <button
              onClick={() => handleNavigateTab('dashboard')}
              className="block w-full rounded-3xl bg-slate-950/60 p-4 text-left transition hover:bg-slate-800"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Sparkle className="h-3.5 w-3.5" />
                Exam readiness
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className={`text-2xl font-semibold ${
                    isPassing ? 'text-emerald-300' : 'text-white'
                  }`}
                >
                  {readinessScore}
                </span>
                <span className="text-xs text-slate-500">/ 1000</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full gemini-bg transition-all duration-700"
                  style={{ width: `${readinessScore / 10}%` }}
                />
              </div>
            </button>
          ) : (
            <div
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/60 text-[11px] font-semibold text-white"
              title={`Readiness ${readinessScore} / 1000`}
            >
              {readinessScore}
            </div>
          )}
          <div className={`flex ${collapsed ? 'justify-center' : 'justify-start px-1'}`}>
            {ThemeButton}
          </div>
        </div>
      </aside>

      {/* ===== Main column ===== */}
      <div
        className={`transition-[padding] duration-300 ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[272px]'
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                onClick={() => handleNavigateTab('dashboard')}
                className="flex items-center gap-2 lg:hidden"
                aria-label="PL-300 Studio home"
              >
                <Sparkle className="h-6 w-6" />
                <span className="text-base font-medium tracking-tight text-white">
                  PL-300 <span className="gemini-text">Studio</span>
                </span>
              </button>
              <h1 className="hidden truncate text-lg font-normal text-slate-200 lg:block">
                {activeItem.label}
              </h1>
            </div>

            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center gap-2 rounded-full bg-slate-900 px-3.5 py-2 text-xs"
                title="Simulated readiness score (700 to pass)"
              >
                <Sparkle className="h-3.5 w-3.5" />
                <span className="hidden text-slate-400 sm:inline">Readiness</span>
                <span className={`font-semibold ${isPassing ? 'text-emerald-300' : 'text-white'}`}>
                  {readinessScore}
                </span>
              </div>
              <div className="lg:hidden">{ThemeButton}</div>
            </div>
          </div>
        </header>

        <main
          key={activeTab}
          className="mx-auto max-w-7xl animate-rise px-4 pb-28 pt-4 sm:px-6 lg:pb-12"
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

      {/* ===== Mobile bottom navigation ===== */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-900/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigateTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                    isActive ? 'bg-accent/20 text-accent' : 'text-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.short}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default App;
