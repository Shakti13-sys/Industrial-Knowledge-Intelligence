import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSize(kb: number) {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The backend doesn't classify document "type" (Maintenance Report, SOP,
 * etc.) -- that would require a real classifier we don't have. The file
 * extension is the one real, always-available fact, so icon choice is
 * based on that instead of a fabricated taxonomy. */
export function iconNameForFilename(filename: string): 'FileText' | 'FileType' {
  return filename.toLowerCase().endsWith('.pdf') ? 'FileType' : 'FileText';
}

export function confidenceTier(value: number): 'good' | 'warn' | 'bad' {
  if (value >= 80) return 'good';
  if (value >= 60) return 'warn';
  return 'bad';
}
