import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  Code2,
  Database,
  FileSpreadsheet,
  Flame,
  Layers,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Youtube,
} from 'lucide-react';
import {
  DomainId,
  MainTab,
  SimulatorSubTab,
  UserProgress,
} from '../types/pl300';
import { PL300_DOMAINS, VIDEO_RESOURCES } from '../data/curriculumData';
import {
  CASE_STUDIES,
  DAX_CHALLENGES,
  MCQ_QUESTIONS,
  POWER_QUERY_CHALLENGES,
} from '../data/examQuestionsData';
import { FLASHCARDS } from '../data/matrixAndFlashcardsData';
import {
  computeDomainAnalytics,
  computeReadinessScore,
} from '../utils/progressHelpers';
import { ProgressSyncCard } from './ProgressSyncCard';

interface DashboardViewProps {
  progress: UserProgress;
  onNavigateTab: (tab: MainTab, simSubTab?: SimulatorSubTab, domainFilter?: DomainId | 'all') => void;
  onImportProgress: (nextProgress: UserProgress) => void;
  onResetProgress: () => void;
}

const DOMAIN_ICONS = {
  Database,
  Boxes,
  BarChart3,
  ShieldCheck,
};

const COLOR_STYLES: Record<string, { badge: string; bar: string; border: string; icon: string }> = {
  amber: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bar: 'bg-amber-400',
    border: 'border-amber-500/25 hover:border-amber-400/50',
    icon: 'text-amber-400',
  },
  sky: {
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    bar: 'bg-sky-400',
    border: 'border-sky-500/25 hover:border-sky-400/50',
    icon: 'text-sky-400',
  },
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    bar: 'bg-emerald-400',
    border: 'border-emerald-500/25 hover:border-emerald-400/50',
    icon: 'text-emerald-400',
  },
  violet: {
    badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    bar: 'bg-violet-400',
    border: 'border-violet-500/25 hover:border-violet-400/50',
    icon: 'text-violet-400',
  },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  onNavigateTab,
  onImportProgress,
  onResetProgress,
}) => {
  const analytics = computeDomainAnalytics(progress);
  const readinessScore = computeReadinessScore(analytics, progress);
  const passingScore = 700;
  const isPassing = readinessScore >= passingScore;

  // Determine weakest domain for smart recommendation
  const sortedDomains = [...PL300_DOMAINS].sort(
    (a, b) => analytics[a.id].masteryPct - analytics[b.id].masteryPct
  );
  const weakestDomain = sortedDomains[0];

  const totalSkills = Object.values(analytics).reduce((acc, d) => acc + d.skillsTotal, 0);
  const doneSkills = Object.values(analytics).reduce((acc, d) => acc + d.skillsDone, 0);
  const totalMcqCorrect = Object.values(analytics).reduce((acc, d) => acc + d.mcqCorrect, 0);
  const totalCards = FLASHCARDS.length + progress.customFlashcards.length;
  const masteredCards = Object.values(progress.flashcardRatings).filter((r) => r.box >= 3).length;

  const caseStudyTotal = CASE_STUDIES.reduce((acc, cs) => acc + cs.questions.length, 0);
  const caseStudyEarned = Object.values(progress.caseStudyScores).reduce((acc, v) => acc + v, 0);

  return (
    <div className="space-y-6">
      {/* Top Hero Readiness Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
              <Award className="h-3.5 w-3.5" />
              Microsoft Certified: Power BI Data Analyst Associate (PL-300)
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Your Exam Readiness & Weak-Spot Radar
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              Built around the official Microsoft Learn syllabus, curated YouTube deep-dives (Guy in a Cube, Pragmatic Works, SQLBI, Curbal), and authentic interactive PL-300 exam formats: DAX slot builders, Power Query folding sequencers, and multi-tab case studies.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                onClick={() => onNavigateTab('simulator', 'mcq', 'all')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-amber-300"
              >
                <Target className="h-4 w-4" />
                Launch Exam Simulator
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigateTab('curriculum')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
              >
                <BookOpen className="h-4 w-4 text-sky-400" />
                MS Learn & Video Hub
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Reset all PL-300 study progress, notes, and custom flashcards?')) {
                    onResetProgress();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-xs font-medium text-slate-400 transition hover:border-rose-500/40 hover:text-rose-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Progress
              </button>
            </div>
          </div>

          {/* Score Gauge Card */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Simulated Exam Score
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-4xl font-extrabold ${isPassing ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {readinessScore}
                  </span>
                  <span className="text-sm text-slate-400">/ 1000</span>
                </div>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  isPassing
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                }`}
              >
                {isPassing ? 'Passing Pace (≥ 700)' : 'Target: 700+ to Pass'}
              </span>
            </div>

            {/* Meter with 700 marker */}
            <div className="mt-4">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPassing
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  }`}
                  style={{ width: `${Math.min(100, readinessScore / 10)}%` }}
                />
                <div
                  className="absolute bottom-0 top-0 w-0.5 bg-white/90 shadow"
                  style={{ left: '70%' }}
                  title="700 Passing Score"
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                <span>0</span>
                <span className="font-semibold text-slate-200">Pass Line: 700</span>
                <span>1000</span>
              </div>
            </div>

            {/* Quick Stat Pills */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-slate-900 p-2">
                <div className="text-sm font-bold text-white">{doneSkills}/{totalSkills}</div>
                <div className="text-[10px] text-slate-400">Skills</div>
              </div>
              <div className="rounded-lg bg-slate-900 p-2">
                <div className="text-sm font-bold text-white">{totalMcqCorrect}/{MCQ_QUESTIONS.length}</div>
                <div className="text-[10px] text-slate-400">MCQs</div>
              </div>
              <div className="rounded-lg bg-slate-900 p-2">
                <div className="text-sm font-bold text-white">
                  {progress.daxCompleted.length + progress.pqCompleted.length}/
                  {DAX_CHALLENGES.length + POWER_QUERY_CHALLENGES.length}
                </div>
                <div className="text-[10px] text-slate-400">DAX/PQ Labs</div>
              </div>
              <div className="rounded-lg bg-slate-900 p-2">
                <div className="text-sm font-bold text-white">{masteredCards}/{totalCards}</div>
                <div className="text-[10px] text-slate-400">Cards</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weak-Spot Recommender + Interactive Mode Shortcuts */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-400/15 p-2.5 text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
                Recommended Next Step
              </h2>
              <p className="text-base font-semibold text-white">
                Focus on: {weakestDomain.title} ({weakestDomain.weightRange} exam weight)
              </p>
              <p className="text-xs leading-relaxed text-slate-300">
                Current mastery in <span className="font-semibold text-white">{weakestDomain.shortTitle}</span> is{' '}
                <span className="font-semibold text-amber-300">{analytics[weakestDomain.id].masteryPct}%</span>.
                Tackle the targeted MCQs or check off its Microsoft Learn sub-skills to lift your score fastest.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => onNavigateTab('simulator', 'mcq', weakestDomain.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/30"
                >
                  Practice {weakestDomain.shortTitle} MCQs
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onNavigateTab('curriculum', undefined, weakestDomain.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500"
                >
                  Open Study Modules
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Interactive Lab Launchers */}
        <div className="lg:col-span-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => onNavigateTab('simulator', 'dax')}
            className="group flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-sky-500/50 hover:bg-slate-900"
          >
            <div className="rounded-xl bg-sky-500/15 p-2.5 text-sky-400">
              <Code2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white group-hover:text-sky-300">
                  DAX Slot Builder
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {progress.daxCompleted.length}/{DAX_CHALLENGES.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Practice CALCULATE, USERELATIONSHIP, KEEPFILTERS, SUMX & RANKX slot-fill questions.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('simulator', 'powerquery')}
            className="group flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-amber-500/50 hover:bg-slate-900"
          >
            <div className="rounded-xl bg-amber-500/15 p-2.5 text-amber-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white group-hover:text-amber-300">
                  Power Query Sequencer
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {progress.pqCompleted.length}/{POWER_QUERY_CHALLENGES.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Order transformation steps cleanly to unpivot, build star dimensions, and keep Query Folding.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('simulator', 'casestudy')}
            className="group flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-emerald-500/50 hover:bg-slate-900"
          >
            <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white group-hover:text-emerald-300">
                  Case Study Simulator
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {caseStudyEarned}/{caseStudyTotal} pts
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Multi-tab Contoso & Litware exhibits with evidence-highlighting exam strategy.
              </p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('matrix')}
            className="group flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-violet-500/50 hover:bg-slate-900"
          >
            <div className="rounded-xl bg-violet-500/15 p-2.5 text-violet-400">
              <Flame className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white group-hover:text-violet-300">
                  Matrix Drills & Cheat Sheets
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Streak: {progress.matrixStats.bestStreak}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Rapid-fire drills on Workspace Roles, Storage Modes, RLS/OLS & Visual Picks.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4 Official Exam Domains Mastery Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Official PL-300 Domain Breakdown</h2>
          <span className="text-xs text-slate-400">
            Weighted according to Microsoft Skills Measured
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {PL300_DOMAINS.map((domain) => {
            const Icon = DOMAIN_ICONS[domain.iconName];
            const stats = analytics[domain.id];
            const style = COLOR_STYLES[domain.color];
            const videosInDomain = VIDEO_RESOURCES.filter((v) => v.domain === domain.id);
            const watchedInDomain = videosInDomain.filter((v) =>
              progress.watchedVideos.includes(v.id)
            ).length;

            return (
              <div
                key={domain.id}
                className={`rounded-2xl border bg-slate-900/60 p-5 transition ${style.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-slate-800/90 p-2.5">
                      <Icon className={`h-5 w-5 ${style.icon}`} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{domain.title}</h3>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.badge}`}>
                          Exam Weight: {domain.weightRange}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {domain.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-white">{stats.masteryPct}%</span>
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">Mastery</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                    style={{ width: `${stats.masteryPct}%` }}
                  />
                </div>

                {/* Metrics & Quick Actions */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      {stats.skillsDone}/{stats.skillsTotal} Skills
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-sky-400" />
                      {stats.mcqCorrect}/{stats.mcqTotal} MCQs
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Youtube className="h-3.5 w-3.5 text-rose-400" />
                      {watchedInDomain}/{videosInDomain.length} Videos
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigateTab('curriculum', undefined, domain.id)}
                      className="rounded-lg border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
                    >
                      Study
                    </button>
                    <button
                      onClick={() => onNavigateTab('simulator', 'mcq', domain.id)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-amber-300 transition hover:bg-slate-700"
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Device Backup & Cloud Sync */}
      <ProgressSyncCard
        progress={progress}
        onImportProgress={onImportProgress}
      />

      {/* High-Yield Exam Strategy Tip */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <span className="font-semibold text-white">PL-300 Exam Day Strategy:</span> On multi-part Case Studies, read the <span className="text-amber-300 font-medium">questions first</span> before scanning the 5 Exhibit tabs—this cuts reading time in half. Also remember you cannot go back to previous Case Study sections once submitted, though you can mark normal questions for review.
        </div>
      </div>
    </div>
  );
};
