import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  CloudDownload,
  CloudUpload,
  Download,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';
import { UserProgress } from '../types/pl300';
import {
  GistSyncConfig,
  loadGistConfig,
  parseProgressJson,
  pullProgressFromGist,
  pushProgressToGist,
  saveGistConfig,
} from '../utils/progressHelpers';

interface ProgressSyncCardProps {
  progress: UserProgress;
  onImportProgress: (nextProgress: UserProgress) => void;
}

export const ProgressSyncCard: React.FC<ProgressSyncCardProps> = ({
  progress,
  onImportProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCloudSync, setShowCloudSync] = useState(false);
  const [gistConfig, setGistConfig] = useState<GistSyncConfig>(() => loadGistConfig());
  const [syncBusy, setSyncBusy] = useState<'push' | 'pull' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pl300-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking synchronously can cancel the download in Firefox/Safari.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback({ type: 'ok', text: 'Backup downloaded as JSON.' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseProgressJson(text);
      if (!window.confirm('Replace your current progress with ' + file.name + '?')) return;
      onImportProgress(parsed);
      setFeedback({ type: 'ok', text: `Restored progress from ${file.name}.` });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to parse backup JSON.',
      });
    }
  };

  const updateGistField = (field: keyof GistSyncConfig, value: string) => {
    const updated = { ...gistConfig, [field]: value };
    setGistConfig(updated);
    saveGistConfig(updated);
  };

  const handlePushGist = async () => {
    setSyncBusy('push');
    setFeedback(null);
    try {
      const returnedId = await pushProgressToGist(progress, gistConfig);
      if (returnedId !== gistConfig.gistId) {
        updateGistField('gistId', returnedId);
      }
      setFeedback({
        type: 'ok',
        text: `Saved to private GitHub Gist (${returnedId}). Use this Gist ID on your other devices.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not push progress to Gist.',
      });
    } finally {
      setSyncBusy(null);
    }
  };

  const handlePullGist = async () => {
    setSyncBusy('pull');
    setFeedback(null);
    try {
      const remote = await pullProgressFromGist(gistConfig);
      if (!window.confirm('Replace the progress in this browser with the copy from your Gist?')) return;
      onImportProgress(remote);
      setFeedback({ type: 'ok', text: 'Pulled latest study progress from GitHub Gist.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not pull progress from Gist.',
      });
    } finally {
      setSyncBusy(null);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">
            Cross-Device Backup & Cloud Sync
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Progress is saved automatically in this browser. Export a JSON backup or sync via a private GitHub Gist to switch between laptop and phone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <Download className="h-3.5 w-3.5 text-sky-400" />
            Export JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <Upload className="h-3.5 w-3.5 text-emerald-400" />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => setShowCloudSync((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition ${
              showCloudSync
                ? 'bg-accent text-slate-950'
                : 'border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            GitHub Gist Sync
          </button>
        </div>
      </div>

      {showCloudSync && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
          <div className="text-xs text-slate-300 leading-relaxed">
            Create a GitHub Personal Access Token with only the{' '}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-300">gist</code>{' '}
            permission. Your token stays strictly inside this browser&apos;s{' '}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sky-300">localStorage</code>.
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-400">
                GitHub Token (gist scope)
              </label>
              <input
                type="password"
                value={gistConfig.token}
                onChange={(e) => updateGistField('token', e.target.value)}
                placeholder="ghp_... or github_pat_..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-400">
                Gist ID (leave blank on first save to auto-create)
              </label>
              <input
                type="text"
                value={gistConfig.gistId}
                onChange={(e) => updateGistField('gistId', e.target.value)}
                placeholder="e.g. a1b2c3d4e5f6..."
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-white placeholder-slate-500 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={syncBusy !== null}
              onClick={handlePushGist}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-accent px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-accent-hover disabled:opacity-50"
            >
              {syncBusy === 'push' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CloudUpload className="h-3.5 w-3.5" />
              )}
              Save Progress to Gist
            </button>
            <button
              disabled={syncBusy !== null}
              onClick={handlePullGist}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
            >
              {syncBusy === 'pull' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CloudDownload className="h-3.5 w-3.5 text-sky-400" />
              )}
              Pull Progress from Gist
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs ${
            feedback.type === 'ok'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  );
};
