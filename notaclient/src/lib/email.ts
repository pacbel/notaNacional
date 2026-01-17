import { authorizeNotaApi, notaApi } from "@/lib/notanacional-api";

export interface EmailAttachment {
  fileName: string;
  contentBase64: string;
  contentType: string;
}

interface SendEmailParams {
  to: string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({ to, subject, html, attachments = [] }: SendEmailParams) {
  if (to.length === 0) {
    throw new Error("Pelo menos um destinatário é obrigatório");
  }

  console.info("[Email] Iniciando envio", {
    quantidadeDestinatarios: to.length,
    primeirosDestinatarios: to.slice(0, 3),
    assunto: subject,
    quantidadeAnexos: attachments.length,
  });

  try {
    await authorizeNotaApi();
    console.info("[Email] Autorização com API Nota concluída");

    await notaApi.post("/api/nfse/emails", {
      destinatarios: to,
      assunto: subject,
      corpoHtml: html,
      anexos: attachments,
    });

    console.info("[Email] Solicitação de envio enviada com sucesso");
  } catch (error) {
    console.error("[Email] Falha no envio", {
      quantidadeDestinatarios: to.length,
      assunto: subject,
      quantidadeAnexos: attachments.length,
      erro: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
