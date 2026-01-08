import { Metadata } from 'next';
import SidebarWrapper from '@/components/SidebarWrapper';

export const metadata: Metadata = {
  title: 'Relatórios - Sistema de Emissão de NFS-e',
  description: 'Relatórios do sistema de emissão de NFS-e',
};

export default function PrestadoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SidebarWrapper />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}