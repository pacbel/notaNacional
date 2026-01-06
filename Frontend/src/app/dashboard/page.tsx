"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { Factory, MapPin, ShieldCheck, TrendingUp, Users } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useApiQuery } from "@/hooks/use-api-query";
import { listarPrestadores } from "@/services/prestadores";
import { listarUsuarios } from "@/services/usuarios";
import { listarNotasEmitidas } from "@/services/nfse";
import { useAuth } from "@/contexts/auth-context";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, subDays, subMonths } from "date-fns";

type StatItem = {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
  hidden?: boolean;
  className?: string;
  valueClassName?: string;
  descriptionClassName?: string;
};

export default function DashboardPage() {
  const { user } = useAuth();

  const prestadoresQuery = useApiQuery({
    queryKey: ["prestadores-dashboard"],
    queryFn: listarPrestadores,
  });

  const usuariosQuery = useApiQuery({
    queryKey: ["usuarios-dashboard"],
    queryFn: listarUsuarios,
    enabled: user?.roles.includes("Administrador") ?? false,
  });

  const notasQuery = useApiQuery({
    queryKey: ["notas-emitidas-dashboard", { range: "6m" }],
    queryFn: () => listarNotasEmitidas({ page: 1, pageSize: 500 }),
  });

  const municipiosAtendidos = useMemo(() => {
    const dados = prestadoresQuery.data ?? [];
    const mapa = new Set<string>();

    dados.forEach((prestador) => {
      const cidade = prestador.endereco?.cidade?.trim();
      if (cidade) {
        mapa.add(cidade);
        return;
      }

      const codigo = prestador.codigoMunicipioIbge?.trim() || prestador.endereco?.codigoMunicipioIbge?.trim();
      if (codigo) {
        mapa.add(codigo);
      }
    });

    return mapa.size;
  }, [prestadoresQuery.data]);

  const novosPrestadores30Dias = useMemo(() => {
    const dados = prestadoresQuery.data ?? [];
    const limite = subDays(new Date(), 30);

    return dados.reduce((total, prestador) => {
      if (!prestador.dataCriacao) {
        return total;
      }

      const dataCadastro = parseISO(prestador.dataCriacao);
      if (Number.isNaN(dataCadastro.getTime())) {
        return total;
      }

      return dataCadastro >= limite ? total + 1 : total;
    }, 0);
  }, [prestadoresQuery.data]);

  const stats = useMemo<StatItem[]>(() => {
    const totalPrestadores = prestadoresQuery.data?.length ?? 0;
    const totalUsuarios = usuariosQuery.data?.length ?? 0;

    return [
      {
        title: "Prestadores",
        value: totalPrestadores,
        description: "Contas ativas gerenciadas",
        icon: <Factory className="h-8 w-8" />,
      },
      {
        title: "Usuários",
        value: totalUsuarios,
        description: "Perfis com acesso ao portal",
        icon: <ShieldCheck className="h-8 w-8" />,
        hidden: !(user?.roles.includes("Administrador")),
      },
      {
        title: "Novos no mês",
        value: novosPrestadores30Dias,
        description: "Cadastros nos últimos 30 dias",
        icon: <TrendingUp className="h-8 w-8" />,
      },
      {
        title: "Municípios atendidos",
        value: municipiosAtendidos,
        description: "Cidades com prestadores cadastrados",
        icon: <MapPin className="h-8 w-8" />,
      },
    ].filter((item) => !item.hidden);
  }, [municipiosAtendidos, novosPrestadores30Dias, prestadoresQuery.data?.length, usuariosQuery.data?.length, user]);

  const prestadoresRecentes = useMemo(() => {
    const dados = prestadoresQuery.data ?? [];

    return dados
      .map((prestador) => ({
        id: prestador.id,
        nomeFantasia: prestador.nomeFantasia,
        cnpj: prestador.cnpj,
        dataCriacao: prestador.dataCriacao,
        codigoIbge:
          prestador.endereco.codigoMunicipioIbge?.trim() || prestador.codigoMunicipioIbge?.trim() || "",
        cidade: prestador.endereco.cidade,
      }))
      .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
      .slice(0, 5);
  }, [prestadoresQuery.data]);

  const [municipioCache, setMunicipioCache] = useState<Record<string, string>>({});

  useEffect(() => {
    const missingCodes = Array.from(
      new Set(
        prestadoresRecentes
          .map((prestador) => prestador.codigoIbge?.trim())
          .filter((codigo): codigo is string => Boolean(codigo) && !municipioCache[codigo])
      )
    );

    if (missingCodes.length === 0) {
      return;
    }

    let cancelled = false;

    (async () => {
      const resolved: Record<string, string> = {};

      await Promise.all(
        missingCodes.map(async (codigo) => {
          try {
            const response = await fetch(
              `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigo}`
            );

            if (!response.ok) {
              return;
            }

            const data = (await response.json()) as { nome?: string };
            if (data?.nome) {
              resolved[codigo] = data.nome;
            }
          } catch (error) {
            console.error("Erro ao consultar município", codigo, error);
          }
        })
      );

      if (!cancelled && Object.keys(resolved).length > 0) {
        setMunicipioCache((previous) => ({ ...previous, ...resolved }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [prestadoresRecentes, municipioCache]);

  const municipiosRecentes = useMemo(() => {
    return prestadoresRecentes.map((prestador) => {
      const cidade = prestador.cidade?.trim();
      if (cidade) {
        return cidade;
      }

      const codigo = prestador.codigoIbge?.trim();
      if (codigo && municipioCache[codigo]) {
        return municipioCache[codigo];
      }

      return "—";
    });
  }, [prestadoresRecentes, municipioCache]);

  const seriePrestadoresMensais = useMemo(() => {
    const dados = prestadoresQuery.data ?? [];
    const agora = new Date();
    const contagemPorMes = new Map<string, number>();

    dados.forEach((prestador) => {
      if (!prestador.dataCriacao) {
        return;
      }

      const dataCadastro = parseISO(prestador.dataCriacao);
      if (Number.isNaN(dataCadastro.getTime())) {
        return;
      }

      const chave = format(dataCadastro, "yyyy-MM");
      contagemPorMes.set(chave, (contagemPorMes.get(chave) ?? 0) + 1);
    });

    const serie = [] as { mes: string; total: number }[];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const referencia = subMonths(agora, offset);
      const chave = format(referencia, "yyyy-MM");
      serie.push({ mes: format(referencia, "MMM"), total: contagemPorMes.get(chave) ?? 0 });
    }

    return serie;
  }, [prestadoresQuery.data]);

  const serieNotasMensais = useMemo(() => {
    const notas = notasQuery.data?.items ?? [];
    const agora = new Date();
    const contagemPorMes = new Map<string, number>();

    notas.forEach((nota) => {
      if (!nota.emitidaEm) {
        return;
      }

      const dataEmissao = parseISO(nota.emitidaEm);
      if (Number.isNaN(dataEmissao.getTime())) {
        return;
      }

      const chave = format(dataEmissao, "yyyy-MM");
      contagemPorMes.set(chave, (contagemPorMes.get(chave) ?? 0) + 1);
    });

    const serie = [] as { mes: string; total: number }[];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const referencia = subMonths(agora, offset);
      const chave = format(referencia, "yyyy-MM");
      serie.push({ mes: format(referencia, "MMM"), total: contagemPorMes.get(chave) ?? 0 });
    }

    return serie;
  }, [notasQuery.data?.items]);

  const ultimoCadastroFormatado = useMemo(() => {
    if (prestadoresRecentes.length === 0) {
      return null;
    }

    const data = parseISO(prestadoresRecentes[0].dataCriacao);
    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return format(data, "dd/MM/yyyy");
  }, [prestadoresRecentes]);

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            className={stat.className}
            valueClassName={stat.valueClassName}
            descriptionClassName={stat.descriptionClassName}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <CardTitle className="text-base">Prestadores recentes</CardTitle>
              <CardDescription>Últimos cadastros e respectivos municípios</CardDescription>
            </div>
          </CardHeader>
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome fantasia</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Município</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestadoresRecentes.map((prestador, index) => (
                  <TableRow key={prestador.id}>
                    <TableCell>{prestador.nomeFantasia}</TableCell>
                    <TableCell>{prestador.cnpj}</TableCell>
                    <TableCell>{municipiosRecentes[index]}</TableCell>
                  </TableRow>
                ))}
                {prestadoresRecentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>Nenhum prestador cadastrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadastros por mês</CardTitle>
            <CardDescription>Evolução de prestadores ativos nos últimos 6 meses</CardDescription>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seriePrestadoresMensais} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: "#cbd5f5" }}
                  formatter={(value?: number) => {
                    if (typeof value !== "number") {
                      return ["0 cadastros", "Prestadores"];
                    }
                    return [`${value} cadastro${value === 1 ? "" : "s"}`, "Prestadores"];
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas emitidas por mês</CardTitle>
            <CardDescription>Volume de notas fiscais nos últimos 6 meses</CardDescription>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serieNotasMensais} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, borderColor: "#cbd5f5" }}
                  formatter={(value?: number) => {
                    if (typeof value !== "number") {
                      return ["0 notas", "Notas"];
                    }
                    return [`${value} nota${value === 1 ? "" : "s"}`, "Notas"];
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  );
}
