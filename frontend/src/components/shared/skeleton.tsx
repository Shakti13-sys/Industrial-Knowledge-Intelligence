import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-md', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-5 w-14" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <Skeleton className="h-11 w-11 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}
