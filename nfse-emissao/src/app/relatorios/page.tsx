import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Users, Briefcase, FileSpreadsheet, ClipboardList } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Relatórios - Sistema de Emissão de NFS-e',
  description: 'Relatórios do sistema de emissão de NFS-e',
};

interface RelatorioCardProps {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  href: string;
}

function RelatorioCard({ titulo, descricao, icone, href }: RelatorioCardProps) {
  return (
    <Link 
      href={href} 
      className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
    >
      <div className="flex items-center mb-4">
        <div className="p-3 bg-blue-50 rounded-full mr-4">
          {icone}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">{titulo}</h3>
      </div>
      <p className="text-gray-600">{descricao}</p>
    </Link>
  );
}

export default function RelatoriosPage() {
  const relatorios: RelatorioCardProps[] = [
    {
      titulo: 'Relatório de Tomadores',
      descricao: 'Lista completa de tomadores cadastrados no sistema com filtros avançados.',
      icone: <Briefcase className="h-6 w-6 text-blue-600" />,
      href: '/relatorios/tomadores',
    },
    {
      titulo: 'Relatório de Serviços',
      descricao: 'Informações sobre os serviços cadastrados no sistema.',
      icone: <FileSpreadsheet className="h-6 w-6 text-blue-600" />,
      href: '/relatorios/servicos',
    },
    {
      titulo: 'Relatório de Notas Fiscais',
      descricao: 'Consulta de notas fiscais emitidas com filtros por período, tomador e status.',
      icone: <FileText className="h-6 w-6 text-blue-600" />,
      href: '/relatorios/notasFiscais',
    },
    {
      titulo: 'Relatório de Logs',
      descricao: 'Histórico de ações realizadas no sistema para auditoria.',
      icone: <ClipboardList className="h-6 w-6 text-blue-600" />,
      href: '/relatorios/logs',
    },
    {
      titulo: 'Relatório de Usuários',
      descricao: 'Lista de usuários cadastrados no sistema com seus respectivos perfis.',
      icone: <Users className="h-6 w-6 text-blue-600" />,
      href: '/relatorios/usuarios',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Relatórios</h1>
        <p className="text-gray-600">Selecione o tipo de relatório que deseja gerar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatorios.map((relatorio) => (
          <RelatorioCard key={relatorio.titulo} {...relatorio} />
        ))}
      </div>
    </div>
  );
}
