import React, { useEffect, useRef } from 'react';
import {
  CheckSquare,
  Code2,
  FileSpreadsheet,
  Layers,
  Wrench,
} from 'lucide-react';
import {
  DomainId,
  SimulatorSubTab,
  UserProgress,
} from '../types/pl300';
import { McqSimulatorPane } from './simulator/McqSimulatorPane';
import { DaxBuilderPane } from './simulator/DaxBuilderPane';
import { PowerQuerySequencerPane } from './simulator/PowerQuerySequencerPane';
import { CaseStudyPane } from './simulator/CaseStudyPane';
import { PowerQueryLabPane } from './pqlab/PowerQueryLabPane';

interface ExamSimulatorViewProps {
  progress: UserProgress;
  activeSubTab: SimulatorSubTab;
  domainFilter: DomainId | 'all';
  onChangeSubTab: (subTab: SimulatorSubTab) => void;
  onChangeDomainFilter: (domain: DomainId | 'all') => void;
  onRecordMcq: (questionId: string, correct: boolean) => void;
  onMarkDaxCompleted: (challengeId: string) => void;
  onMarkPqCompleted: (challengeId: string) => void;
  onMarkPqLabCompleted: (scenarioId: string) => void;
  onRecordCaseStudyScore: (caseStudyId: string, score: number) => void;
}

const SUB_TABS: {
  id: SimulatorSubTab;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'mcq',
    label: 'Practice questions',
    desc: 'Study or timed exam',
    icon: CheckSquare,
  },
  {
    id: 'dax',
    label: 'DAX builder',
    desc: 'Fill in the formula',
    icon: Code2,
  },
  {
    id: 'powerquery',
    label: 'Step order',
    desc: 'Power Query steps and folding',
    icon: FileSpreadsheet,
  },
  {
    id: 'pqlab',
    label: 'Power Query lab',
    desc: '8 messy datasets to clean',
    icon: Wrench,
  },
  {
    id: 'casestudy',
    label: 'Case studies',
    desc: 'Read exhibits, answer questions',
    icon: Layers,
  },
];

export const ExamSimulatorView: React.FC<ExamSimulatorViewProps> = ({
  progress,
  activeSubTab,
  domainFilter,
  onChangeSubTab,
  onChangeDomainFilter,
  onRecordMcq,
  onMarkDaxCompleted,
  onMarkPqCompleted,
  onMarkPqLabCompleted,
  onRecordCaseStudyScore,
}) => {
  // Keep the active mode visible in the phone scroll row.
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const r = row.current;
    if (el && r && r.scrollWidth > r.clientWidth) {
      r.scrollTo({ left: el.offsetLeft - r.offsetLeft - 16, behavior: 'smooth' });
    }
  }, [activeSubTab]);

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Cards */}
      {/* Phones: one scrolling row of compact modes. Desktop: five cards. */}
      <div
        ref={row}
        role="tablist"
        data-tour="sim-tabs"
        aria-label="Practice modes"
        className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-1"
      >
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeSubTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              title={tab.desc}
              className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-bold transition lg:flex-1 ${
                active ? 'bg-accent text-on-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === 'mcq' && (
        <McqSimulatorPane
          progress={progress}
          domainFilter={domainFilter}
          onChangeDomainFilter={onChangeDomainFilter}
          onRecordMcq={onRecordMcq}
        />
      )}

      {activeSubTab === 'dax' && (
        <DaxBuilderPane
          progress={progress}
          onMarkDaxCompleted={onMarkDaxCompleted}
        />
      )}

      {activeSubTab === 'powerquery' && (
        <PowerQuerySequencerPane
          progress={progress}
          onMarkPqCompleted={onMarkPqCompleted}
        />
      )}

      {activeSubTab === 'pqlab' && (
        <PowerQueryLabPane
          completed={progress.pqLabCompleted}
          onComplete={onMarkPqLabCompleted}
        />
      )}

      {activeSubTab === 'casestudy' && (
        <CaseStudyPane
          progress={progress}
          onRecordCaseStudyScore={onRecordCaseStudyScore}
        />
      )}
    </div>
  );
};
