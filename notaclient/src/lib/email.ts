import { authorizeNotaApi, notaApi } from "@/lib/notanacional-api";

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (to.length === 0) {
    throw new Error("Pelo menos um destinatário é obrigatório");
  }

  await authorizeNotaApi();

  await notaApi.post("/api/nfse/emails", {
    destinatarios: to,
    assunto: subject,
    corpoHtml: html,
    anexos: [],
  });
}
