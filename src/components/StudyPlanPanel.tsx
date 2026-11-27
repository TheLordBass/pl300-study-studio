import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDot,
  Clock,
  ExternalLink,
  Flag,
  Layers,
  Target,
} from 'lucide-react';
import { DomainId, StudyPlanState, UserProgress } from '../types/pl300';
import { DAY_NAMES, PLAN_SESSIONS, PlanLink, PlanSession, PlanTask, STUDY_PLAN } from '../data/studyPlan';
import { LEARNING_MODULES, PL300_DOMAINS, VIDEO_RESOURCES } from '../data/curriculumData';
import { CASE_STUDIES, DAX_CHALLENGES, MCQ_QUESTIONS, POWER_QUERY_CHALLENGES } from '../data/examQuestionsData';
import { PQ_SCENARIOS } from '../pqlab/scenarios';

interface Props {
  progress: UserProgress;
  readinessScore: number;
  onUpdatePlan: (patch: Partial<StudyPlanState>) => void;
  onTogglePlanTask: (taskId: string) => void;
  onToggleVideo: (videoId: string) => void;
  onOpen: (hash: string, domain?: DomainId) => void;
  onOpenModule: (moduleId: string) => void;
}

/* ---------- dates (local, as YYYY-MM-DD) ---------- */

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const todayIso = () => iso(new Date());
const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
const fmt = (s: string, withDay = true) =>
  parse(s).toLocaleDateString(undefined, withDay ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });

const lastOf = (a: string[]) => a[a.length - 1];

/** The next `count` study days from `from` (inclusive). */
function studyDates(from: string, days: number[], count: number): string[] {
  const out: string[] = [];
  let d = parse(from);
  for (let guard = 0; out.length < count && guard < 3000; guard++, d = addDays(d, 1)) {
    if (days.includes(d.getDay())) out.push(iso(d));
  }
  return out;
}

/** The study day `n` study days before `to` (so a session n places further on lands on `to`). */
function studyDaysBack(to: string, days: number[], n: number): string {
  let d = parse(to);
  while (!days.includes(d.getDay())) d = addDays(d, 1);
  for (let left = n; left > 0; ) {
    d = addDays(d, -1);
    if (days.includes(d.getDay())) left--;
  }
  return iso(d);
}

/* ---------- task state ---------- */

interface TaskView {
  id: string;
  done: boolean;
  label: React.ReactNode;
  status?: string;
  detail?: string;
  manual: boolean;          // ticked by hand
  toggle?: () => void;      // a video can be ticked here too
  actions: PlanLink[];
  module?: string;
}

const domainShort = (d: DomainId) => PL300_DOMAINS.find((x) => x.id === d)!.shortTitle;
const titles = (ids: string[], list: { id: string; title: string }[]) =>
  ids.map((id) => list.find((x) => x.id === id)?.title ?? id).join(' · ');

function viewTask(
  t: PlanTask,
  id: string,
  p: UserProgress,
  score: number,
  onToggleVideo: (id: string) => void
): TaskView {
  const base = { id, manual: false, actions: [] as PlanLink[] };
  switch (t.kind) {
    case 'module': {
      const m = LEARNING_MODULES.find((x) => x.id === t.id)!;
      const n = m.skills.filter((s) => p.completedSkills.includes(s.id)).length;
      return {
        ...base,
        done: n === m.skills.length,
        label: <>Learn: {m.title}</>,
        status: `${n} of ${m.skills.length} skills ticked`,
        detail: `${m.duration} on Microsoft Learn. Tick each skill in the module once you could explain it.`,
        module: m.id,
        actions: [{ label: 'Open on Learn', url: m.msLearnUrl }],
      };
    }
    case 'video': {
      const v = VIDEO_RESOURCES.find((x) => x.id === t.id)!;
      return {
        ...base,
        done: p.watchedVideos.includes(v.id),
        label: <>Watch: {v.title}</>,
        status: `${v.channel}, ${v.duration}`,
        toggle: () => onToggleVideo(v.id),
        actions: [{ label: 'Watch', url: v.url }],
      };
    }
    case 'mcq': {
      const qs = MCQ_QUESTIONS.filter((q) => q.domain === t.domain);
      const n =
        t.mode === 'answer'
          ? qs.filter((q) => p.mcqHistory[q.id]).length
          : qs.filter((q) => p.mcqHistory[q.id]?.correct).length;
      return {
        ...base,
        done: n === qs.length,
        label:
          t.mode === 'answer' ? (
            <>Answer every {domainShort(t.domain)} practice question</>
          ) : (
            <>Get every {domainShort(t.domain)} practice question right</>
          ),
        status: `${n} of ${qs.length} ${t.mode === 'answer' ? 'answered' : 'right'}`,
        detail: t.mode === 'master' ? 'Counts your latest answer to each, so redo the ones you got wrong.' : undefined,
        actions: [{ label: 'Practise', hash: '#/simulator/mcq', domain: t.domain }],
      };
    }
    case 'dax':
    case 'order':
    case 'pqlab': {
      const [list, doneIds, name, hash] =
        t.kind === 'dax'
          ? ([DAX_CHALLENGES, p.daxCompleted, 'DAX builder', '#/simulator/dax'] as const)
          : t.kind === 'order'
          ? ([POWER_QUERY_CHALLENGES, p.pqCompleted, 'Step order', '#/simulator/powerquery'] as const)
          : ([PQ_SCENARIOS, p.pqLabCompleted, 'Power Query lab', '#/simulator/pqlab'] as const);
      const n = t.ids.filter((x) => doneIds.includes(x)).length;
      return {
        ...base,
        done: n === t.ids.length,
        label: (
          <>
            {name}: {titles(t.ids, list)}
          </>
        ),
        status: t.ids.length > 1 ? `${n} of ${t.ids.length} solved` : n ? 'Solved' : 'Not solved yet',
        detail: 'Counts when you get it right without Show solution.',
        actions: [{ label: `Open ${name}`, hash }],
      };
    }
    case 'case': {
      const cs = CASE_STUDIES.find((x) => x.id === t.id)!;
      const got = p.caseStudyScores[cs.id] ?? 0;
      return {
        ...base,
        done: got >= cs.questions.length,
        label: <>Case study: {cs.companyName}, every question right</>,
        status: `Best: ${got} of ${cs.questions.length}`,
        actions: [{ label: 'Open case studies', hash: '#/simulator/casestudy' }],
      };
    }
    case 'drills':
      return {
        ...base,
        done: p.matrixStats.bestStreak >= t.streak,
        label: (
          <>
            Matrix drills: a streak of {t.streak} ({t.focus})
          </>
        ),
        status: `Best streak so far: ${p.matrixStats.bestStreak}`,
        actions: [{ label: 'Open drills', hash: '#/matrix/drills' }],
      };
    case 'score':
      return {
        ...base,
        done: score >= t.min,
        label: <>A readiness score of {t.min} or more</>,
        status: `Now: ${score}`,
        actions: [{ label: 'Home', hash: '#/dashboard' }],
      };
    case 'do':
      return {
        ...base,
        manual: true,
        done: p.studyPlan.done.includes(id),
        label: t.text,
        detail: t.detail,
        actions: t.link ? [t.link] : [],
      };
  }
}

const taskId = (s: PlanSession, i: number) => `${s.id}.${i}`;

/** For Home: how far through the plan, and the next session with its planned date. */
export function planStatus(p: UserProgress, score: number) {
  const noop = () => {};
  const done = (s: PlanSession) => s.tasks.every((t, i) => viewTask(t, taskId(s, i), p, score, noop).done);
  const doneCount = PLAN_SESSIONS.filter(done).length;
  const nextIdx = PLAN_SESSIONS.findIndex((s) => !done(s));
  const next = nextIdx >= 0 ? PLAN_SESSIONS[nextIdx] : null;
  const date = next && p.studyPlan.start ? studyDates(p.studyPlan.start, p.studyPlan.days, nextIdx + 1)[nextIdx] : null;
  return { doneCount, total: PLAN_SESSIONS.length, next, nextIdx, when: date ? (date === todayIso() ? 'today' : date < todayIso() ? `${fmt(date)} (overdue)` : fmt(date)) : null };
}

/* ---------- the panel ---------- */

export const StudyPlanPanel: React.FC<Props> = ({
  progress,
  readinessScore,
  onUpdatePlan,
  onTogglePlanTask,
  onToggleVideo,
  onOpen,
  onOpenModule,
}) => {
  const plan = progress.studyPlan;
  const started = Boolean(plan.start);
  const today = todayIso();

  // Every task's state, and each session's.
  const views = useMemo(() => {
    const m = new Map<string, TaskView[]>();
    for (const s of PLAN_SESSIONS)
      m.set(
        s.id,
        s.tasks.map((t, i) => viewTask(t, taskId(s, i), progress, readinessScore, onToggleVideo))
      );
    return m;
  }, [progress, readinessScore, onToggleVideo]);
  const sessionDone = (s: PlanSession) => views.get(s.id)!.every((t) => t.done);

  const doneCount = PLAN_SESSIONS.filter(sessionDone).length;
  const total = PLAN_SESSIONS.length;
  const totalHours = Math.round(PLAN_SESSIONS.reduce((a, s) => a + s.minutes, 0) / 60);
  const nextIdx = PLAN_SESSIONS.findIndex((s) => !sessionDone(s));
  const next = nextIdx >= 0 ? PLAN_SESSIONS[nextIdx] : null;

  // Planned dates, from the start date.
  const planned = useMemo(
    () => (plan.start ? studyDates(plan.start, plan.days, total) : []),
    [plan.start, plan.days, total]
  );
  const dateOf = (s: PlanSession) => planned[PLAN_SESSIONS.indexOf(s)];
  const due = planned.filter((d) => d < today).length; // sessions that should be done before today
  const behind = Math.max(0, due - doneCount);
  const ahead = Math.max(0, doneCount - planned.filter((d) => d <= today).length);
  const remaining = total - doneCount;
  const projectedFinish = remaining ? lastOf(studyDates(today, plan.days, remaining)) : null;

  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggleOpen = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const replanFromToday = () => onUpdatePlan({ start: studyDaysBack(today, plan.days, Math.max(0, nextIdx)) });

  return (
    <div className="space-y-5">
      {/* Overview, or setting it up */}
      <section data-tour="plan-overview" className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        {!started || editing ? (
          <PlanSetup
            plan={plan}
            started={started}
            total={total}
            totalHours={totalHours}
            onSave={(patch) => {
              onUpdatePlan(patch);
              setEditing(false);
            }}
            onCancel={started ? () => setEditing(false) : undefined}
            onStop={started ? () => (onUpdatePlan({ start: null }), setEditing(false)) : undefined}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  {doneCount === total ? 'Plan finished' : `${doneCount} of ${total} sessions done`}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Started {fmt(plan.start!, false)}, studying {plan.days.map((d) => DAY_NAMES[d]).join(', ')}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {behind > 0 && (
                  <button
                    onClick={replanFromToday}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-on-accent hover:bg-accent-hover"
                    title="Moves the dates on, so your next session is planned for today"
                  >
                    Re-plan from today
                  </button>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-600"
                >
                  Change schedule
                </button>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-slate-950/60 p-3">
                <dt className="text-xs font-semibold text-slate-500">Pace</dt>
                <dd className={`mt-0.5 font-bold ${behind ? 'text-amber-300' : 'text-white'}`}>
                  {doneCount === total
                    ? 'All done'
                    : behind
                    ? `${behind} session${behind > 1 ? 's' : ''} behind`
                    : ahead
                    ? `${ahead} session${ahead > 1 ? 's' : ''} ahead`
                    : 'On track'}
                </dd>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3">
                <dt className="text-xs font-semibold text-slate-500">At this pace you finish</dt>
                <dd className="mt-0.5 font-bold text-white">{projectedFinish ? fmt(projectedFinish) : 'Finished'}</dd>
              </div>
              <div className="rounded-lg bg-slate-950/60 p-3">
                <dt className="text-xs font-semibold text-slate-500">Exam</dt>
                <dd className="mt-0.5 font-bold text-white">
                  {plan.exam ? (
                    <ExamLine exam={plan.exam} today={today} finish={projectedFinish} />
                  ) : (
                    <button onClick={() => setEditing(true)} className="font-semibold text-accent-ink hover:underline">
                      Add your exam date
                    </button>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      {/* Up next */}
      {next && (
        <section data-tour="plan-next" className="rounded-xl border border-accent/50 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-400">
            <span className="text-accent-ink">Up next</span>
            <span>
              Part {STUDY_PLAN.find((p) => p.sessions.includes(next))!.n}, session {nextIdx + 1} of {total}
            </span>
            {started && dateOf(next) && (
              <span>
                Planned for {dateOf(next) === today ? 'today' : fmt(dateOf(next))}
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-lg font-extrabold text-white">{next.title}</h2>
          <SessionBody session={next} tasks={views.get(next.id)!} onToggle={onTogglePlanTask} onOpen={onOpen} onOpenModule={onOpenModule} />
        </section>
      )}

      {/* The daily habit */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-300">
          <span className="font-bold text-white">Every study day:</span> 10 minutes of flashcards before the session,
          starting with To review.
        </p>
        <button onClick={() => onOpen('#/flashcards')} className="shrink-0 self-start text-xs font-semibold text-accent-ink hover:underline sm:self-auto">
          Open flashcards
        </button>
      </div>

      {/* The parts */}
      <div data-tour="plan-parts" className="space-y-4">
        {STUDY_PLAN.map((part) => {
          const n = part.sessions.filter(sessionDone).length;
          const first = started ? dateOf(part.sessions[0]) : null;
          const last = started ? dateOf(part.sessions[part.sessions.length - 1]) : null;
          const mins = part.sessions.reduce((a, s) => a + s.minutes, 0);
          return (
            <section key={part.n} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-300">Part {part.n}</span>
                  {part.domain && <span>{PL300_DOMAINS.find((d) => d.id === part.domain)!.shortTitle}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> about {Math.round(mins / 60)} hours
                  </span>
                  {first && last && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> {fmt(first, false)} to {fmt(last, false)}
                    </span>
                  )}
                  <span className={n === part.sessions.length ? 'text-accent-ink' : ''}>
                    {n} of {part.sessions.length} done
                  </span>
                </div>
                <h3 className="mt-2 text-base font-extrabold text-white">{part.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{part.goal}</p>
              </div>

              <ol className="border-t border-slate-800">
                {part.sessions.map((s) => {
                  const done = sessionDone(s);
                  const isOpen = Boolean(open[s.id]);
                  const tv = views.get(s.id)!;
                  const ticked = tv.filter((t) => t.done).length;
                  const date = started ? dateOf(s) : null;
                  const late = !done && date && date < today;
                  return (
                    <li key={s.id} className="border-b border-slate-800/70 last:border-b-0">
                      <button
                        onClick={() => toggleOpen(s.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-800/40"
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-ink" />
                        ) : s === next ? (
                          <CircleDot className="h-4 w-4 shrink-0 text-accent-ink" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-slate-500" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-semibold ${done ? 'text-slate-400' : 'text-slate-100'}`}>{s.title}</span>
                          <span className="block text-xs text-slate-500">
                            {s.minutes} min · {ticked} of {tv.length} tasks
                            {date && (
                              <>
                                {' · '}
                                <span className={late ? 'text-amber-300' : ''}>{date === today ? 'Today' : fmt(date)}</span>
                              </>
                            )}
                          </span>
                        </span>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="bg-slate-950/50 px-5 pb-5 pt-1">
                          <SessionBody session={s} tasks={tv} onToggle={onTogglePlanTask} onOpen={onOpen} onOpenModule={onOpenModule} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="border-t border-slate-800 bg-slate-950/40 p-5">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Flag className="h-3.5 w-3.5 text-accent-ink" /> By the end of this part you can
                </p>
                <ul className="mt-2 space-y-1">
                  {part.checkpoint.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-400">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- pieces ---------- */

const ExamLine: React.FC<{ exam: string; today: string; finish: string | null }> = ({ exam, today, finish }) => {
  const left = daysBetween(today, exam);
  if (left < 0) return <>{fmt(exam)} (passed)</>;
  const gap = finish ? daysBetween(finish, exam) : left;
  return (
    <>
      {fmt(exam)}, in {left} day{left === 1 ? '' : 's'}
      <span className={`block text-xs font-semibold ${gap < 2 ? 'text-amber-300' : 'text-slate-400'}`}>
        {!finish
          ? 'Plan finished: keep revising'
          : gap >= 2
          ? `Plan ends ${gap} days before it`
          : gap >= 0
          ? 'Plan ends right before it: add a study day'
          : `Plan ends ${-gap} day${gap === -1 ? '' : 's'} after it: add study days`}
      </span>
    </>
  );
};

const SessionBody: React.FC<{
  session: PlanSession;
  tasks: TaskView[];
  onToggle: (id: string) => void;
  onOpen: (hash: string, domain?: DomainId) => void;
  onOpenModule: (id: string) => void;
}> = ({ session, tasks, onToggle, onOpen, onOpenModule }) => (
  <div className="mt-3 space-y-4">
    <p className="text-sm leading-relaxed text-slate-300">{session.focus}</p>

    <ul className="space-y-1">
      {tasks.map((t) => {
        const canTick = t.manual || t.toggle;
        const Icon = t.done ? CheckCircle2 : Circle;
        const icon = <Icon className={`h-[18px] w-[18px] ${t.done ? 'text-accent-ink' : 'text-slate-500'}`} />;
        return (
          <li key={t.id} className="flex gap-3 rounded-lg px-2 py-2 hover:bg-slate-800/40">
            {canTick ? (
              <button
                onClick={() => (t.toggle ? t.toggle() : onToggle(t.id))}
                aria-pressed={t.done}
                aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
                className="-m-1 h-fit shrink-0 rounded-md p-1 hover:bg-slate-800"
              >
                {icon}
              </button>
            ) : (
              <span className="mt-0 shrink-0" title="Ticks itself when you finish it in the app">
                {icon}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold leading-snug ${t.done ? 'text-slate-400' : 'text-slate-100'}`}>{t.label}</p>
              {(t.status || t.detail) && (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {t.status}
                  {t.status && t.detail ? '. ' : ''}
                  {t.detail}
                </p>
              )}
              {(t.actions.length > 0 || t.module) && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  {t.module && (
                    <button onClick={() => onOpenModule(t.module!)} className="inline-flex items-center gap-1 text-xs font-semibold text-accent-ink hover:underline">
                      <Layers className="h-3.5 w-3.5" /> Skills and notes
                    </button>
                  )}
                  {t.actions.map((a) =>
                    'url' in a ? (
                      <a key={a.label} href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-ink hover:underline">
                        {a.label} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <button key={a.label} onClick={() => onOpen(a.hash, a.domain)} className="text-xs font-semibold text-accent-ink hover:underline">
                        {a.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>

    <p className="flex gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-300">
      <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
      <span>
        <span className="font-bold text-white">Done when: </span>
        {session.doneWhen}
      </span>
    </p>
  </div>
);

const PlanSetup: React.FC<{
  plan: StudyPlanState;
  started: boolean;
  total: number;
  totalHours: number;
  onSave: (patch: Partial<StudyPlanState>) => void;
  onCancel?: () => void;
  onStop?: () => void;
}> = ({ plan, started, total, totalHours, onSave, onCancel, onStop }) => {
  const [start, setStart] = useState(plan.start ?? todayIso());
  const [days, setDays] = useState<number[]>(plan.days);
  const [exam, setExam] = useState(plan.exam ?? '');
  const finish = days.length && start ? lastOf(studyDates(start, days, total)) : null;
  const weeks = days.length ? Math.ceil(total / days.length) : 0;
  const tooLate = Boolean(exam && finish && finish >= exam);

  const flip = (d: number) => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-white">{started ? 'Change your schedule' : 'Your PL-300 study plan'}</h2>
        {!started && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
            {total} sessions in six parts, about {totalHours} hours in all. Each session is an hour or so: a focus to read,
            a few tasks (most tick themselves when you do them here), and a check before you move on. Pick your study days
            and the plan gives every session a date, tells you if you fall behind, and whether you’ll finish before your
            exam.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr]">
        <label className="block">
          <span className="text-xs font-semibold text-slate-400">Start on</span>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-accent-ink focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-400">Exam date (if booked)</span>
          <input
            type="date"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-accent-ink focus:outline-none"
          />
        </label>
        <fieldset className="sm:col-span-2 lg:col-span-1">
          <legend className="text-xs font-semibold text-slate-400">Study days</legend>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => flip(d)}
                aria-pressed={days.includes(d)}
                className={`w-12 rounded-lg py-2 text-xs font-semibold transition ${
                  days.includes(d) ? 'bg-accent text-on-accent' : 'border border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {DAY_NAMES[d]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className={`text-sm ${tooLate ? 'text-amber-300' : 'text-slate-300'}`}>
        {!days.length
          ? 'Pick at least one study day.'
          : `${days.length} day${days.length > 1 ? 's' : ''} a week: about ${weeks} weeks, finishing ${fmt(finish!)}.`}
        {tooLate && ' That’s on or after your exam: add a study day or start earlier.'}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!days.length || !start}
          onClick={() => onSave({ start, days, exam: exam || null })}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          {started ? 'Save' : 'Start the plan'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800">
            Cancel
          </button>
        )}
        {onStop && (
          <button
            onClick={() => {
              if (window.confirm('Stop the plan? Its dates go; everything you’ve ticked stays.')) onStop();
            }}
            className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 hover:text-white"
          >
            Stop the plan
          </button>
        )}
      </div>
    </div>
  );
};
