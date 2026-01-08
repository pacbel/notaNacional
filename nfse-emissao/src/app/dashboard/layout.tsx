"use client";
import { AuthProvider } from '@/contexts/AuthContext';

import SidebarWrapper from '@/components/SidebarWrapper';
import { PrestadorProvider } from '@/contexts/PrestadorContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PrestadorProvider>
        <div className="flex min-h-screen">
          <SidebarWrapper />
          <main className="flex-1 p-4">
            {children}
          </main>
        </div>
      </PrestadorProvider>
    </AuthProvider>
  );
}
