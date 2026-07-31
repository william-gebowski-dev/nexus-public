import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";
import { ROUTES } from "@/lib/routes";

/**
 * Página mínima de relatório diário — antes da auditoria o CTA do card
 * da rotina apontava para `/reports/daily/:date` mas a rota não existia,
 * então o clique caía no 404. Aqui aceitamos o parâmetro `date` (YYYY-MM-DD),
 * validamos e mostramos um placeholder honesto enquanto o relatório real
 * ainda não está implementado.
 */
export function DailyReport() {
  const { date } = useParams<{ date: string }>();

  const valid = useMemo(() => {
    if (!date) return false;
    // YYYY-MM-DD com mês/dia válidos.
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));
  }, [date]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Relatório diário — ${date ?? "?"}`}
        subtitle={
          valid
            ? "Resumo operacional consolidado para a data selecionada."
            : "Data inválida."
        }
        actions={
          <Link to={ROUTES.routine} className="nx-btn">
            Voltar à rotina
         </Link>
        }
      />

      {!valid ? (
        <EmptyState
          title="Data ausente ou inválida"
          description="O endereço precisa seguir o formato AAAA-MM-DD. Volte à rotina e selecione um dia."
          icon={<CalendarDays className="h-5 w-5" />}
        />
      ) : (
        <EmptyState
          title="Relatório ainda não gerado"
          description="Esta página existe como destino do CTA do bloco da rotina. O conteúdo do relatório real será adicionado em uma próxima fase — exibir um placeholder é melhor do que quebrar o link com 404."
          icon={<CalendarDays className="h-5 w-5" />}
        />
      )}
   </div>
  );
}
