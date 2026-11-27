import { useEffect, useState } from 'react';
import { cloudSync, SyncStatus } from './engine';

/** The live sync status, redrawn whenever it changes (and each minute, for "2 minutes ago"). */
export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(() => cloudSync.status());
  useEffect(() => {
    const update = () => setStatus(cloudSync.status());
    const stop = cloudSync.watch(update);
    const tick = setInterval(update, 60000);
    update();
    return () => {
      stop();
      clearInterval(tick);
    };
  }, []);
  return status;
}

/** "just now", "5 minutes ago", "3 hours ago", or a date. */
export function whenText(at: number | string | null): string {
  if (at === null) return 'not yet';
  const t = typeof at === 'string' ? Date.parse(at) : at;
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  if (mins < 48 * 60) return `${Math.floor(mins / 60)} hour${mins < 120 ? '' : 's'} ago`;
  return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
