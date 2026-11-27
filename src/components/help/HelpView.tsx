import React from 'react';
import { BookMarked, Info, Link2 } from 'lucide-react';
import { UserProgress } from '../../types/pl300';
import { LinkDevicesPanel } from './LinkDevicesPanel';
import { GuidePanel } from './GuidePanel';
import { AboutPanel } from './AboutPanel';

export type HelpSection = 'guide' | 'devices' | 'about';
export const HELP_SECTIONS: HelpSection[] = ['guide', 'devices', 'about'];

const TABS: { id: HelpSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'guide', label: 'Guide', icon: BookMarked },
  { id: 'devices', label: 'Link devices', icon: Link2 },
  { id: 'about', label: 'About & versions', icon: Info },
];

interface Props {
  section: HelpSection;
  onChangeSection: (s: HelpSection) => void;
  progress: UserProgress;
  onReplaceProgress: (p: UserProgress) => void;
  onReplayTour: (key: string, hash: string) => void;
  onShowWhatsNew: () => void;
  onResetProgress: () => void;
}

export const HelpView: React.FC<Props> = ({
  section,
  onChangeSection,
  progress,
  onReplaceProgress,
  onReplayTour,
  onShowWhatsNew,
  onResetProgress,
}) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-3xl font-extrabold text-white">Help</h1>
      <p className="mt-1 text-sm text-slate-400">How everything works, linking your devices, and what’s changed.</p>
    </div>

    <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 p-1">
      {TABS.map((t) => {
        const Icon = t.icon;
        const on = section === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChangeSection(t.id)}
            aria-current={on ? 'page' : undefined}
            className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-bold transition sm:flex-1 ${
              on ? 'bg-accent text-on-accent' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </button>
        );
      })}
    </div>

    {section === 'guide' && <GuidePanel onReplayTour={onReplayTour} onOpenDevices={() => onChangeSection('devices')} />}
    {section === 'devices' && <LinkDevicesPanel progress={progress} onReplaceProgress={onReplaceProgress} />}
    {section === 'about' && <AboutPanel onShowWhatsNew={onShowWhatsNew} onResetProgress={onResetProgress} />}
  </div>
);
