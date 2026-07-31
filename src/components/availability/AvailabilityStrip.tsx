import type { AvailabilityRecord, AvailabilityState } from "@/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

const STATE_COPY: Record<AvailabilityState, { label: string; className: string }> = {
  operational: { label: "Operacional", className: "bg-green" },
  instability: { label: "Instabilidade", className: "bg-amber" },
  unavailable: { label: "Indisponível", className: "bg-red" },
  no_data: { label: "Sem dados", className: "bg-text-faint" },
};

export function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-[11px] text-text-dim" aria-label="Legenda de disponibilidade">
      {(Object.entries(STATE_COPY) as Array<[AvailabilityState, (typeof STATE_COPY)[AvailabilityState]]>).map(([state, copy]) => (
        <span key={state} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-sm", copy.className)} aria-hidden />
          {copy.label}
        </span>
      ))}
    </div>
  );
}

export function AvailabilityStrip({ records, label }: { records?: AvailabilityRecord[]; label: string }) {
  const safeRecords = records?.length
    ? records
    : Array.from({ length: 6 }).map((_, index) => ({
        id: `empty-${index}`,
        checkedAt: "",
        state: "no_data" as AvailabilityState,
      }));

  return (
    <div className="min-w-0 overflow-x-auto pb-1" role="img" aria-label={`Disponibilidade recente de ${label}`}>
      <div className="flex min-w-max gap-1.5">
        {safeRecords.map((record) => {
          const copy = STATE_COPY[record.state];
          const time = record.checkedAt ? formatTime(record.checkedAt) : "sem horário";
          return (
            <span
              key={record.id}
              title={`${copy.label} · ${time}`}
              aria-label={`${copy.label} às ${time}`}
              className={cn("h-5 w-8 rounded-md border border-black/5", copy.className, record.state === "no_data" && "opacity-50")}
            />
          );
        })}
      </div>
    </div>
  );
}
