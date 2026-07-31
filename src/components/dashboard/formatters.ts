export function formatServerUptime(seconds: number | null): string {
  if (seconds === null || seconds < 0) return "Uptime real indisponível";

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) {
    return `Servidor ativo há ${days} ${days === 1 ? "dia" : "dias"} e ${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  if (hours > 0) {
    return `Servidor ativo há ${hours} ${hours === 1 ? "hora" : "horas"} e ${minutes} min`;
  }

  return `Servidor ativo há ${Math.max(1, minutes)} min`;
}
