import React, { useId } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Boxes,
  CheckCircle2,
  Code2,
  Database,
  FileSpreadsheet,
  Flame,
  Layers,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  Target,
  Youtube,
} from 'lucide-react';
import { DomainId, MainTab, SimulatorSubTab, UserProgress } from '../types/pl300';
import { PL300_DOMAINS, VIDEO_RESOURCES } from '../data/curriculumData';
import {
  CASE_STUDIES,
  DAX_CHALLENGES,
  MCQ_QUESTIONS,
  POWER_QUERY_CHALLENGES,
} from '../data/examQuestionsData';
import { FLASHCARDS } from '../data/matrixAndFlashcardsData';
import { PQ_SCENARIOS } from '../pqlab/scenarios';
import { computeDomainAnalytics, computeReadinessScore } from '../utils/progressHelpers';
import { ProgressSyncCard } from './ProgressSyncCard';
import { Sparkle } from './ui/Sparkle';

interface DashboardViewProps {
  progress: UserProgress;
  onNavigateTab: (tab: MainTab, simSubTab?: SimulatorSubTab, domainFilter?: DomainId | 'all') => void;
  onImportProgress: (nextProgress: UserProgress) => void;
  onResetProgress: () => void;
}

const DOMAIN_ICONS = { Database, Boxes, BarChart3, ShieldCheck };

const DOMAIN_TINT: Record<string, { icon: string; chip: string }> = {
  amber: { icon: 'text-amber-300 bg-amber-500/15', chip: 'text-amber-300' },
  sky: { icon: 'text-sky-300 bg-sky-500/15', chip: 'text-sky-300' },
  emerald: { icon: 'text-emerald-300 bg-emerald-500/15', chip: 'text-emerald-300' },
  violet: { icon: 'text-violet-300 bg-violet-500/15', chip: 'text-violet-300' },
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Circular readiness gauge with the Gemini gradient and a 700 pass tick. */
const ReadinessRing: React.FC<{ score: number }> = ({ score }) => {
  const id = useId();
  const r = 70;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / 1000));
  const passAngle = 0.7 * 2 * Math.PI - Math.PI / 2;
  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#4285f4" />
            <stop offset="0.5" stopColor="#9b72cb" />
            <stop offset="1" stopColor="#d96570" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r={r} fill="none" strokeWidth="12" className="stroke-slate-800" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          stroke={`url(#${id})`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      {/* 700 pass marker */}
      <span
        className="absolute h-3.5 w-1 rounded-full bg-slate-100"
        style={{
          left: `calc(50% + ${Math.cos(passAngle) * 43.75}% - 2px)`,
          top: `calc(50% + ${Math.sin(passAngle) * 43.75}% - 7px)`,
          transform: `rotate(${(passAngle * 180) / Math.PI + 90}deg)`,
        }}
        title="700 — passing score"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-tight text-white">{score}</span>
        <span className="text-xs text-slate-400">of 1000</span>
      </div>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  progress,
  onNavigateTab,
  onImportProgress,
  onResetProgress,
}) => {
  const analytics = computeDomainAnalytics(progress);
  const readinessScore = computeReadinessScore(analytics, progress);
  const isPassing = readinessScore >= 700;

  const weakestDomain = [...PL300_DOMAINS].sort(
    (a, b) => analytics[a.id].masteryPct - analytics[b.id].masteryPct
  )[0];

  const totalSkills = Object.values(analytics).reduce((acc, d) => acc + d.skillsTotal, 0);
  const doneSkills = Object.values(analytics).reduce((acc, d) => acc + d.skillsDone, 0);
  const totalMcqCorrect = Object.values(analytics).reduce((acc, d) => acc + d.mcqCorrect, 0);
  const allCards = [...FLASHCARDS, ...progress.customFlashcards];
  // Count only cards that still exist (ratings of deleted custom cards used to inflate this).
  const masteredCards = allCards.filter(
    (c) => (progress.flashcardRatings[c.id]?.box ?? 0) >= 3
  ).length;

  const caseStudyTotal = CASE_STUDIES.reduce((acc, cs) => acc + cs.questions.length, 0);
  const caseStudyEarned = Object.values(progress.caseStudyScores).reduce((acc, v) => acc + v, 0);
  const labsDone =
    progress.daxCompleted.length + progress.pqCompleted.length + progress.pqLabCompleted.length;
  const labsTotal = DAX_CHALLENGES.length + POWER_QUERY_CHALLENGES.length + PQ_SCENARIOS.length;

  const stats = [
    { label: 'Skills', value: doneSkills, total: totalSkills },
    { label: 'MCQs right', value: totalMcqCorrect, total: MCQ_QUESTIONS.length },
    { label: 'Labs', value: labsDone, total: labsTotal },
    { label: 'Cards mastered', value: masteredCards, total: allCards.length },
  ];

  const suggestions: {
    title: string;
    detail: string;
    meta: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  }[] = [
    {
      title: 'Build DAX formulas slot by slot',
      detail: 'CALCULATE, USERELATIONSHIP, KEEPFILTERS, SUMX & RANKX.',
      meta: `${progress.daxCompleted.length}/${DAX_CHALLENGES.length} done`,
      icon: Code2,
      onClick: () => onNavigateTab('simulator', 'dax'),
    },
    {
      title: 'Clean real data in the Power Query Lab',
      detail: 'Eight messy datasets: unpivot, merge, append, fill down, group by.',
      meta: `${progress.pqLabCompleted.length}/${PQ_SCENARIOS.length} scenarios`,
      icon: FileSpreadsheet,
      onClick: () => onNavigateTab('simulator', 'pqlab'),
    },
    {
      title: 'Work through a case study',
      detail: 'Multi-tab exhibits with evidence highlighting.',
      meta: `${caseStudyEarned}/${caseStudyTotal} pts`,
      icon: Layers,
      onClick: () => onNavigateTab('simulator', 'casestudy'),
    },
    {
      title: 'Rapid-fire matrix drills',
      detail: 'Workspace roles, storage modes, RLS/OLS, visual picks.',
      meta: `Best streak ${progress.matrixStats.bestStreak}`,
      icon: Flame,
      onClick: () => onNavigateTab('matrix'),
    },
  ];

  return (
    <div className="space-y-10">
      {/* ===== Greeting ===== */}
      <section className="pt-4 sm:pt-8">
        <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">
          <span className="gemini-text">{greeting()}, Analyst</span>
        </h2>
        <p className="mt-2 text-2xl font-normal tracking-tight text-slate-500 sm:text-4xl">
          Where should we focus today?
        </p>
      </section>

      {/* ===== Readiness + recommendation ===== */}
      <section className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col items-center gap-6 rounded-[28px] bg-slate-900 p-6 sm:flex-row lg:col-span-3 lg:flex-col xl:flex-row">
          <ReadinessRing score={readinessScore} />
          <div className="w-full flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-medium text-white">Simulated exam score</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    isPassing
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isPassing ? 'On passing pace' : `${700 - readinessScore} to pass`}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Microsoft needs 700 / 1000. Your score blends skills, quiz accuracy, labs,
                case studies and drills, weighted by the official domain split.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-2 2xl:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-slate-950/60 px-3 py-2.5">
                  <dt className="text-[11px] text-slate-400">{s.label}</dt>
                  <dd className="mt-0.5 text-base font-semibold text-white">
                    {s.value}
                    <span className="text-xs font-normal text-slate-500">/{s.total}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="gemini-ring flex flex-col justify-between gap-5 rounded-[28px] bg-slate-900 p-6 lg:col-span-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Sparkle className="h-4 w-4" />
              Recommended next step
            </div>
            <p className="text-xl font-medium leading-snug text-white">
              Strengthen {weakestDomain.shortTitle}
            </p>
            <p className="text-sm leading-relaxed text-slate-400">
              It&apos;s your weakest domain at{' '}
              <span className="font-medium text-white">
                {analytics[weakestDomain.id].masteryPct}% mastery
              </span>{' '}
              and carries {weakestDomain.weightRange} of the exam. Targeted questions lift
              your score fastest.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('simulator', 'mcq', weakestDomain.id)}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-accent-hover"
            >
              Practice questions
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigateTab('curriculum', undefined, weakestDomain.id)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              <BookOpen className="h-4 w-4" />
              Study modules
            </button>
          </div>
        </div>
      </section>

      {/* ===== Suggestion cards ===== */}
      <section>
        <h3 className="mb-3 text-sm font-medium text-slate-400">Jump into a lab</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {suggestions.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.title}
                onClick={s.onClick}
                className="group flex min-h-[176px] flex-col justify-between rounded-[24px] bg-slate-900 p-5 text-left transition hover:bg-slate-800"
              >
                <div>
                  <div className="text-base font-medium leading-snug text-white">{s.title}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{s.detail}</p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className="text-xs font-medium text-slate-500">{s.meta}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-slate-200 transition group-hover:bg-accent group-hover:text-slate-950">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== Domain breakdown ===== */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-medium text-slate-400">Exam domains</h3>
          <span className="text-xs text-slate-500">Weighted per Microsoft&apos;s skills measured</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {PL300_DOMAINS.map((domain) => {
            const Icon = DOMAIN_ICONS[domain.iconName];
            const st = analytics[domain.id];
            const tint = DOMAIN_TINT[domain.color] ?? DOMAIN_TINT.sky;
            const videosInDomain = VIDEO_RESOURCES.filter((v) => v.domain === domain.id);
            const watchedInDomain = videosInDomain.filter((v) =>
              progress.watchedVideos.includes(v.id)
            ).length;

            return (
              <div key={domain.id} className="rounded-[24px] bg-slate-900 p-5">
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${tint.icon}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-medium text-white">{domain.title}</h4>
                        <span className={`text-xs ${tint.chip}`}>{domain.weightRange} of exam</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-semibold leading-none text-white">
                          {st.masteryPct}
                          <span className="text-sm font-normal text-slate-500">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full gemini-bg transition-all duration-700"
                        style={{ width: `${st.masteryPct}%` }}
                      />
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
                      {domain.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      {st.skillsDone}/{st.skillsTotal} skills
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-sky-300" />
                      {st.mcqCorrect}/{st.mcqTotal} MCQs
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Youtube className="h-3.5 w-3.5 text-rose-300" />
                      {watchedInDomain}/{videosInDomain.length} videos
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onNavigateTab('curriculum', undefined, domain.id)}
                      className="rounded-full px-3 py-1.5 font-medium text-slate-200 transition hover:bg-slate-800"
                    >
                      Study
                    </button>
                    <button
                      onClick={() => onNavigateTab('simulator', 'mcq', domain.id)}
                      className="rounded-full bg-accent/15 px-3 py-1.5 font-medium text-accent transition hover:bg-accent/25"
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== Sync ===== */}
      <ProgressSyncCard progress={progress} onImportProgress={onImportProgress} />

      {/* ===== Exam-day tip + reset ===== */}
      <section className="flex flex-col gap-4 rounded-[24px] bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm text-slate-300">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <p className="leading-relaxed">
            <span className="font-medium text-white">Exam-day strategy: </span>
            in case studies, read the questions before the exhibit tabs — it roughly halves
            reading time. You can&apos;t return to a case study once you submit it, but you can
            flag regular questions for review.
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Reset all PL-300 study progress, notes, and custom flashcards?')) {
              onResetProgress();
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300 sm:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset progress
        </button>
      </section>
    </div>
  );
};
