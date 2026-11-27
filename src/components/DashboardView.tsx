import React from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  Code2,
  Database,
  FileSpreadsheet,
  Flame,
  Layers,
  Lightbulb,
  ListOrdered,
  RotateCcw,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { DomainId, MainTab, SimulatorSubTab, UserProgress } from '../types/pl300';
import { PL300_DOMAINS, VIDEO_RESOURCES } from '../data/curriculumData';
import {
  CASE_STUDIES,
  DAX_CHALLENGES,
  POWER_QUERY_CHALLENGES,
} from '../data/examQuestionsData';
import { FLASHCARDS, MATRIX_DRILLS } from '../data/matrixAndFlashcardsData';
import { PQ_SCENARIOS } from '../pqlab/scenarios';
import { computeDomainAnalytics, computeReadinessScore } from '../utils/progressHelpers';
import { ProgressSyncCard } from './ProgressSyncCard';

interface DashboardViewProps {
  progress: UserProgress;
  onNavigateTab: (tab: MainTab, simSubTab?: SimulatorSubTab, domainFilter?: DomainId | 'all') => void;
  onImportProgress: (nextProgress: UserProgress) => void;
  onResetProgress: () => void;
}

const DOMAIN_ICONS = { Database, Boxes, BarChart3, ShieldCheck };

/** A report-style card: small caption on top, content below. */
const Card: React.FC<{ title?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }> = ({
  title,
  action,
  className = '',
  children,
}) => (
  <section className={`min-w-0 rounded-xl border border-slate-800 bg-slate-900 p-5 ${className}`}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title && <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </section>
);

const Bar: React.FC<{ pct: number; tone?: 'accent' | 'good'; marker?: number; height?: string }> = ({
  pct,
  tone = 'accent',
  marker,
  height = 'h-2',
}) => (
  <div className={`relative ${height} w-full overflow-hidden rounded-sm bg-slate-800`}>
    <div
      className={`absolute inset-y-0 left-0 transition-all duration-700 ${tone === 'good' ? 'bg-emerald-400' : 'bg-accent'}`}
      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
    />
    {marker !== undefined && <div className="absolute inset-y-0 w-0.5 bg-slate-100" style={{ left: `${marker}%` }} />}
  </div>
);

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  onNavigateTab,
  onImportProgress,
  onResetProgress,
}) => {
  const analytics = computeDomainAnalytics(progress);
  const score = computeReadinessScore(analytics, progress);
  const isPassing = score >= 700;

  const weakest = [...PL300_DOMAINS].sort((a, b) => analytics[a.id].masteryPct - analytics[b.id].masteryPct)[0];

  const totalSkills = Object.values(analytics).reduce((acc, d) => acc + d.skillsTotal, 0);
  const doneSkills = Object.values(analytics).reduce((acc, d) => acc + d.skillsDone, 0);
  const attempted = Object.values(progress.mcqHistory);
  const mcqAccuracy = attempted.length
    ? Math.round((attempted.filter((h) => h.correct).length / attempted.length) * 100)
    : 0;
  const allCards = [...FLASHCARDS, ...progress.customFlashcards];
  // Count only cards that still exist (ratings of deleted custom cards used to inflate this).
  const mastered = allCards.filter((c) => (progress.flashcardRatings[c.id]?.box ?? 0) >= 3).length;
  const caseTotal = CASE_STUDIES.reduce((acc, cs) => acc + cs.questions.length, 0);
  const caseEarned = Object.values(progress.caseStudyScores).reduce((acc, v) => acc + v, 0);
  const labsDone = progress.daxCompleted.length + progress.pqCompleted.length + progress.pqLabCompleted.length;
  const labsTotal = DAX_CHALLENGES.length + POWER_QUERY_CHALLENGES.length + PQ_SCENARIOS.length;

  const kpis = [
    { label: 'Skills checked off', value: `${doneSkills}`, of: `/ ${totalSkills}`, pct: (doneSkills / Math.max(1, totalSkills)) * 100 },
    {
      label: 'Question accuracy',
      value: attempted.length ? `${mcqAccuracy}%` : '—',
      of: attempted.length ? `${attempted.length} answered` : 'none yet',
      pct: mcqAccuracy,
    },
    { label: 'Labs completed', value: `${labsDone}`, of: `/ ${labsTotal}`, pct: (labsDone / Math.max(1, labsTotal)) * 100 },
    { label: 'Cards mastered', value: `${mastered}`, of: `/ ${allCards.length}`, pct: (mastered / Math.max(1, allCards.length)) * 100 },
  ];

  const labs: {
    name: string;
    detail: string;
    done: number;
    total: number;
    unit?: string;
    icon: React.ComponentType<{ className?: string }>;
    open: () => void;
  }[] = [
    {
      name: 'Power Query Lab',
      detail: 'Clean 8 messy datasets in a working editor',
      done: progress.pqLabCompleted.length,
      total: PQ_SCENARIOS.length,
      icon: FileSpreadsheet,
      open: () => onNavigateTab('simulator', 'pqlab'),
    },
    {
      name: 'DAX builder',
      detail: 'Fill formula slots, then run them on sample data',
      done: progress.daxCompleted.length,
      total: DAX_CHALLENGES.length,
      icon: Code2,
      open: () => onNavigateTab('simulator', 'dax'),
    },
    {
      name: 'Power Query step order',
      detail: 'Put transformation steps in the right order',
      done: progress.pqCompleted.length,
      total: POWER_QUERY_CHALLENGES.length,
      icon: ListOrdered,
      open: () => onNavigateTab('simulator', 'powerquery'),
    },
    {
      name: 'Case studies',
      detail: 'Multi-tab exhibits with evidence highlighting',
      done: caseEarned,
      total: caseTotal,
      unit: 'pts',
      icon: Layers,
      open: () => onNavigateTab('simulator', 'casestudy'),
    },
    {
      name: 'Matrix drills',
      detail: 'Roles, storage modes, RLS and visual picks',
      done: progress.matrixStats.bestStreak,
      total: MATRIX_DRILLS.length,
      unit: 'best streak',
      icon: Flame,
      open: () => onNavigateTab('matrix'),
    },
  ];

  const updated = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      {/* ===== Page title ===== */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Report · {updated}</p>
          <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
            Exam <span className="marker">readiness</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateTab('simulator', 'mcq', 'all')}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            <Target className="h-4 w-4" />
            Practice questions
          </button>
          <button
            onClick={() => onNavigateTab('curriculum')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-600"
          >
            <BookOpen className="h-4 w-4" />
            Study plan
          </button>
        </div>
      </div>

      {/* ===== Score + KPIs ===== */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Simulated exam score" className="lg:row-span-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-6xl font-bold tabular-nums leading-none text-white">{score}</span>
            <span className="text-sm text-slate-500">/ 1000</span>
          </div>
          <div className="mt-5">
            <Bar pct={score / 10} marker={70} height="h-3" tone={isPassing ? 'good' : 'accent'} />
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
              <span>0</span>
              <span className="font-medium text-slate-300">Pass mark 700</span>
              <span>1000</span>
            </div>
          </div>
          <p className={`mt-4 text-sm font-medium ${isPassing ? 'text-emerald-300' : 'text-slate-300'}`}>
            {isPassing ? 'On track to pass.' : `${700 - score} points to the pass mark.`}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Blends checked-off skills, question accuracy, labs, case studies and drills, weighted by the official
            domain split (25–30% · 25–30% · 25–30% · 15–20%).
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {kpis.map((k) => (
            <Card key={k.label} title={k.label}>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold tabular-nums text-white">{k.value}</span>
                <span className="text-xs text-slate-500">{k.of}</span>
              </div>
              <div className="mt-3">
                <Bar pct={k.pct} height="h-1.5" />
              </div>
            </Card>
          ))}
        </div>

        <Card
          title="Next best step"
          className="border-l-4 border-l-accent lg:col-span-2"
          action={<span className="text-[11px] text-slate-500">weakest domain</span>}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xl font-semibold text-white">{weakest.title}</p>
              <p className="mt-1 text-sm text-slate-400">
                {analytics[weakest.id].masteryPct}% mastery · worth {weakest.weightRange} of the exam
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                onClick={() => onNavigateTab('simulator', 'mcq', weakest.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
              >
                Practice it <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigateTab('curriculum', undefined, weakest.id)}
                className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-200 hover:border-slate-600"
              >
                Study modules
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* ===== Domain chart + labs ===== */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Card
          title="Mastery by exam domain"
          className="xl:col-span-3"
          action={
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="inline-block h-3 w-0.5 bg-slate-100" /> 70% target
            </span>
          }
        >
          <div className="space-y-5">
            {PL300_DOMAINS.map((d) => {
              const Icon = DOMAIN_ICONS[d.iconName];
              const st = analytics[d.id];
              const videos = VIDEO_RESOURCES.filter((v) => v.domain === d.id);
              const watched = videos.filter((v) => progress.watchedVideos.includes(v.id)).length;
              return (
                <div key={d.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <button
                      onClick={() => onNavigateTab('curriculum', undefined, d.id)}
                      className="flex min-w-0 items-center gap-2 text-left text-sm font-medium text-slate-200 hover:text-white"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{d.title}</span>
                      <span className="shrink-0 text-xs font-normal text-slate-500">{d.weightRange}</span>
                    </button>
                    <span className="font-display text-sm font-bold tabular-nums text-white">{st.masteryPct}%</span>
                  </div>
                  <Bar pct={st.masteryPct} marker={70} tone={st.masteryPct >= 70 ? 'good' : 'accent'} />
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
                    <span>
                      {st.skillsDone}/{st.skillsTotal} skills
                    </span>
                    <span>
                      {st.mcqCorrect}/{st.mcqTotal} questions right
                    </span>
                    <span>
                      {watched}/{videos.length} videos
                    </span>
                    <button
                      onClick={() => onNavigateTab('simulator', 'mcq', d.id)}
                      className="font-medium text-accent-ink hover:underline"
                    >
                      Quiz this domain →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Labs" className="xl:col-span-2">
          <ul className="-mx-2 divide-y divide-slate-800">
            {labs.map((l) => {
              const Icon = l.icon;
              return (
                <li key={l.name}>
                  <button
                    onClick={l.open}
                    className="group flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition hover:bg-slate-800/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-300 group-hover:border-accent group-hover:text-accent-ink">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{l.name}</span>
                      <span className="block truncate text-xs text-slate-500">{l.detail}</span>
                    </span>
                    <span className="w-24 shrink-0 text-right">
                      <span className="block text-xs tabular-nums text-slate-300">
                        {l.done}/{l.total} {l.unit ?? ''}
                      </span>
                      <span className="mt-1 block">
                        <Bar pct={(l.done / Math.max(1, l.total)) * 100} height="h-1" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* ===== Sync ===== */}
      <ProgressSyncCard progress={progress} onImportProgress={onImportProgress} />

      {/* ===== Tip + reset ===== */}
      <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-700 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm text-slate-300">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="leading-relaxed">
            <span className="font-semibold text-white">Exam-day strategy: </span>
            in case studies, read the questions before the exhibit tabs — it roughly halves reading time. You can’t
            return to a case study once you submit it, but you can flag regular questions for review.
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Reset all PL-300 study progress, notes, and custom flashcards?')) {
              onResetProgress();
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300 sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset progress
        </button>
      </div>
    </div>
  );
};
