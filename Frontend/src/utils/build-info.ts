import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const rawTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ?? "";
const formattedTimestamp = rawTimestamp
  ? format(new Date(rawTimestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  : null;

export const buildInfo = {
  timestampISO: rawTimestamp,
  timestampLabel: formattedTimestamp,
  commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "",
};
