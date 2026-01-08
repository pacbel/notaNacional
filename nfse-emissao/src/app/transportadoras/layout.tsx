"use client";

import SidebarWrapper from '@/components/SidebarWrapper';

export default function TransportadorasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SidebarWrapper />
      <main className="flex-1 p-4">
        {children}
      </main>
    </div>
  );
}
