import React from 'react';
import {
  CheckSquare,
  Code2,
  FileSpreadsheet,
  Layers,
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

interface ExamSimulatorViewProps {
  progress: UserProgress;
  activeSubTab: SimulatorSubTab;
  domainFilter: DomainId | 'all';
  onChangeSubTab: (subTab: SimulatorSubTab) => void;
  onChangeDomainFilter: (domain: DomainId | 'all') => void;
  onRecordMcq: (questionId: string, correct: boolean) => void;
  onMarkDaxCompleted: (challengeId: string) => void;
  onMarkPqCompleted: (challengeId: string) => void;
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
    label: 'Scenario MCQs',
    desc: 'Study & Timed Mock Exam',
    icon: CheckSquare,
  },
  {
    id: 'dax',
    label: 'DAX Slot Builder',
    desc: 'Drag/Click DAX Tokens',
    icon: Code2,
  },
  {
    id: 'powerquery',
    label: 'Power Query Sequencer',
    desc: 'Step Order & Folding',
    icon: FileSpreadsheet,
  },
  {
    id: 'casestudy',
    label: 'Case Study Simulator',
    desc: '5-Tab Exhibits + Evidence',
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
  onRecordCaseStudyScore,
}) => {
  return (
    <div className="space-y-6">
      {/* Sub-Navigation Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeSubTab(tab.id)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                active
                  ? 'border-accent bg-accent/15 text-white shadow-lg shadow-accent/10'
                  : 'border-transparent bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div
                className={`rounded-2xl p-2.5 ${
                  active ? 'bg-accent text-slate-950' : 'bg-slate-800 text-amber-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold">{tab.label}</div>
                <div className="text-[11px] text-slate-400">{tab.desc}</div>
              </div>
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

      {activeSubTab === 'casestudy' && (
        <CaseStudyPane
          progress={progress}
          onRecordCaseStudyScore={onRecordCaseStudyScore}
        />
      )}
    </div>
  );
};
