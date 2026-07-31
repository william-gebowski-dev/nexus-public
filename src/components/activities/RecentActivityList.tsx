import type { Activity } from "@/types";
import { ActivityItem } from "@/components/ui/ActivityItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export function RecentActivityList({
  activities,
  isLoading,
  error,
  onRetry,
}: {
  activities?: Activity[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  if (isLoading) return <CardSkeleton />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!activities?.length) {
    return <EmptyState title="Nenhuma atividade registrada" description="Eventos recentes aparecerão aqui." />;
  }

  return (
    <ul className="space-y-2">
      {activities.slice(0, 10).map((activity) => (
        <li key={activity.id}>
          <ActivityItem activity={activity} />
        </li>
      ))}
    </ul>
  );
}
