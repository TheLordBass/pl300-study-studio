import { DomainId, UserProgress } from '../types/pl300';
import { LEARNING_MODULES } from '../data/curriculumData';
import {
  CASE_STUDIES,
  DAX_CHALLENGES,
  MCQ_QUESTIONS,
  POWER_QUERY_CHALLENGES,
} from '../data/examQuestionsData';
import { PQ_SCENARIOS } from '../pqlab/scenarios';

export const STORAGE_KEY = 'pl300_study_studio_progress_v1';


export const INITIAL_PROGRESS: UserProgress = {
  completedSkills: [],
  watchedVideos: [],
  moduleNotes: {},
  mcqHistory: {},
  daxCompleted: [],
  pqCompleted: [],
  pqLabCompleted: [],
  caseStudyScores: {},
  matrixStats: { total: 0, correct: 0, bestStreak: 0 },
  flashcardRatings: {},
  customFlashcards: [],
};

export function normalizeProgress(parsed: Partial<UserProgress>): UserProgress {
  return {
    ...INITIAL_PROGRESS,
    ...parsed,
    completedSkills: Array.isArray(parsed.completedSkills) ? parsed.completedSkills : [],
    watchedVideos: Array.isArray(parsed.watchedVideos) ? parsed.watchedVideos : [],
    moduleNotes:
      parsed.moduleNotes && typeof parsed.moduleNotes === 'object' ? parsed.moduleNotes : {},
    mcqHistory:
      parsed.mcqHistory && typeof parsed.mcqHistory === 'object' ? parsed.mcqHistory : {},
    daxCompleted: Array.isArray(parsed.daxCompleted) ? parsed.daxCompleted : [],
    pqCompleted: Array.isArray(parsed.pqCompleted) ? parsed.pqCompleted : [],
    pqLabCompleted: Array.isArray(parsed.pqLabCompleted) ? parsed.pqLabCompleted : [],
    caseStudyScores:
      parsed.caseStudyScores && typeof parsed.caseStudyScores === 'object'
        ? parsed.caseStudyScores
        : {},
    matrixStats: {
      ...INITIAL_PROGRESS.matrixStats,
      ...(parsed.matrixStats ?? {}),
    },
    flashcardRatings:
      parsed.flashcardRatings && typeof parsed.flashcardRatings === 'object'
        ? parsed.flashcardRatings
        : {},
    customFlashcards: Array.isArray(parsed.customFlashcards) ? parsed.customFlashcards : [],
  };
}

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS;
    return normalizeProgress(JSON.parse(raw) as Partial<UserProgress>);
  } catch {
    return INITIAL_PROGRESS;
  }
}

export function parseProgressJson(raw: string): UserProgress {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Backup file must contain a valid PL-300 progress JSON object.');
  }
  return normalizeProgress(parsed as Partial<UserProgress>);
}

export function saveProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export interface DomainAnalytics {
  domainId: DomainId;
  skillsDone: number;
  skillsTotal: number;
  mcqAttempted: number;
  mcqCorrect: number;
  mcqTotal: number;
  masteryPct: number;
}

export function computeDomainAnalytics(progress: UserProgress): Record<DomainId, DomainAnalytics> {
  const domains: DomainId[] = ['prepare', 'model', 'visualize', 'manage'];
  const result = {} as Record<DomainId, DomainAnalytics>;

  for (const domainId of domains) {
    const domainSkills = LEARNING_MODULES.filter((m) => m.domain === domainId).flatMap(
      (m) => m.skills
    );
    const skillsDone = domainSkills.filter((s) =>
      progress.completedSkills.includes(s.id)
    ).length;

    const domainMcqs = MCQ_QUESTIONS.filter((q) => q.domain === domainId);
    const mcqAttempted = domainMcqs.filter((q) => Boolean(progress.mcqHistory[q.id])).length;
    const mcqCorrect = domainMcqs.filter((q) => progress.mcqHistory[q.id]?.correct).length;

    const skillScore = domainSkills.length > 0 ? skillsDone / domainSkills.length : 0;
    const quizScore = domainMcqs.length > 0 ? mcqCorrect / domainMcqs.length : 0;

    // Extra practical credit for interactive builders
    let labBonus = 0;
    if (domainId === 'prepare') {
      labBonus =
        POWER_QUERY_CHALLENGES.length > 0
          ? (progress.pqCompleted.length + progress.pqLabCompleted.length) /
            (POWER_QUERY_CHALLENGES.length + PQ_SCENARIOS.length)
          : 0;
    } else if (domainId === 'model') {
      const modelDax = DAX_CHALLENGES.filter((d) => d.domain === 'model');
      const modelDaxDone = modelDax.filter((d) => progress.daxCompleted.includes(d.id)).length;
      labBonus = modelDax.length > 0 ? modelDaxDone / modelDax.length : 0;
    } else if (domainId === 'manage') {
      const manageDax = DAX_CHALLENGES.filter((d) => d.domain === 'manage');
      const manageDaxDone = manageDax.filter((d) => progress.daxCompleted.includes(d.id)).length;
      labBonus = manageDax.length > 0 ? manageDaxDone / manageDax.length : 0;
    } else {
      labBonus = skillScore;
    }

    const masteryPct = Math.round((skillScore * 0.35 + quizScore * 0.45 + labBonus * 0.2) * 100);

    result[domainId] = {
      domainId,
      skillsDone,
      skillsTotal: domainSkills.length,
      mcqAttempted,
      mcqCorrect,
      mcqTotal: domainMcqs.length,
      masteryPct,
    };
  }

  return result;
}

export function computeReadinessScore(
  analytics: Record<DomainId, DomainAnalytics>,
  progress: UserProgress
): number {
  const weighted =
    analytics.prepare.masteryPct * 0.275 +
    analytics.model.masteryPct * 0.275 +
    analytics.visualize.masteryPct * 0.275 +
    analytics.manage.masteryPct * 0.175;

  const caseStudyEarned = Object.values(progress.caseStudyScores).reduce((acc, s) => acc + s, 0);
  const caseStudyTotal = CASE_STUDIES.reduce((acc, cs) => acc + cs.questions.length, 0);
  const caseStudyPct = caseStudyTotal > 0 ? (caseStudyEarned / caseStudyTotal) * 100 : 0;

  const matrixPct =
    progress.matrixStats.total > 0
      ? Math.min(100, (progress.matrixStats.correct / Math.max(8, progress.matrixStats.total)) * 100)
      : 0;

  const compositePct = weighted * 0.8 + caseStudyPct * 0.12 + matrixPct * 0.08;
  return Math.min(1000, Math.round(compositePct * 10));
}
