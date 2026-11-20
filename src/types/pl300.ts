export type DomainId = 'prepare' | 'model' | 'visualize' | 'manage';

export type MainTab = 'dashboard' | 'curriculum' | 'simulator' | 'matrix' | 'flashcards';

export type SimulatorSubTab = 'mcq' | 'dax' | 'powerquery' | 'pqlab' | 'casestudy';

export interface DomainMeta {
  id: DomainId;
  title: string;
  shortTitle: string;
  weightRange: string;
  targetWeight: number;
  color: string;
  description: string;
  iconName: 'Database' | 'Boxes' | 'BarChart3' | 'ShieldCheck';
}

export type VideoChannel =
  | 'Guy in a Cube'
  | 'Pragmatic Works'
  | 'SQLBI'
  | 'Curbal'
  | 'How to Power BI'
  | 'Microsoft Learn';

export interface VideoResource {
  id: string;
  title: string;
  channel: VideoChannel;
  duration: string;
  url: string;
  domain: DomainId;
  topics: string[];
  summary: string;
}

export interface LearningModule {
  id: string;
  domain: DomainId;
  title: string;
  msLearnUrl: string;
  duration: string;
  skills: { id: string; text: string }[];
  examTraps: string[];
  keyDaxOrM: string[];
}

export interface MCQQuestion {
  id: string;
  domain: DomainId;
  topic: string;
  difficulty: 'Core' | 'Tricky' | 'Exam Trap';
  scenario: string;
  question: string;
  options: string[];
  correctIndices: number[];
  explanation: string;
  examTip: string;
}

export interface DaxChallenge {
  id: string;
  title: string;
  domain: DomainId;
  difficulty: 'Core' | 'Tricky' | 'Exam Trap';
  businessScenario: string;
  schemaContext: string;
  templateParts: string[];
  correctSlots: string[];
  tokenPool: string[];
  explanation: string;
  contextTrap: string;
}

export interface TablePreview {
  headers: string[];
  rows: string[][];
}

export interface PQStepOption {
  id: string;
  label: string;
  detail: string;
  foldsQuery: boolean;
}

export interface PowerQueryChallenge {
  id: string;
  title: string;
  difficulty: 'Core' | 'Tricky' | 'Exam Trap';
  scenario: string;
  messyTablePreview: TablePreview;
  cleanTablePreview: TablePreview;
  availableSteps: PQStepOption[];
  correctStepOrder: string[];
  explanation: string;
  queryFoldingNote: string;
}

export interface CaseStudyExhibit {
  id: string;
  title: string;
  content: string[];
}

export interface CaseStudyQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  exhibitId: string;
  evidenceQuote: string;
}

export interface CaseStudy {
  id: string;
  companyName: string;
  industry: string;
  summary: string;
  exhibits: CaseStudyExhibit[];
  questions: CaseStudyQuestion[];
}

export type MatrixCategory =
  | 'Workspace Roles'
  | 'Storage Modes'
  | 'Security (RLS/OLS)'
  | 'Visual Selection';

export interface MatrixDrill {
  id: string;
  category: MatrixCategory;
  scenario: string;
  options: string[];
  correctOption: string;
  explanation: string;
  ruleOfThumb: string;
}

export interface Flashcard {
  id: string;
  domain: DomainId;
  category: string;
  front: string;
  back: string;
  codeSnippet?: string;
  examTrap?: string;
}

export interface UserProgress {
  completedSkills: string[];
  watchedVideos: string[];
  moduleNotes: Record<string, string>;
  mcqHistory: Record<string, { correct: boolean; attempts: number; lastAnswered: number }>;
  daxCompleted: string[];
  pqCompleted: string[];
  pqLabCompleted: string[];
  caseStudyScores: Record<string, number>;
  matrixStats: { total: number; correct: number; bestStreak: number };
  flashcardRatings: Record<string, { box: number; lastReviewed: number }>;
  customFlashcards: Flashcard[];
}
