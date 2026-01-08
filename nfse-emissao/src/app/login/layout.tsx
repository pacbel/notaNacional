import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from '@/contexts/AuthContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Login - Sistema de Emissão de NFS-e",
  description: "Sistema para emissão de Notas Fiscais de Serviço Eletrônicas",
  icons: {
    icon: '/favicon/favicon.png',
    apple: '/img/logo.png',
    shortcut: '/favicon/favicon.png'
  },
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center">
        {children}
      </div>
    </AuthProvider>
  );
}
