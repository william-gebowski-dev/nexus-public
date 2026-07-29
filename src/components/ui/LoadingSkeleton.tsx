import { cn } from "@/lib/cn";

export interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

export function LoadingSkeleton({ className, rows = 1 }: LoadingSkeletonProps) {
  if (rows === 1) {
    return <div className={cn("nx-skeleton h-4 w-full", className)} aria-hidden />;
  }
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cn("nx-skeleton h-4", className)} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="nx-card p-4 space-y-3">
      <LoadingSkeleton className="h-3 w-24" />
      <LoadingSkeleton className="h-7 w-16" />
      <LoadingSkeleton className="h-3 w-32" />
    </div>
  );
}
