import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  DatabaseZap,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { PQStepOption, TablePreview, UserProgress } from '../../types/pl300';
import { POWER_QUERY_CHALLENGES } from '../../data/examQuestionsData';

interface PowerQuerySequencerPaneProps {
  progress: UserProgress;
  onMarkPqCompleted: (challengeId: string) => void;
}

const PreviewTable: React.FC<{ title: string; data: TablePreview; badgeColor: string }> = ({
  title,
  data,
  badgeColor,
}) => (
  <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
    <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
        {title}
      </span>
      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>
        {data.headers.length} cols
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-900/90 text-slate-300">
          <tr>
            {data.headers.map((h) => (
              <th key={h} className="border-b border-slate-800 px-2.5 py-1.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70 text-slate-400">
          {data.rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-2.5 py-1.5 whitespace-nowrap">
                  {cell || <span className="italic text-slate-600">null</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const PowerQuerySequencerPane: React.FC<PowerQuerySequencerPaneProps> = ({
  progress,
  onMarkPqCompleted,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const challenge = POWER_QUERY_CHALLENGES[activeIdx];
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
    setStatus('idle');
    setRevealed(false);
  }, [activeIdx]);

  const stepById = new Map<string, PQStepOption>(
    challenge.availableSteps.map((s) => [s.id, s])
  );

  const remainingSteps = challenge.availableSteps.filter(
    (s) => !selectedIds.includes(s.id)
  );

  const addStep = (id: string) => {
    if (status === 'correct') return;
    setStatus('idle');
    setSelectedIds((prev) => [...prev, id]);
  };

  const removeStep = (id: string) => {
    if (status === 'correct') return;
    setStatus('idle');
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    if (status === 'correct') return;
    const target = index + direction;
    if (target < 0 || target >= selectedIds.length) return;
    setStatus('idle');
    const copy = [...selectedIds];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setSelectedIds(copy);
  };

  const validateSequence = () => {
    const ok =
      selectedIds.length === challenge.correctStepOrder.length &&
      selectedIds.every((id, idx) => id === challenge.correctStepOrder[idx]);
    if (ok) {
      setStatus('correct');
      onMarkPqCompleted(challenge.id);
    } else {
      setStatus('incorrect');
    }
  };

  const revealSolution = () => {
    // Study aid only — doesn't earn lab credit.
    setSelectedIds([...challenge.correctStepOrder]);
    setStatus('correct');
    setRevealed(true);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Challenge List */}
      <div className="lg:col-span-4 space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Power Query Scenarios
          </h3>
          <span className="text-xs font-semibold text-amber-400">
            {progress.pqCompleted.length}/{POWER_QUERY_CHALLENGES.length} Done
          </span>
        </div>
        {POWER_QUERY_CHALLENGES.map((item, idx) => {
          const done = progress.pqCompleted.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => setActiveIdx(idx)}
              className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs transition ${
                idx === activeIdx
                  ? 'border-accent bg-accent/15 text-white'
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

      {/* Interactive Sequencer */}
      <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">{challenge.title}</h2>
          </div>
          <span className="rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
            {challenge.difficulty}
          </span>
        </div>

        <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-200">
          {challenge.scenario}
        </p>

        {/* Before / After Preview */}
        <div className="grid gap-3 md:grid-cols-2">
          <PreviewTable
            title="Raw Source Input"
            data={challenge.messyTablePreview}
            badgeColor="bg-rose-500/15 text-rose-300"
          />
          <PreviewTable
            title="Target Clean Output"
            data={challenge.cleanTablePreview}
            badgeColor="bg-emerald-500/15 text-emerald-300"
          />
        </div>

        {/* Step Builder Columns */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Available Steps */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Available Transformations
            </div>
            <div className="space-y-2">
              {remainingSteps.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                  All steps added to Applied Steps →
                </div>
              ) : (
                remainingSteps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => addStep(step.id)}
                    className="flex w-full items-start justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-left transition hover:border-accent/50"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{step.label}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">{step.detail}</div>
                      <span
                        className={`mt-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          step.foldsQuery
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        <DatabaseZap className="h-3 w-3" />
                        {step.foldsQuery ? 'Folds to Source' : 'Breaks Folding / Local'}
                      </span>
                    </div>
                    <Plus className="mt-1 h-4 w-4 shrink-0 text-amber-400" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ordered Applied Steps */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
              <span>2. Applied Steps (Top → Bottom)</span>
              <span className="text-[11px] font-normal text-slate-400">
                {selectedIds.length}/{challenge.correctStepOrder.length}
              </span>
            </div>
            <div className="space-y-2">
              {selectedIds.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                  Click transformations on the left in exact chronological order.
                </div>
              ) : (
                selectedIds.map((id, idx) => {
                  const step = stepById.get(id)!;
                  const isSpotRight =
                    status !== 'idle' && challenge.correctStepOrder[idx] === id;
                  const isSpotWrong =
                    status === 'incorrect' && challenge.correctStepOrder[idx] !== id;

                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between gap-2 rounded-2xl border p-2.5 ${
                        isSpotRight
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : isSpotWrong
                          ? 'border-rose-500/50 bg-rose-500/10'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-amber-300">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-white">{step.label}</div>
                          <div className="text-[10px] text-slate-400">
                            {step.foldsQuery ? 'Query Folding OK' : 'Local Evaluation'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveStep(idx, -1)}
                          disabled={idx === 0}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveStep(idx, 1)}
                          disabled={idx === selectedIds.length - 1}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeStep(id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300"
                          title="Remove step"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              disabled={selectedIds.length !== challenge.correctStepOrder.length}
              onClick={validateSequence}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2 text-xs font-bold text-on-accent transition hover:bg-accent-hover disabled:opacity-40"
            >
              Verify Step Order
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setSelectedIds([]);
                setStatus('idle');
                setRevealed(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
          <button
            onClick={revealSolution}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Show Ideal Sequence
          </button>
        </div>

        {status === 'incorrect' && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
            <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>
              Check step dependencies or Query Folding order — remember to drop junk rows, filter, and clean before promoting/unpivoting or breaking folding!
            </span>
          </div>
        )}

        {status === 'correct' && (
          <div className="space-y-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {revealed
                ? 'Ideal sequence revealed — not counted. Reset and rebuild it to earn credit.'
                : 'Optimal Sequence Verified!'}
            </div>
            <p className="leading-relaxed text-slate-200">{challenge.explanation}</p>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-sky-200">
              <strong>Query Folding & M Note:</strong> {challenge.queryFoldingNote}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
