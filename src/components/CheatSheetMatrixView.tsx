import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Code2,
  Flame,
  Lightbulb,
  MousePointerClick,
  ShieldAlert,
  Table2,
  XCircle,
} from 'lucide-react';
import { DaxCheatSheetView } from './guides/DaxCheatSheetView';
import { PqGuidesView } from './guides/PqGuidesView';
import { MatrixCategory, UserProgress } from '../types/pl300';
import {
  DAX_MODIFIER_MATRIX,
  MATRIX_DRILLS,
  STORAGE_MODE_MATRIX,
  WORKSPACE_ROLE_MATRIX,
} from '../data/matrixAndFlashcardsData';

export type GuideSection = 'dax' | 'pq' | 'drills' | 'cheatsheets';

interface CheatSheetMatrixViewProps {
  progress: UserProgress;
  subMode: GuideSection;
  onChangeSubMode: (s: GuideSection) => void;
  onNavigate: (simulatorTab: 'dax' | 'pqlab') => void;
  onRecordMatrixDrill: (correct: boolean, streak: number) => void;
}

const SECTIONS: { id: GuideSection; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dax', label: 'DAX cheat sheet', desc: 'Functions, patterns & traps', icon: Code2 },
  { id: 'pq', label: 'Power Query guides', desc: 'How to & where to click', icon: MousePointerClick },
  { id: 'drills', label: 'Matrix drills', desc: 'Roles, storage, RLS, visuals', icon: Flame },
  { id: 'cheatsheets', label: 'Reference tables', desc: 'Roles · storage modes · modifiers', icon: Table2 },
];

const CATEGORIES: (MatrixCategory | 'All')[] = [
  'All',
  'Workspace Roles',
  'Storage Modes',
  'Security (RLS/OLS)',
  'Visual Selection',
];

export const CheatSheetMatrixView: React.FC<CheatSheetMatrixViewProps> = ({
  progress,
  subMode,
  onChangeSubMode,
  onNavigate,
  onRecordMatrixDrill,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<MatrixCategory | 'All'>('All');
  const [drillIdx, setDrillIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  const drills = useMemo(() => {
    if (categoryFilter === 'All') return MATRIX_DRILLS;
    return MATRIX_DRILLS.filter((d) => d.category === categoryFilter);
  }, [categoryFilter]);

  const safeIdx = drills.length > 0 ? drillIdx % drills.length : 0;
  const activeDrill = drills[safeIdx];

  const handleAnswer = (opt: string) => {
    if (selectedOption !== null || !activeDrill) return;
    setSelectedOption(opt);
    const isCorrect = opt === activeDrill.correctOption;
    const nextStreak = isCorrect ? currentStreak + 1 : 0;
    setCurrentStreak(nextStreak);
    onRecordMatrixDrill(isCorrect, nextStreak);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setDrillIdx((i) => (i + 1) % Math.max(1, drills.length));
  };

  const accuracy =
    progress.matrixStats.total > 0
      ? Math.round((progress.matrixStats.correct / progress.matrixStats.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Section switcher */}
      <div
        aria-label="Guide sections"
        className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-1"
      >
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const on = subMode === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChangeSubMode(s.id)}
              aria-current={on ? 'page' : undefined}
              title={s.desc}
              className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-bold transition lg:flex-1 ${
                on ? 'bg-accent text-on-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {subMode === 'dax' && <DaxCheatSheetView onPractise={() => onNavigate('dax')} />}
      {subMode === 'pq' && <PqGuidesView onOpenLab={() => onNavigate('pqlab')} />}

      {/* RAPID-FIRE DRILLS */}
      {subMode === 'drills' && activeDrill && (
        <div className="space-y-4">
          {/* Streak & Category Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setDrillIdx(0);
                    setSelectedOption(null);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    categoryFilter === cat
                      ? 'bg-violet-500/20 text-violet-200 border border-violet-500/50'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300">
                Streak:{' '}
                <strong className="text-amber-400">{currentStreak}</strong> (Best:{' '}
                {progress.matrixStats.bestStreak})
              </span>
              <span className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-300">
                Accuracy: <strong className="text-emerald-400">{accuracy}%</strong>
              </span>
            </div>
          </div>

          {/* Active Drill Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
            <div className="flex items-center justify-between text-xs">
              <span className="rounded-md bg-violet-500/15 px-2.5 py-1 font-semibold text-violet-300">
                {activeDrill.category}
              </span>
              <span className="text-slate-400">
                Drill {safeIdx + 1} of {drills.length}
              </span>
            </div>

            <p className="text-base font-medium leading-relaxed text-white">
              {activeDrill.scenario}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {activeDrill.options.map((opt) => {
                const isChosen = selectedOption === opt;
                const isCorrect = opt === activeDrill.correctOption;
                const revealed = selectedOption !== null;

                let cls =
                  'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-violet-400/60';
                if (revealed) {
                  if (isCorrect) {
                    cls = 'border-emerald-500 bg-emerald-500/15 text-emerald-100';
                  } else if (isChosen) {
                    cls = 'border-rose-500 bg-rose-500/15 text-rose-100';
                  } else {
                    cls = 'border-slate-800/50 bg-slate-950/30 text-slate-500';
                  }
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-4 text-left text-sm font-semibold transition ${cls}`}
                  >
                    <span>{opt}</span>
                    {revealed && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    )}
                    {revealed && isChosen && !isCorrect && (
                      <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedOption !== null && (
              <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs">
                <p className="leading-relaxed text-slate-200">{activeDrill.explanation}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200">
                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      <strong>Rule of Thumb:</strong> {activeDrill.ruleOfThumb}
                    </span>
                  </div>
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-on-accent hover:bg-accent-hover"
                  >
                    Next scenario
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REFERENCE CHEAT SHEETS */}
      {subMode === 'cheatsheets' && (
        <div className="space-y-6">
          {/* Workspace Roles Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-violet-400" />
                <h2 className="font-extrabold text-white">Workspace roles and RLS</h2>
              </div>
              <span className="text-xs text-amber-300 font-medium">
                Only Viewer enforces RLS.
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Capability</th>
                    <th className="px-4 py-3 font-semibold">Admin</th>
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">Contributor</th>
                    <th className="px-4 py-3 font-semibold text-emerald-300">Viewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  {WORKSPACE_ROLE_MATRIX.map((row) => (
                    <tr key={row.capability} className="hover:bg-slate-900/90">
                      <td className="px-4 py-3 font-medium text-white">{row.capability}</td>
                      <td className="px-4 py-3">{row.admin}</td>
                      <td className="px-4 py-3">{row.member}</td>
                      <td className="px-4 py-3">{row.contributor}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-300">{row.viewer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Storage Modes Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
              <Table2 className="h-5 w-5 text-amber-400" />
              <h2 className="font-extrabold text-white">Storage modes: Import, DirectQuery, Dual</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Dimension</th>
                    <th className="px-4 py-3 font-semibold text-sky-300">Import</th>
                    <th className="px-4 py-3 font-semibold text-amber-300">DirectQuery</th>
                    <th className="px-4 py-3 font-semibold text-emerald-300">Dual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  {STORAGE_MODE_MATRIX.map((row) => (
                    <tr key={row.feature} className="hover:bg-slate-900/90">
                      <td className="px-4 py-3 font-medium text-white">{row.feature}</td>
                      <td className="px-4 py-3">{row.importMode}</td>
                      <td className="px-4 py-3">{row.directQuery}</td>
                      <td className="px-4 py-3">{row.dualMode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DAX Modifiers Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
              <BookMarked className="h-5 w-5 text-sky-400" />
              <h2 className="font-extrabold text-white">Filter modifiers and their traps</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Function</th>
                    <th className="px-4 py-3 font-semibold">What it does</th>
                    <th className="px-4 py-3 font-semibold text-amber-300">Exam Trap to Watch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  {DAX_MODIFIER_MATRIX.map((row) => (
                    <tr key={row.fn} className="hover:bg-slate-900/90">
                      <td className="px-4 py-3 font-mono font-semibold text-sky-300">{row.fn}</td>
                      <td className="px-4 py-3">{row.role}</td>
                      <td className="px-4 py-3 text-amber-200/90">{row.trap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
