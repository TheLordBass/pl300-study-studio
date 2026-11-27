import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Code2,
  ExternalLink,
  NotebookPen,
  Search,
  Youtube,
} from 'lucide-react';
import {
  DomainId,
  UserProgress,
  VideoChannel,
} from '../types/pl300';
import {
  LEARNING_MODULES,
  PL300_DOMAINS,
  VIDEO_RESOURCES,
} from '../data/curriculumData';

interface CurriculumHubViewProps {
  progress: UserProgress;
  selectedDomainFilter: DomainId | 'all';
  onChangeDomainFilter: (domain: DomainId | 'all') => void;
  onToggleSkill: (skillId: string) => void;
  onToggleVideo: (videoId: string) => void;
  onUpdateModuleNote: (moduleId: string, note: string) => void;
}

const CHANNELS: (VideoChannel | 'All')[] = [
  'All',
  'Guy in a Cube',
  'Pragmatic Works',
  'SQLBI',
  'Curbal',
  'How to Power BI',
  'Microsoft Learn',
];

export const CurriculumHubView: React.FC<CurriculumHubViewProps> = ({
  progress,
  selectedDomainFilter,
  onChangeDomainFilter,
  onToggleSkill,
  onToggleVideo,
  onUpdateModuleNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<VideoChannel | 'All'>('All');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'prep-1': true,
    'mod-2': true,
  });
  const [activeSubSection, setActiveSubSection] = useState<'modules' | 'videos'>('modules');

  const toggleExpand = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LEARNING_MODULES.filter((mod) => {
      if (selectedDomainFilter !== 'all' && mod.domain !== selectedDomainFilter) return false;
      if (!q) return true;
      return (
        mod.title.toLowerCase().includes(q) ||
        mod.skills.some((s) => s.text.toLowerCase().includes(q)) ||
        mod.examTraps.some((t) => t.toLowerCase().includes(q)) ||
        mod.keyDaxOrM.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [selectedDomainFilter, searchQuery]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return VIDEO_RESOURCES.filter((vid) => {
      if (selectedDomainFilter !== 'all' && vid.domain !== selectedDomainFilter) return false;
      if (channelFilter !== 'All' && vid.channel !== channelFilter) return false;
      if (!q) return true;
      return (
        vid.title.toLowerCase().includes(q) ||
        vid.summary.toLowerCase().includes(q) ||
        vid.topics.some((t) => t.toLowerCase().includes(q)) ||
        vid.channel.toLowerCase().includes(q)
      );
    });
  }, [selectedDomainFilter, channelFilter, searchQuery]);

  const totalSkillsCount = LEARNING_MODULES.reduce((acc, m) => acc + m.skills.length, 0);
  const completedSkillsCount = progress.completedSkills.length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">
              Study plan
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Every skill the exam measures, grouped into Microsoft Learn modules, plus the videos worth your time.
            </p>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <div>
              <span className="font-bold text-white">
                {completedSkillsCount}/{totalSkillsCount}
              </span>
              <span className="text-slate-400"> skills checked</span>
            </div>
            <div>
              <span className="font-bold text-white">
                {progress.watchedVideos.length}/{VIDEO_RESOURCES.length}
              </span>
              <span className="text-slate-400"> videos watched</span>
            </div>
          </div>
        </div>

        {/* Sub-view switcher + Search */}
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubSection('modules')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition ${
                activeSubSection === 'modules'
                  ? 'bg-accent text-on-accent'
                  : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Modules ({filteredModules.length})
            </button>
            <button
              onClick={() => setActiveSubSection('videos')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition ${
                activeSubSection === 'videos'
                  ? 'bg-accent text-on-accent'
                  : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Youtube className="h-4 w-4" />
              Videos ({filteredVideos.length})
            </button>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills or topics"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-accent-ink focus:outline-none"
            />
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onChangeDomainFilter('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              selectedDomainFilter === 'all'
                ? 'bg-accent text-on-accent'
                : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All domains
          </button>
          {PL300_DOMAINS.map((d) => (
            <button
              key={d.id}
              onClick={() => onChangeDomainFilter(d.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                selectedDomainFilter === d.id
                  ? 'bg-accent text-on-accent'
                  : 'border border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {d.shortTitle} ({d.weightRange})
            </button>
          ))}
        </div>
      </div>

      {/* MODULES SECTION */}
      {activeSubSection === 'modules' && (
        <div className="space-y-4">
          {filteredModules.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-400">
              No Microsoft Learn modules match these filters. Try clearing the search.
            </div>
          ) : (
            filteredModules.map((mod) => {
              const domainMeta = PL300_DOMAINS.find((d) => d.id === mod.domain)!;
              const isExpanded = Boolean(expandedModules[mod.id]);
              const doneInMod = mod.skills.filter((s) =>
                progress.completedSkills.includes(s.id)
              ).length;
              const allDone = doneInMod === mod.skills.length;

              return (
                <div
                  key={mod.id}
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:border-slate-700"
                >
                  {/* Module Header */}
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                          {domainMeta.shortTitle}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {mod.duration}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            allDone
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {doneInMod}/{mod.skills.length} skills
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{mod.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={mod.msLearnUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600"
                      >
                        Open on Learn
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => toggleExpand(mod.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                      >
                        {isExpanded ? (
                          <>
                            Hide <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            Details <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Skills Checklist (Always Visible) */}
                  <div className="border-t border-slate-800 px-3 py-2">
                    <div className="grid">
                      {mod.skills.map((skill) => {
                        const checked = progress.completedSkills.includes(skill.id);
                        return (
                          <button
                            key={skill.id}
                            onClick={() => onToggleSkill(skill.id)}
                            className={`flex items-start gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-800/60 ${
                              checked ? 'text-slate-400' : 'text-slate-200'
                            }`}
                          >
                            {checked ? (
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
                            ) : (
                              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                            )}
                            <span className={checked ? 'line-through decoration-slate-500' : ''}>
                              {skill.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded Exam Traps, Snippets & Notes */}
                  {isExpanded && (
                    <div className="grid gap-4 border-t border-slate-800 bg-slate-950/70 p-5 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-300">
                            <AlertCircle className="h-4 w-4" />
                            Exam traps
                          </div>
                          <ul className="space-y-1.5 text-xs leading-relaxed text-slate-300">
                            {mod.examTraps.map((trap, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-amber-400">•</span>
                                <span>{trap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5">
                          <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-sky-300">
                            <Code2 className="h-4 w-4" />
                            Patterns to know
                          </div>
                          <div className="space-y-1.5">
                            {mod.keyDaxOrM.map((code, i) => (
                              <code
                                key={i}
                                className="block overflow-x-auto rounded-lg bg-slate-950 px-2.5 py-1.5 text-[11px] text-sky-200"
                              >
                                {code}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Personal Study Notes */}
                      <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-3.5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300">
                            <NotebookPen className="h-4 w-4 text-violet-400" />
                            Your notes
                          </span>
                          <span className="text-[11px] text-slate-500">Auto-saved locally</span>
                        </div>
                        <textarea
                          rows={6}
                          value={progress.moduleNotes[mod.id] ?? ''}
                          onChange={(e) => onUpdateModuleNote(mod.id, e.target.value)}
                          placeholder="Mnemonics, steps to try in Power BI Desktop, things you got wrong…"
                          className="w-full flex-1 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs leading-relaxed text-slate-200 placeholder-slate-600 focus:border-violet-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* YOUTUBE STUDY HUB SECTION */}
      {activeSubSection === 'videos' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
            <span className="text-xs font-medium text-slate-400 mr-1">Creator:</span>
            {CHANNELS.map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  channelFilter === ch
                    ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-400">
              No videos match these filters. Try another creator or clear the search.
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((vid) => {
              const watched = progress.watchedVideos.includes(vid.id);
              const domainMeta = PL300_DOMAINS.find((d) => d.id === vid.domain)!;

              return (
                <div
                  key={vid.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                    watched
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="rounded-md bg-rose-500/15 px-2 py-0.5 font-semibold text-rose-300">
                        {vid.channel}
                      </span>
                      <span className="text-slate-400">{vid.duration}</span>
                    </div>
                    <h3 className="mt-2.5 text-sm font-bold text-white leading-snug">
                      {vid.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{vid.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        {domainMeta.shortTitle}
                      </span>
                      {vid.topics.map((topic) => (
                        <span
                          key={topic}
                          className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                    <button
                      onClick={() => onToggleVideo(vid.id)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                        watched
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {watched ? 'Watched' : 'Mark watched'}
                    </button>

                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
                    >
                      Watch
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
