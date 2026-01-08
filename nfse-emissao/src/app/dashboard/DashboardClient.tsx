'use client';

import { useAuth } from '@/contexts/AuthContext';
import { FileText, Users, Briefcase, BarChart2, Package, Truck, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface DashboardProps {
  prestadoresCount: number;
  tomadoresCount: number;
  servicosCount: number;
  notasCount: number;
  produtosCount: number;
  transportadorasCount: number;
  operadorasCount: number;
  nfeCount: number;
}

export default function DashboardClient({
  prestadoresCount,
  tomadoresCount,
  servicosCount,
  notasCount,
  produtosCount,
  transportadorasCount,
  operadorasCount,
  nfeCount,
}: DashboardProps) {
  const { user, isMaster, isAdmin } = useAuth();

  // Filtra os cards com base no papel do usuário
  const dashboardCards = [
    {
      title: "Prestadores",
      count: prestadoresCount,
      icon: <Briefcase className="h-8 w-8 text-blue-500" />,
      href: "/prestadores",
      color: "bg-blue-50",
      roles: ["Master"],
    },
    {
      title: "Tomadores",
      count: tomadoresCount,
      icon: <Users className="h-8 w-8 text-green-500" />,
      href: "/tomadores",
      color: "bg-green-50",
      roles: ["Master", "Administrador"],
    },
    {
      title: "Serviços",
      count: servicosCount,
      icon: <BarChart2 className="h-8 w-8 text-purple-500" />,
      href: "/servicos",
      color: "bg-purple-50",
      roles: ["Master", "Administrador"],
    },
    {
      title: "Produtos",
      count: produtosCount,
      icon: <Package className="h-8 w-8 text-indigo-500" />,
      href: "/produtos",
      color: "bg-indigo-50",
      roles: ["Master", "Administrador", "Usuário"],
    },
    {
      title: "Transportadoras",
      count: transportadorasCount,
      icon: <Truck className="h-8 w-8 text-teal-500" />,
      href: "/transportadoras",
      color: "bg-teal-50",
      roles: ["Master", "Administrador", "Usuário"],
    },
    {
      title: "Operadoras",
      count: operadorasCount,
      icon: <CreditCard className="h-8 w-8 text-rose-500" />,
      href: "/operadoras",
      color: "bg-rose-50",
      roles: ["Master", "Administrador", "Usuário"],
    },
    {
      title: "Notas Fiscais",
      count: notasCount,
      icon: <FileText className="h-8 w-8 text-amber-500" />,
      href: "/nfse",
      color: "bg-amber-50",
      roles: ["Master", "Administrador", "Usuário"],
    },
    {
      title: "NF-e",
      count: nfeCount,
      icon: <FileText className="h-8 w-8 text-sky-500" />,
      href: "/nfe",
      color: "bg-sky-50",
      roles: ["Master", "Administrador", "Usuário"],
    },
  ];

  // Filtra os cards com base no papel do usuário
  const filteredCards = dashboardCards.filter(card => {
    if (!user || !user.role) return false;
    return card.roles.includes(user.role);
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCards.map((card, index) => (
          <DashboardCard 
            key={index}
            title={card.title} 
            count={card.count} 
            icon={card.icon} 
            href={card.href} 
            color={card.color}
          />
        ))}
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Emissão de Notas Fiscais</h2>
        <p className="mb-4">Utilize o sistema para gerenciar e emitir suas Notas Fiscais Eletrônicas.</p>
        <Link href="/nfse/novo" className="bg-primary text-black px-4 py-2 rounded hover:bg-primary/80 transition">
          Emitir Nova NFS-e
        </Link>
        <Link href="/nfe/novo" className="bg-primary text-black px-4 py-2 rounded hover:bg-primary/80 transition">
          Emitir Nova NF-e
        </Link>        
      </div>

      {user && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Informações do Usuário</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Nome: <span className="font-medium">{user.nome}</span></p>
              <p className="text-gray-600">Email: <span className="font-medium">{user.email}</span></p>
              <p className="text-gray-600">Perfil: <span className="font-medium">{user.role}</span></p>
            </div>
            <div>
              <p className="text-gray-600">Prestador: <span className="font-medium">{user.prestador?.razaoSocial}</span></p>
              <p className="text-gray-600">CNPJ: <span className="font-medium">{user.prestador?.cnpj}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardCard({ 
  title, 
  count, 
  icon, 
  href, 
  color 
}: { 
  title: string; 
  count: number; 
  icon: React.ReactNode; 
  href: string; 
  color: string;
}) {
  return (
    <Link href={href} className={`${color} p-6 rounded-lg shadow hover:shadow-md transition`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
        {icon}
      </div>
    </Link>
  );
}
