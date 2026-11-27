import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { markAllToursSeen, markTourSeen, TOURS, TourStep } from '../data/tours';

/** The first visible element with data-tour={at} (the rail and phone bar can both carry one). */
function findTarget(at: string): HTMLElement | null {
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${at}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el;
  }
  return null;
}

const PAD = 6;
const GAP = 12;
const CARD_W = 320;

interface Props {
  tourKey: string;
  onDone: () => void;
}

/** A spotlight over one thing at a time, with a short note beside it. */
export const Tour: React.FC<Props> = ({ tourKey, onDone }) => {
  // Only steps whose target is on screen now, in the order they're listed.
  const [steps] = useState<TourStep[]>(() => (TOURS[tourKey]?.steps ?? []).filter((s) => findTarget(s.at)));
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(160);

  const step = steps[i];

  const finish = useCallback(
    (all = false) => {
      if (all) markAllToursSeen();
      else markTourSeen(tourKey);
      onDone();
    },
    [tourKey, onDone]
  );

  // Nothing to show at this width: count it as seen.
  useEffect(() => {
    if (!steps.length) finish();
  }, [steps.length, finish]);

  const measure = useCallback(() => {
    if (!step) return;
    const el = findTarget(step.at);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  // Bring the step's target into view, then measure it.
  useEffect(() => {
    if (!step) return;
    const el = findTarget(step.at);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const fits = r.top >= 70 && r.bottom <= window.innerHeight - 90;
    if (!fits) el.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? 'start' : 'center', behavior: 'smooth' });
    measure();
    const t = setTimeout(measure, 380);
    return () => clearTimeout(t);
  }, [step, measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  useLayoutEffect(() => {
    if (card.current) setCardH(card.current.offsetHeight);
    card.current?.focus({ preventScroll: true });
  }, [i, rect]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') setI((n) => Math.min(n + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, steps.length]);

  if (!step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(CARD_W, vw - 32);

  // The hole, clamped to the screen so a tall target doesn't vanish.
  const hole = rect
    ? {
        top: Math.max(rect.top - PAD, 4),
        left: Math.max(rect.left - PAD, 4),
        right: Math.min(rect.right + PAD, vw - 4),
        bottom: Math.min(rect.bottom + PAD, vh - 4),
      }
    : null;

  // The note: beside a narrow target, else below or above it.
  let top = vh / 2 - cardH / 2;
  let left = vw / 2 - w / 2;
  if (hole) {
    // A narrow target (the rail, or a button in it): put the note beside it.
    const narrow = hole.right - hole.left < 140;
    if (narrow && hole.right + GAP + w < vw) {
      left = hole.right + GAP;
      const tall = hole.bottom - hole.top > vh * 0.5;
      top = Math.min(Math.max(16, tall ? hole.top + 40 : hole.top + (hole.bottom - hole.top) / 2 - cardH / 2), vh - cardH - 16);
    } else {
      left = Math.min(Math.max(16, hole.left), vw - w - 16);
      const below = hole.bottom + GAP;
      const above = hole.top - GAP - cardH;
      top = below + cardH < vh - 8 ? below : above > 8 ? above : Math.max(16, vh - cardH - 16);
    }
  }

  const last = i === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Walkthrough">
      {/* Click outside the note: nothing, so a stray tap doesn't lose the tour. */}
      <div className="absolute inset-0" />
      {hole ? (
        <div
          className="pointer-events-none absolute rounded-xl outline outline-2 outline-offset-0 outline-accent transition-all duration-300"
          style={{
            top: hole.top,
            left: hole.left,
            width: hole.right - hole.left,
            height: hole.bottom - hole.top,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}

      <div
        ref={card}
        tabIndex={-1}
        className="absolute rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl outline-none transition-[top,left] duration-300"
        style={{ top, left, width: w }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-extrabold text-white">{step.title}</h2>
          <button onClick={() => finish()} aria-label="Close the walkthrough" className="-m-1 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs tabular-nums text-slate-500">
            {i + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-1.5">
            {i === 0 ? (
              <button onClick={() => finish(true)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">
                Don’t show tips
              </button>
            ) : (
              <button onClick={() => setI(i - 1)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800">
                Back
              </button>
            )}
            <button
              onClick={() => (last ? finish() : setI(i + 1))}
              className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-bold text-on-accent hover:bg-accent-hover"
              autoFocus
            >
              {last ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
