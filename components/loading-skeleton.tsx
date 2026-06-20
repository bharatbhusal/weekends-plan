import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface LoadingSkeletonProps {
  count?: number;
  view?: 'grid' | 'list';
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/9] rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-16 w-full" />
        <div className="pt-4 border-t flex justify-between">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-8 rounded-md shrink-0" />
    </div>
  );
}

export function LoadingSkeleton({ count = 6, view = 'grid' }: LoadingSkeletonProps) {
  if (view === 'list') {
    return (
      <div className="space-y-3" role="status" aria-label="Loading events">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading events">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
