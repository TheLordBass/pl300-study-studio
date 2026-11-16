import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Brain,
  Flame,
  LayoutDashboard,
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
import { DashboardView } from './components/DashboardView';
import { CurriculumHubView } from './components/CurriculumHubView';
import { ExamSimulatorView } from './components/ExamSimulatorView';
import { CheatSheetMatrixView } from './components/CheatSheetMatrixView';
import { FlashcardsView } from './components/FlashcardsView';

const NAV_ITEMS: {
  id: MainTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'curriculum', label: 'Curriculum & Videos', icon: BookOpen },
  { id: 'simulator', label: 'Exam Simulator', icon: Target },
  { id: 'matrix', label: 'Matrix & Cheat Sheets', icon: Flame },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
];

export function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [simSubTab, setSimSubTab] = useState<SimulatorSubTab>('mcq');
  const [domainFilter, setDomainFilter] = useState<DomainId | 'all'>('all');

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const handleNavigateTab = (
    tab: MainTab,
    subTab?: SimulatorSubTab,
    filter?: DomainId | 'all'
  ) => {
    setActiveTab(tab);
    if (subTab) setSimSubTab(subTab);
    if (filter !== undefined) setDomainFilter(filter);
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
    setProgress((prev) => ({
      ...prev,
      customFlashcards: prev.customFlashcards.filter((c) => c.id !== cardId),
    }));
  };

  const resetProgress = () => {
    setProgress(INITIAL_PROGRESS);
  };

  const readinessScore = computeReadinessScore(
    computeDomainAnalytics(progress),
    progress
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigateTab('dashboard')}
              className="flex items-center gap-2.5 text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-extrabold tracking-tight text-white">
                  PL-300 Studio
                </div>
                <div className="text-[11px] text-slate-400">
                  Power BI Data Analyst Exam Prep
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs lg:hidden">
              <span className="text-slate-400">Score:</span>
              <span
                className={`font-bold ${
                  readinessScore >= 700 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {readinessScore}/1000
              </span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs lg:flex">
            <span className="text-slate-400">Readiness:</span>
            <span
              className={`font-extrabold ${
                readinessScore >= 700 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {readinessScore} / 1000
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
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
            onRecordCaseStudyScore={recordCaseStudyScore}
          />
        )}

        {activeTab === 'matrix' && (
          <CheatSheetMatrixView
            progress={progress}
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
  );
}

export default App;
