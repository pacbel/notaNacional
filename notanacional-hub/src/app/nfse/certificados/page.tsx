"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { listarCertificados } from "@/services/nfse";
import { CertificateInfo } from "@/types/nfse";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

const allowedRoles = new Set(["Administrador", "Gestao", "Operacao", "Robot"]);

export default function CertificadosPage() {
  const { roles, isAuthenticated } = useAuth();
  const hasAccess = useMemo(() => roles.some((role) => allowedRoles.has(role)), [roles]);

  const certificadosQuery = useApiQuery<CertificateInfo[]>({
    queryKey: ["nfse", "certificados"],
    queryFn: listarCertificados,
    enabled: hasAccess && isAuthenticated,
  });

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md p-8 text-center text-sm text-slate-600">
          Seu perfil não possui acesso à listagem de certificados.
        </Card>
      </div>
    );
  }

  const certificados = certificadosQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Certificados disponíveis</h1>
        <p className="text-sm text-slate-500">
          Consulte certificados instalados e disponíveis para assinatura e emissão NFSe.
        </p>
      </header>

      <Card className="p-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Common Name</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Período de validade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificados.map((certificado) => (
                <TableRow key={certificado.id}>
                  <TableCell className="font-medium text-slate-900">{certificado.commonName}</TableCell>
                  <TableCell>{certificado.cnpj}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>Início: {formatDate(certificado.notBefore)}</span>
                      <span>Fim: {formatDate(certificado.notAfter)}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {certificados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-slate-500">
                    Nenhum certificado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
