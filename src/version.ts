/* The app's release version and its changelog.

   Raise APP_VERSION (and "version" in package.json to match) with every
   release that changes something people use, and add an entry at the top of
   CHANGELOG. Anyone who used an older release sees that entry once, as the
   "What's new" note on their next visit (WhatsNew.tsx). Help → About lists
   the whole history.

   Major: a change to how progress is stored or synced.
   Minor: something new to do.
   Patch: fixes and polish only. */

export const APP_VERSION = '2.0.0';
export const RELEASED = '2026-11-27';

/** Bumped only when the shape of synced progress changes, so an older build can tell. */
export const DATA_SCHEMA = 1;

export interface Release {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const CHANGELOG: Release[] = [
  {
    version: '2.0.0',
    date: '2026-11-27',
    title: 'Link your devices',
    changes: [
      'Sync your progress between laptop and phone with a sync code. No account or email needed.',
      'Every synced save is numbered, so two devices never overwrite each other, and you can roll back to any of the last 15 saves.',
      'A walkthrough on each page the first time you open it, and a full guide under Help.',
      'Version numbers and this "What’s new" note after each update.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-11-27',
    title: 'A plainer look',
    changes: [
      'Home shows your score and stats in one panel, with your weakest area underneath.',
      'Simpler wording and tabs across the app, and fixes for layout glitches in light mode.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-11-27',
    title: 'Forest green',
    changes: ['A new forest green and cream design, a rounder font, and an icon rail for navigation.'],
  },
  {
    version: '1.2.0',
    date: '2026-11-20',
    title: 'Run it for real',
    changes: [
      'DAX challenges run on a sample model with the databites DAX engine.',
      'Power Query Lab: eight messy datasets to clean in a working editor.',
      'A DAX cheat sheet and Power Query how-to guides with drawings of the editor.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-11-20',
    title: 'Fixes',
    changes: [
      'Answer options are shuffled, the timed exam submits itself at 0:00, and flashcard review no longer skips cards.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-16',
    title: 'First release',
    changes: ['Study plan, practice questions, DAX and Power Query labs, case studies, drills and flashcards.'],
  },
];

/** -1, 0 or 1, comparing "1.10.0" style versions part by part. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}
