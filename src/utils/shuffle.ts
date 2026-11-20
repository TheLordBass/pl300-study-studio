/**
 * Answer-position randomisation.
 *
 * The authored question banks put most correct answers in option B (16/20 MCQs,
 * 9/10 case-study questions), list Power Query steps in their correct order and
 * put DAX answer tokens first in the pool — all of which can be "solved" by
 * pattern instead of knowledge. These helpers reshuffle once per page load.
 */

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Shuffle so the result never equals the given order (when that's possible). */
export function shuffleAwayFrom<T>(items: readonly T[], avoid: readonly T[]): T[] {
  if (items.length < 2) return [...items];
  for (let attempt = 0; attempt < 10; attempt++) {
    const out = shuffle(items);
    if (out.some((item, i) => item !== avoid[i])) return out;
  }
  return [...items].reverse();
}

/** Shuffle options and remap the indices that point at the correct ones. */
export function shuffleOptions(
  options: readonly string[],
  correct: readonly number[]
): { options: string[]; correct: number[] } {
  const order = shuffle(options.map((_, i) => i));
  return {
    options: order.map((i) => options[i]),
    correct: correct.map((c) => order.indexOf(c)).sort((a, b) => a - b),
  };
}
