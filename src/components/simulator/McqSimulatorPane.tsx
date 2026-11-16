import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  RotateCcw,
  Trophy,
  XCircle,
} from 'lucide-react';
import { DomainId, MCQQuestion, UserProgress } from '../../types/pl300';
import { PL300_DOMAINS } from '../../data/curriculumData';
import { MCQ_QUESTIONS } from '../../data/examQuestionsData';

interface McqSimulatorPaneProps {
  progress: UserProgress;
  domainFilter: DomainId | 'all';
  onChangeDomainFilter: (d: DomainId | 'all') => void;
  onRecordMcq: (questionId: string, correct: boolean) => void;
}

export const McqSimulatorPane: React.FC<McqSimulatorPaneProps> = ({
  progress,
  domainFilter,
  onChangeDomainFilter,
  onRecordMcq,
}) => {
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | MCQQuestion['difficulty']>('All');
  const [mode, setMode] = useState<'study' | 'timed'>('study');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const filteredQuestions = useMemo(() => {
    return MCQ_QUESTIONS.filter((q) => {
      if (domainFilter !== 'all' && q.domain !== domainFilter) return false;
      if (difficultyFilter !== 'All' && q.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [domainFilter, difficultyFilter]);

  const safeIdx = Math.min(currentIdx, Math.max(0, filteredQuestions.length - 1));
  const currentQ = filteredQuestions[safeIdx];

  useEffect(() => {
    setCurrentIdx(0);
  }, [domainFilter, difficultyFilter]);

  useEffect(() => {
    if (mode !== 'timed' || examSubmitted) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode, examSubmitted]);

  const startTimedMode = () => {
    setMode('timed');
    setSelectedOptions({});
    setRevealedIds({});
    setExamSubmitted(false);
    setSecondsLeft(Math.max(5, filteredQuestions.length) * 90);
    setCurrentIdx(0);
  };

  const handleSelectOption = (optionIdx: number) => {
    if (!currentQ) return;
    if (mode === 'study' && revealedIds[currentQ.id]) return;
    if (mode === 'timed' && examSubmitted) return;

    setSelectedOptions((prev) => ({ ...prev, [currentQ.id]: optionIdx }));

    if (mode === 'study') {
      setRevealedIds((prev) => ({ ...prev, [currentQ.id]: true }));
      const isCorrect = currentQ.correctIndices.includes(optionIdx);
      onRecordMcq(currentQ.id, isCorrect);
    }
  };

  const handleSubmitTimedExam = () => {
    setExamSubmitted(true);
    filteredQuestions.forEach((q) => {
      const chosen = selectedOptions[q.id];
      if (chosen !== undefined) {
        onRecordMcq(q.id, q.correctIndices.includes(chosen));
      }
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timedCorrectCount = filteredQuestions.filter((q) => {
    const chosen = selectedOptions[q.id];
    return chosen !== undefined && q.correctIndices.includes(chosen);
  }).length;

  const timedScaledScore =
    filteredQuestions.length > 0
      ? Math.round((timedCorrectCount / filteredQuestions.length) * 1000)
      : 0;

  return (
    <div className="space-y-4">
      {/* Filter & Mode Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={domainFilter}
            onChange={(e) => onChangeDomainFilter(e.target.value as DomainId | 'all')}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">All Domains ({MCQ_QUESTIONS.length} Qs)</option>
            {PL300_DOMAINS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.shortTitle} ({d.weightRange})
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) =>
              setDifficultyFilter(e.target.value as 'All' | MCQQuestion['difficulty'])
            }
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
          >
            <option value="All">All Difficulties</option>
            <option value="Core">Core</option>
            <option value="Tricky">Tricky</option>
            <option value="Exam Trap">Exam Trap</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setMode('study');
              setExamSubmitted(false);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'study'
                ? 'bg-amber-400 text-slate-950'
                : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Study Mode (Instant Feedback)
          </button>
          <button
            onClick={startTimedMode}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'timed'
                ? 'bg-sky-400 text-slate-950'
                : 'border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Timed Exam Mode
          </button>
          {mode === 'timed' && (
            <span className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs font-bold text-sky-300">
              {formatTime(secondsLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Timed Exam Results Banner */}
      {mode === 'timed' && examSubmitted && (
        <div
          className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
            timedScaledScore >= 700
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : 'border-amber-500/40 bg-amber-500/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <Trophy
              className={`h-8 w-8 ${
                timedScaledScore >= 700 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <div>
              <h3 className="text-base font-bold text-white">
                Timed Mock Score: {timedScaledScore} / 1000 ({timedCorrectCount}/
                {filteredQuestions.length} Correct)
              </h3>
              <p className="text-xs text-slate-300">
                {timedScaledScore >= 700
                  ? 'Passing pace! Review any missed scenarios below to lock in mastery.'
                  : 'Below the 700 pass mark. Click through each question below to inspect explanations and exam traps.'}
              </p>
            </div>
          </div>
          <button
            onClick={startTimedMode}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white border border-slate-700 hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retake Timed Set
          </button>
        </div>
      )}

      {!currentQ ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
          No questions match the selected filters.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Question Navigator Rail */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Question Map</span>
              <span className="text-slate-400">
                {safeIdx + 1} / {filteredQuestions.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {filteredQuestions.map((q, idx) => {
                const chosen = selectedOptions[q.id];
                const isRevealed =
                  (mode === 'study' && revealedIds[q.id]) ||
                  (mode === 'timed' && examSubmitted);
                const isCorrect =
                  chosen !== undefined && q.correctIndices.includes(chosen);
                const flagged = flaggedIds[q.id];
                const prevDone = progress.mcqHistory[q.id];

                let pillStyle = 'border-slate-800 bg-slate-950 text-slate-400';
                if (isRevealed) {
                  pillStyle = isCorrect
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                    : 'border-rose-500/50 bg-rose-500/20 text-rose-300';
                } else if (chosen !== undefined) {
                  pillStyle = 'border-sky-500/50 bg-sky-500/20 text-sky-200';
                } else if (prevDone?.correct) {
                  pillStyle = 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`relative rounded-lg border py-2 text-xs font-semibold transition ${pillStyle} ${
                      idx === safeIdx ? 'ring-2 ring-amber-400' : ''
                    }`}
                  >
                    {idx + 1}
                    {flagged && (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {mode === 'timed' && !examSubmitted && (
              <button
                onClick={handleSubmitTimedExam}
                className="mt-4 w-full rounded-xl bg-amber-400 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
              >
                Finish & Grade Exam ({Object.keys(selectedOptions).length}/{filteredQuestions.length})
              </button>
            )}
          </div>

          {/* Active Question Card */}
          <div className="lg:col-span-9 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                  {PL300_DOMAINS.find((d) => d.id === currentQ.domain)?.shortTitle}
                </span>
                <span className="rounded-md bg-slate-950 border border-slate-800 px-2.5 py-1 text-[11px] text-slate-300">
                  {currentQ.topic}
                </span>
                <span
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                    currentQ.difficulty === 'Exam Trap'
                      ? 'bg-rose-500/15 text-rose-300'
                      : currentQ.difficulty === 'Tricky'
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-sky-500/15 text-sky-300'
                  }`}
                >
                  {currentQ.difficulty}
                </span>
              </div>

              <button
                onClick={() =>
                  setFlaggedIds((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))
                }
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  flaggedIds[currentQ.id]
                    ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                    : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                {flaggedIds[currentQ.id] ? 'Flagged' : 'Flag for Review'}
              </button>
            </div>

            {/* Scenario */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-relaxed text-slate-300">
              {currentQ.scenario}
            </div>

            <h3 className="text-base font-semibold text-white">{currentQ.question}</h3>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const chosen = selectedOptions[currentQ.id] === idx;
                const isRevealed =
                  (mode === 'study' && revealedIds[currentQ.id]) ||
                  (mode === 'timed' && examSubmitted);
                const isCorrectOpt = currentQ.correctIndices.includes(idx);

                let style =
                  'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-600';
                if (isRevealed) {
                  if (isCorrectOpt) {
                    style = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-100';
                  } else if (chosen && !isCorrectOpt) {
                    style = 'border-rose-500/60 bg-rose-500/15 text-rose-100';
                  } else {
                    style = 'border-slate-800/60 bg-slate-950/30 text-slate-500';
                  }
                } else if (chosen) {
                  style = 'border-sky-400 bg-sky-500/15 text-white';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ${style}`}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isRevealed && isCorrectOpt && (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    )}
                    {isRevealed && chosen && !isCorrectOpt && (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Panel */}
            {((mode === 'study' && revealedIds[currentQ.id]) ||
              (mode === 'timed' && examSubmitted)) && (
              <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Why this answer works
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-200">
                    {currentQ.explanation}
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div>
                    <span className="font-semibold">Exam Tip: </span>
                    {currentQ.examTip}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                disabled={safeIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-medium text-slate-200 disabled:opacity-40 hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              {mode === 'study' && revealedIds[currentQ.id] && (
                <button
                  onClick={() => {
                    setRevealedIds((prev) => ({ ...prev, [currentQ.id]: false }));
                    setSelectedOptions((prev) => {
                      const next = { ...prev };
                      delete next[currentQ.id];
                      return next;
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry Question
                </button>
              )}

              <button
                disabled={safeIdx >= filteredQuestions.length - 1}
                onClick={() =>
                  setCurrentIdx((i) => Math.min(filteredQuestions.length - 1, i + 1))
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40 hover:bg-amber-300"
              >
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
