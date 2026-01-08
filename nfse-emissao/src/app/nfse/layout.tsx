import SidebarWrapper from "@/components/SidebarWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrestadorProvider } from "@/contexts/PrestadorContext";
import { CertificateProvider } from "@/contexts/CertificateContext";
import NFSeClientGate from "@/components/certificados/NFSeClientGate";

export default function NFSeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PrestadorProvider>
        <CertificateProvider>
          <div className="flex min-h-screen">
            <SidebarWrapper />
            <main className="flex-1 p-4">
              <NFSeClientGate />
              {children}
            </main>
          </div>
        </CertificateProvider>
      </PrestadorProvider>
    </AuthProvider>
  );
}
