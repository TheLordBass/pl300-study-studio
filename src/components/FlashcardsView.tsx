import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Plus,
  RotateCw,
  Trash2,
  X,
} from 'lucide-react';
import { DomainId, Flashcard, UserProgress } from '../types/pl300';
import { PL300_DOMAINS } from '../data/curriculumData';
import { FLASHCARDS } from '../data/matrixAndFlashcardsData';

interface FlashcardsViewProps {
  progress: UserProgress;
  onRateFlashcard: (cardId: string, box: number) => void;
  onAddCustomFlashcard: (card: Omit<Flashcard, 'id'>) => void;
  onDeleteCustomFlashcard: (cardId: string) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  progress,
  onRateFlashcard,
  onAddCustomFlashcard,
  onDeleteCustomFlashcard,
}) => {
  const [filterMode, setFilterMode] = useState<DomainId | 'all' | 'review'>('all');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newDomain, setNewDomain] = useState<DomainId>('model');
  const [newCategory, setNewCategory] = useState('Personal note');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newSnippet, setNewSnippet] = useState('');

  const allCards = useMemo(
    () => [...FLASHCARDS, ...progress.customFlashcards],
    [progress.customFlashcards]
  );

  const deck = useMemo(() => {
    if (filterMode === 'all') return allCards;
    if (filterMode === 'review') {
      return allCards.filter((c) => {
        const box = progress.flashcardRatings[c.id]?.box ?? 1;
        return box <= 2;
      });
    }
    return allCards.filter((c) => c.domain === filterMode);
  }, [allCards, filterMode, progress.flashcardRatings]);

  const safeIdx = deck.length > 0 ? Math.min(cardIdx, deck.length - 1) : 0;
  const currentCard = deck[safeIdx];

  useEffect(() => {
    setFlipped(false);
  }, [safeIdx, filterMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showCreateModal) return;
      const target = e.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === 'ArrowRight' && deck.length > 0) {
        setCardIdx((i) => (i + 1) % deck.length);
      } else if (e.code === 'ArrowLeft' && deck.length > 0) {
        setCardIdx((i) => (i - 1 + deck.length) % deck.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck.length, showCreateModal]);

  const handleRate = (box: number) => {
    if (!currentCard) return;
    onRateFlashcard(currentCard.id, box);
    const leavesDeck = filterMode === 'review' && box >= 3;
    if (leavesDeck) {
      // The card drops out of the review deck, so the next card slides into this index.
      setCardIdx((i) => (i >= deck.length - 1 ? 0 : i));
    } else if (deck.length > 1) {
      setCardIdx((i) => (i + 1) % deck.length);
    }
    setFlipped(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    onAddCustomFlashcard({
      domain: newDomain,
      category: newCategory.trim() || 'Custom',
      front: newFront.trim(),
      back: newBack.trim(),
      codeSnippet: newSnippet.trim() || undefined,
    });
    setNewFront('');
    setNewBack('');
    setNewSnippet('');
    setShowCreateModal(false);
  };

  const dueCount = allCards.filter(
    (c) => (progress.flashcardRatings[c.id]?.box ?? 1) <= 2
  ).length;
  const masteredCount = allCards.filter(
    (c) => (progress.flashcardRatings[c.id]?.box ?? 1) >= 3
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Deck Controls */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white sm:text-2xl">
            Flashcards
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Press <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">Space</kbd> to flip,{' '}
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">←</kbd>{' '}
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">→</kbd> to step through cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="px-1 text-sm text-slate-400">
            <strong className="text-white">{dueCount}</strong> to review
          </span>
          <span className="px-1 text-sm text-slate-400">
            <strong className="text-white">{masteredCount}</strong> mastered
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            data-tour="fc-new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 font-bold text-on-accent hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New card
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div data-tour="fc-filters" className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilterMode('all');
            setCardIdx(0);
          }}
          className={`rounded-md px-3.5 py-2 text-xs font-semibold transition ${
            filterMode === 'all'
              ? 'bg-accent text-on-accent'
              : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          All ({allCards.length})
        </button>
        <button
          onClick={() => {
            setFilterMode('review');
            setCardIdx(0);
          }}
          className={`rounded-md px-3.5 py-2 text-xs font-semibold transition ${
            filterMode === 'review'
              ? 'bg-accent text-on-accent'
              : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
          }`}
        >
          To review ({dueCount})
        </button>
        {PL300_DOMAINS.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setFilterMode(d.id);
              setCardIdx(0);
            }}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition ${
              filterMode === d.id
                ? 'bg-accent text-on-accent'
                : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {d.shortTitle}
          </button>
        ))}
      </div>

      {/* Flashcard Stage */}
      {!currentCard ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center space-y-2">
          <Brain className="mx-auto h-10 w-10 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">All caught up!</h3>
          <p className="text-xs text-slate-300">
            No cards currently in Box 1–2 for this filter. Switch back to All to review everything.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Card {safeIdx + 1} of {deck.length} •{' '}
              <span className="font-semibold text-slate-200">{currentCard.category}</span>
            </span>
            <div className="flex items-center gap-2">
              <span>
                Box{' '}
                <strong className="text-white">
                  {progress.flashcardRatings[currentCard.id]?.box ?? 1} / 4
                </strong>
              </span>
              {currentCard.id.startsWith('custom-') && (
                <button
                  onClick={() => {
                    if (window.confirm('Delete this custom flashcard?')) {
                      onDeleteCustomFlashcard(currentCard.id);
                    }
                  }}
                  className="rounded p-1 text-rose-400 hover:bg-rose-500/15"
                  title="Delete custom card"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Interactive Card */}
          <div
            data-tour="fc-card"
            onClick={() => setFlipped((f) => !f)}
            className="min-h-[290px] cursor-pointer rounded-xl border border-slate-800 bg-slate-900 p-7 shadow-sm transition hover:border-accent/50 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">
                {flipped ? 'Answer' : 'Question'}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <RotateCw className="h-3.5 w-3.5" />
                Click to flip
              </span>
            </div>

            {!flipped ? (
              <div className="my-auto py-8 text-center">
                <h2 className="text-lg font-extrabold leading-relaxed text-white sm:text-xl">
                  {currentCard.front}
                </h2>
              </div>
            ) : (
              <div className="my-auto space-y-4 py-4">
                <p className="text-sm leading-relaxed text-slate-100 sm:text-base">
                  {currentCard.back}
                </p>
                {currentCard.codeSnippet && (
                  <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-sky-300">
                    {currentCard.codeSnippet}
                  </pre>
                )}
                {currentCard.examTrap && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                      <strong>Exam Trap:</strong> {currentCard.examTrap}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="text-center text-[11px] text-slate-500">
              {PL300_DOMAINS.find((d) => d.id === currentCard.domain)?.title}
            </div>
          </div>

          {/* SM-2 Confidence Buttons + Stepper */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setCardIdx((i) => (i - 1 + deck.length) % deck.length)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => handleRate(1)}
                className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
              >
                Again <span className="ml-1 font-normal opacity-60">1</span>
              </button>
              <button
                onClick={() => handleRate(2)}
                className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
              >
                Hard <span className="ml-1 font-normal opacity-60">2</span>
              </button>
              <button
                onClick={() => handleRate(3)}
                className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/25"
              >
                Good <span className="ml-1 font-normal opacity-60">3</span>
              </button>
              <button
                onClick={() => handleRate(4)}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
              >
                Easy <span className="ml-1 font-normal opacity-60">4</span>
              </button>
            </div>

            <button
              onClick={() => setCardIdx((i) => (i + 1) % deck.length)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Custom PL-300 Flashcard</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Domain</label>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value as DomainId)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  {PL300_DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.shortTitle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Topic</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  placeholder="e.g., Time Intelligence"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Front (Question)</label>
              <textarea
                required
                rows={2}
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white"
                placeholder="What DAX function activates an inactive relationship?"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Back (Answer)</label>
              <textarea
                required
                rows={3}
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white"
                placeholder="USERELATIONSHIP() inside CALCULATE()..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Code snippet (optional)
              </label>
              <input
                type="text"
                value={newSnippet}
                onChange={(e) => setNewSnippet(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-sky-300"
                placeholder="CALCULATE([Sales], USERELATIONSHIP(...))"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-on-accent hover:bg-accent-hover"
              >
                Save card
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
