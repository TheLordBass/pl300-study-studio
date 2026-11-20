import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { UserProgress } from '../../types/pl300';
import { DAX_CHALLENGES } from '../../data/examQuestionsData';

interface DaxBuilderPaneProps {
  progress: UserProgress;
  onMarkDaxCompleted: (challengeId: string) => void;
}

export const DaxBuilderPane: React.FC<DaxBuilderPaneProps> = ({
  progress,
  onMarkDaxCompleted,
}) => {
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const challenge = DAX_CHALLENGES[activeChallengeIdx];

  const [slots, setSlots] = useState<(string | null)[]>(() =>
    challenge.correctSlots.map(() => null)
  );
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [checkedState, setCheckedState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setSlots(challenge.correctSlots.map(() => null));
    setActiveSlotIdx(0);
    setCheckedState('idle');
    setRevealed(false);
  }, [activeChallengeIdx, challenge.correctSlots]);

  const handleTokenClick = (token: string) => {
    if (checkedState === 'correct') return;
    setCheckedState('idle');

    // Fill active empty slot or currently selected slot
    const targetIdx =
      slots[activeSlotIdx] === null
        ? activeSlotIdx
        : slots.findIndex((s) => s === null) !== -1
        ? slots.findIndex((s) => s === null)
        : activeSlotIdx;

    const updated = [...slots];
    updated[targetIdx] = token;
    setSlots(updated);

    const nextEmpty = updated.findIndex((s) => s === null);
    if (nextEmpty !== -1) {
      setActiveSlotIdx(nextEmpty);
    }
  };

  const handleClearSlot = (slotIdx: number) => {
    if (checkedState === 'correct') return;
    setCheckedState('idle');
    const updated = [...slots];
    updated[slotIdx] = null;
    setSlots(updated);
    setActiveSlotIdx(slotIdx);
  };

  const handleCheck = () => {
    const allCorrect = challenge.correctSlots.every((ans, i) => slots[i] === ans);
    if (allCorrect) {
      setCheckedState('correct');
      onMarkDaxCompleted(challenge.id);
    } else {
      setCheckedState('incorrect');
    }
  };

  const handleRevealSolution = () => {
    // Showing the answer is a study aid only — it doesn't earn lab credit.
    setSlots([...challenge.correctSlots]);
    setCheckedState('correct');
    setRevealed(true);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Left Challenge Selector */}
      <div className="lg:col-span-4 space-y-2 rounded-3xl bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            DAX Slot Challenges
          </h3>
          <span className="text-xs text-sky-400 font-semibold">
            {progress.daxCompleted.length}/{DAX_CHALLENGES.length} Done
          </span>
        </div>
        {DAX_CHALLENGES.map((item, idx) => {
          const done = progress.daxCompleted.includes(item.id);
          const active = idx === activeChallengeIdx;
          return (
            <button
              key={item.id}
              onClick={() => setActiveChallengeIdx(idx)}
              className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs transition ${
                active
                  ? 'border-sky-400 bg-sky-500/15 text-white'
                  : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="font-semibold">
                  {idx + 1}. {item.title}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400">{item.difficulty}</div>
              </div>
              {done && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
            </button>
          );
        })}
      </div>

      {/* Right Interactive Formula Builder */}
      <div className="lg:col-span-8 rounded-3xl bg-slate-900 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">{challenge.title}</h2>
          </div>
          <span className="rounded-md bg-sky-500/15 px-2.5 py-1 text-xs font-semibold text-sky-300">
            {challenge.difficulty}
          </span>
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm leading-relaxed text-slate-200">{challenge.businessScenario}</p>
          <p className="font-mono text-[11px] text-slate-400">
            Schema: {challenge.schemaContext}
          </p>
        </div>

        {/* Formula Code Editor Area */}
        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Click a slot below, then click a DAX token to place it (click filled slot to clear)
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm leading-loose text-slate-100 sm:text-base">
            {challenge.templateParts.map((part, idx) => {
              if (part.startsWith('__SLOT_')) {
                const slotNum = Number(part.replace('__SLOT_', '').replace('__', ''));
                const val = slots[slotNum];
                const isSelected = activeSlotIdx === slotNum;
                const isRight = checkedState !== 'idle' && val === challenge.correctSlots[slotNum];
                const isWrong = checkedState === 'incorrect' && val !== challenge.correctSlots[slotNum];

                let slotStyle =
                  'border-slate-600 bg-slate-900 text-slate-400 hover:border-sky-400';
                if (isRight) {
                  slotStyle = 'border-emerald-400 bg-emerald-500/20 text-emerald-200';
                } else if (isWrong) {
                  slotStyle = 'border-rose-400 bg-rose-500/20 text-rose-200';
                } else if (val) {
                  slotStyle = 'border-sky-400 bg-sky-500/20 text-sky-200';
                } else if (isSelected) {
                  slotStyle = 'border-accent bg-accent/10 text-accent';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => (val ? handleClearSlot(slotNum) : setActiveSlotIdx(slotNum))}
                    className={`min-w-[110px] rounded-lg border-2 border-dashed px-3 py-1 text-center text-xs font-bold transition sm:text-sm ${slotStyle}`}
                  >
                    {val ?? `[ Slot ${slotNum + 1} ]`}
                  </button>
                );
              }
              return (
                <span key={idx} className="whitespace-pre-wrap text-slate-200">
                  {part}
                </span>
              );
            })}
          </div>
        </div>

        {/* DAX Token Pool */}
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-300">DAX Function & Keyword Pool:</div>
          <div className="flex flex-wrap gap-2">
            {challenge.tokenPool.map((token) => (
              <button
                key={token}
                onClick={() => handleTokenClick(token)}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-3.5 py-2 font-mono text-xs font-semibold text-sky-200 transition hover:border-sky-400 hover:bg-slate-700"
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex gap-2">
            <button
              disabled={slots.some((s) => s === null)}
              onClick={handleCheck}
              className="rounded-2xl bg-accent px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-accent-hover disabled:opacity-40"
            >
              Validate Formula
            </button>
            <button
              onClick={() => {
                setSlots(challenge.correctSlots.map(() => null));
                setActiveSlotIdx(0);
                setCheckedState('idle');
                setRevealed(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
          <button
            onClick={handleRevealSolution}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Show Solution
          </button>
        </div>

        {/* Feedback */}
        {checkedState === 'incorrect' && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
            <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>
              Not quite! Click any highlighted red slot to clear it and try another DAX modifier.
            </span>
          </div>
        )}

        {checkedState === 'correct' && (
          <div className="space-y-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {revealed
                ? 'Solution revealed — not counted. Clear and rebuild it to earn credit.'
                : 'Formula Correct! Evaluation Context Breakdown:'}
            </div>
            <p className="leading-relaxed text-slate-200">{challenge.explanation}</p>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Context Trap:</strong> {challenge.contextTrap}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
