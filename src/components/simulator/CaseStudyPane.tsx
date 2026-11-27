import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Highlighter,
  Layers,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { UserProgress } from '../../types/pl300';
import { CASE_STUDIES } from '../../data/examQuestionsData';

interface CaseStudyPaneProps {
  progress: UserProgress;
  onRecordCaseStudyScore: (caseStudyId: string, score: number) => void;
}

export const CaseStudyPane: React.FC<CaseStudyPaneProps> = ({
  progress,
  onRecordCaseStudyScore,
}) => {
  const [csIdx, setCsIdx] = useState(0);
  const caseStudy = CASE_STUDIES[csIdx];

  const [activeExhibitId, setActiveExhibitId] = useState(caseStudy.exhibits[0].id);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [highlightedQuote, setHighlightedQuote] = useState<string | null>(null);

  useEffect(() => {
    setActiveExhibitId(caseStudy.exhibits[0].id);
    setQuestionIdx(0);
    setAnswers({});
    setRevealed({});
    setHighlightedQuote(null);
  }, [csIdx, caseStudy.exhibits]);

  const currentQ = caseStudy.questions[questionIdx];
  const activeExhibit =
    caseStudy.exhibits.find((e) => e.id === activeExhibitId) ?? caseStudy.exhibits[0];

  const handleChoose = (optIdx: number) => {
    if (revealed[currentQ.id]) return;
    const nextAnswers = { ...answers, [currentQ.id]: optIdx };
    const nextRevealed = { ...revealed, [currentQ.id]: true };
    setAnswers(nextAnswers);
    setRevealed(nextRevealed);

    const score = caseStudy.questions.reduce((acc, q) => {
      return nextAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
    }, 0);
    onRecordCaseStudyScore(caseStudy.id, score);
  };

  const handleHighlightEvidence = () => {
    setActiveExhibitId(currentQ.exhibitId);
    setHighlightedQuote(currentQ.evidenceQuote);
  };

  const renderExhibitLine = (line: string, i: number) => {
    if (highlightedQuote && line.includes(highlightedQuote)) {
      const idx = line.indexOf(highlightedQuote);
      const before = line.slice(0, idx);
      const match = line.slice(idx, idx + highlightedQuote.length);
      const after = line.slice(idx + highlightedQuote.length);
      return (
        <p key={i} className="rounded-lg border border-accent/50 bg-accent/10 p-2.5 leading-relaxed text-slate-100">
          {before}
          <mark className="rounded bg-accent px-1 py-0.5 font-semibold text-on-accent">
            {match}
          </mark>
          {after}
        </p>
      );
    }
    return (
      <p key={i} className="rounded-lg bg-slate-900/60 p-2.5 leading-relaxed text-slate-300">
        {line}
      </p>
    );
  };

  return (
    <div className="space-y-4">
      {/* Case Study Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap gap-2">
          {CASE_STUDIES.map((cs, idx) => {
            const best = progress.caseStudyScores[cs.id] ?? 0;
            return (
              <button
                key={cs.id}
                onClick={() => setCsIdx(idx)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-semibold transition ${
                  idx === csIdx
                    ? 'border-emerald-400 bg-emerald-500/15 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Building2 className="h-4 w-4 text-emerald-400" />
                <span>{cs.companyName}</span>
                <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-emerald-300">
                  {best}/{cs.questions.length}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setAnswers({});
            setRevealed({});
            setHighlightedQuote(null);
            setQuestionIdx(0);
          }}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart Case Study
        </button>
      </div>

      {/* Split Screen Layout: Left Exhibits | Right Questions */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* LEFT PANE: 5-Tab Exhibit Browser */}
        <div className="lg:col-span-6 flex flex-col rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <Layers className="h-4 w-4" />
              {caseStudy.industry}
            </div>
            <h2 className="mt-1 text-base font-bold text-white">{caseStudy.companyName}</h2>
            <p className="mt-1 text-xs text-slate-400">{caseStudy.summary}</p>
          </div>

          {/* Exhibit Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-800 bg-slate-950 px-3 py-2.5">
            {caseStudy.exhibits.map((ex) => {
              const isSelected = ex.id === activeExhibitId;
              return (
                <button
                  key={ex.id}
                  onClick={() => {
                    setActiveExhibitId(ex.id);
                    setHighlightedQuote(null);
                  }}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    isSelected
                      ? 'bg-accent text-on-accent'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {ex.title}
                </button>
              );
            })}
          </div>

          {/* Exhibit Body */}
          <div className="flex-1 space-y-2.5 p-4 text-xs">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Exhibit: {activeExhibit.title}
              </span>
              {highlightedQuote && (
                <button
                  onClick={() => setHighlightedQuote(null)}
                  className="text-[11px] text-amber-300 underline"
                >
                  Clear highlight
                </button>
              )}
            </div>
            {activeExhibit.content.map((line, i) => renderExhibitLine(line, i))}
          </div>
        </div>

        {/* RIGHT PANE: Linked Questions */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-5">
          <div className="space-y-4">
            {/* Question Number Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {caseStudy.questions.map((q, idx) => {
                  const isRev = revealed[q.id];
                  const isRight = isRev && answers[q.id] === q.correctIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setQuestionIdx(idx);
                        setHighlightedQuote(null);
                      }}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                        idx === questionIdx ? 'ring-2 ring-accent ' : ''
                      }${
                        isRev
                          ? isRight
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                            : 'border-rose-500/50 bg-rose-500/20 text-rose-300'
                          : 'border-slate-700 bg-slate-950 text-slate-300'
                      }`}
                    >
                      Q{idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleHighlightEvidence}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent-ink transition hover:bg-accent/20"
              >
                <Highlighter className="h-3.5 w-3.5" />
                Highlight Evidence in Exhibit
              </button>
            </div>

            <h3 className="text-sm font-semibold leading-relaxed text-white sm:text-base">
              {currentQ.question}
            </h3>

            {/* Options */}
            <div className="space-y-2">
              {currentQ.options.map((opt, idx) => {
                const chosen = answers[currentQ.id] === idx;
                const isRev = revealed[currentQ.id];
                const isRight = idx === currentQ.correctIndex;

                let style =
                  'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-600';
                if (isRev) {
                  if (isRight) {
                    style = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-100';
                  } else if (chosen) {
                    style = 'border-rose-500/60 bg-rose-500/15 text-rose-100';
                  } else {
                    style = 'border-slate-800/50 bg-slate-950/30 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleChoose(idx)}
                    className={`flex w-full items-start gap-2.5 rounded-2xl border p-3 text-left text-xs transition sm:text-sm ${style}`}
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isRev && isRight && (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    )}
                    {isRev && chosen && !isRight && (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {revealed[currentQ.id] && (
              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-xs">
                <div className="font-bold uppercase tracking-wider text-emerald-400">
                  Case Study Rationale
                </div>
                <p className="mt-1 leading-relaxed text-slate-200">{currentQ.explanation}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-3">
            <button
              disabled={questionIdx === 0}
              onClick={() => {
                setQuestionIdx((i) => Math.max(0, i - 1));
                setHighlightedQuote(null);
              }}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 disabled:opacity-40"
            >
              Previous Q
            </button>
            <button
              disabled={questionIdx >= caseStudy.questions.length - 1}
              onClick={() => {
                setQuestionIdx((i) => Math.min(caseStudy.questions.length - 1, i + 1));
                setHighlightedQuote(null);
              }}
              className="rounded-2xl bg-accent px-3.5 py-1.5 text-xs font-bold text-on-accent disabled:opacity-40"
            >
              Next Q
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
