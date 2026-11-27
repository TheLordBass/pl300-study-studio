/* Folding two copies of progress together, for when two devices both changed
   things since they last agreed. (A device with nothing new just takes the
   other copy as it is, so unticking a skill does carry over; merging only
   happens when both sides moved.)

   Nothing done on either side is lost:
   - ticked skills, watched videos and finished labs: the union
   - answers and flashcard ratings: whichever was touched most recently
   - case study scores: the higher
   - notes: if they differ, the longer one (it usually contains the other)
   - drill counters: both sides' new attempts are added to what they agreed on
   - custom flashcards: the union, by id */

import { UserProgress } from '../types/pl300';
import { normalizeProgress } from '../utils/progressHelpers';

export type Counters = { total: number; correct: number };

const union = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));

function latest<T>(
  a: Record<string, T>,
  b: Record<string, T>,
  stamp: (v: T) => number
): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (!out[k] || stamp(v) > stamp(out[k])) out[k] = v;
  }
  return out;
}

/** `base`: the drill counters both sides last agreed on (null if unknown: then the higher wins). */
export function mergeProgress(local: UserProgress, remote: UserProgress, base: Counters | null): UserProgress {
  const L = normalizeProgress(local);
  const R = normalizeProgress(remote);

  const notes: Record<string, string> = { ...L.moduleNotes };
  for (const [k, v] of Object.entries(R.moduleNotes)) {
    const mine = notes[k] ?? '';
    if (!mine.trim() || (v !== mine && v.length > mine.length)) notes[k] = v;
  }

  const scores: Record<string, number> = { ...L.caseStudyScores };
  for (const [k, v] of Object.entries(R.caseStudyScores)) scores[k] = Math.max(scores[k] ?? 0, v);

  const counter = (key: keyof Counters) =>
    base
      ? Math.max(0, base[key] + (L.matrixStats[key] - base[key]) + (R.matrixStats[key] - base[key]))
      : Math.max(L.matrixStats[key], R.matrixStats[key]);
  const total = counter('total');

  const cards = new Map(L.customFlashcards.map((c) => [c.id, c]));
  for (const c of R.customFlashcards) if (!cards.has(c.id)) cards.set(c.id, c);

  return {
    completedSkills: union(L.completedSkills, R.completedSkills),
    watchedVideos: union(L.watchedVideos, R.watchedVideos),
    moduleNotes: notes,
    mcqHistory: latest(L.mcqHistory, R.mcqHistory, (v) => v.lastAnswered || 0),
    daxCompleted: union(L.daxCompleted, R.daxCompleted),
    pqCompleted: union(L.pqCompleted, R.pqCompleted),
    pqLabCompleted: union(L.pqLabCompleted, R.pqLabCompleted),
    caseStudyScores: scores,
    matrixStats: {
      total,
      correct: Math.min(total, counter('correct')),
      bestStreak: Math.max(L.matrixStats.bestStreak, R.matrixStats.bestStreak),
    },
    flashcardRatings: latest(L.flashcardRatings, R.flashcardRatings, (v) => v.lastReviewed || 0),
    customFlashcards: Array.from(cards.values()),
  };
}

/** True if there's nothing in this progress yet (a fresh device). */
export function isEmptyProgress(p: UserProgress): boolean {
  return (
    !p.completedSkills.length &&
    !p.watchedVideos.length &&
    !Object.keys(p.moduleNotes).length &&
    !Object.keys(p.mcqHistory).length &&
    !p.daxCompleted.length &&
    !p.pqCompleted.length &&
    !p.pqLabCompleted.length &&
    !Object.keys(p.caseStudyScores).length &&
    !p.matrixStats.total &&
    !Object.keys(p.flashcardRatings).length &&
    !p.customFlashcards.length
  );
}
