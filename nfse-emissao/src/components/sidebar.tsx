'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Briefcase, BarChart2, ChevronLeft, ChevronRight, Book, LogOut, FileBarChart, ChevronDown, CreditCard } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { usePrestador } from '@/contexts/PrestadorContext';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showMensalidades, setShowMensalidades] = useState(false);
  const { user, logout, canAccessMensalidades } = useAuth();
  const { prestador } = usePrestador();

  // Evitar erros de hidratação
  const verificarIntegracaoAsaas = useCallback(() => {
    // Verificar se o usuário está autenticado e tem dados do prestador
    if (user && user.prestador) {
      // Verificar se customer_id_asaas está preenchido
      const temCustomerIdAsaas = !!user.prestador.customer_id_asaas;
      setShowMensalidades(temCustomerIdAsaas);
    } else {
      setShowMensalidades(false);
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);

    // Recuperar estado do menu do localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }

    verificarIntegracaoAsaas();
  }, [user, verificarIntegracaoAsaas]);

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const [relatoriosExpanded, setRelatoriosExpanded] = useState(false);
  const [cadastrosExpanded, setCadastrosExpanded] = useState(true);

  // Tipagem forte para os itens do menu
  interface SubItem { href: string; label: string; roles: string[] }
  interface MenuItem {
    href?: string;
    icon: React.ReactNode;
    label: string;
    roles: string[];
    isSubmenu?: boolean;
    expanded?: boolean;
    toggleExpand?: () => void;
    subItems?: SubItem[];
    customCheck?: () => boolean;
  }

  // Flags do prestador para controlar menu
  // Fallback: usar dados do AuthContext enquanto PrestadorContext ainda carrega
  const emiteNfse = (prestador?.emitirNfse ?? user?.prestador?.emitirNfse) ?? false;
  const emiteNfe  = (prestador?.emitirNfe  ?? user?.prestador?.emitirNfe)  ?? false;

  // Logs de diagnóstico
  useEffect(() => {
    if (typeof window === 'undefined') return;
     
    console.log('[Sidebar][debug] estado de autenticação:', {
      userRole: user?.role,
      hasUser: !!user,
    });
     
    console.log('[Sidebar][debug] prestador (PrestadorContext):', {
      hasPrestador: !!prestador,
      emitirNfse: prestador?.emitirNfse,
      emitirNfe: prestador?.emitirNfe,
      id: prestador?.id,
    });
     
    console.log('[Sidebar][debug] user.prestador (AuthContext):', {
      hasUserPrestador: !!user?.prestador,
      emitirNfse: user?.prestador?.emitirNfse,
      emitirNfe: user?.prestador?.emitirNfe,
      id: user?.prestador?.id,
    });
     
    console.log('[Sidebar][debug] flags efetivas usadas:', {
      emiteNfse,
      emiteNfe,
    });
  }, [user, prestador, emiteNfse, emiteNfe]);

  // Construir Cadastros dinamicamente conforme flags
  const cadastrosSubItemsBase: { href: string; label: string; roles: string[] }[] = [];
  // Emitente e Clientes sempre presentes em ambos os cenários
  cadastrosSubItemsBase.push({ href: '/prestadores', label: 'Emitente', roles: ['Master', 'Administrador'] });
  cadastrosSubItemsBase.push({ href: '/tomadores', label: 'Clientes', roles: ['Master', 'Administrador', 'Usuário'] });
  // Regras estritas: somente adicionar itens extras quando as flags forem true
  if (emiteNfse) {
    cadastrosSubItemsBase.push({ href: '/servicos', label: 'Serviços', roles: ['Master', 'Administrador', 'Usuário'] });
  }
  if (emiteNfe) {
    cadastrosSubItemsBase.push({ href: '/produtos', label: 'Produtos', roles: ['Master', 'Administrador', 'Usuário'] });
    cadastrosSubItemsBase.push({ href: '/transportadoras', label: 'Transportadoras', roles: ['Master', 'Administrador', 'Usuário'] });
    cadastrosSubItemsBase.push({ href: '/operadoras', label: 'Operadoras de Cartão', roles: ['Master', 'Administrador', 'Usuário'] });
    cadastrosSubItemsBase.push({ href: '/naturezas', label: 'Naturezas', roles: ['Master', 'Administrador', 'Usuário'] });
  }

  // Montar itens principais com base nas flags
  const allMenuItems: MenuItem[] = [
    { href: '/dashboard', icon: <BarChart2 className="h-5 w-5" />, label: 'Dashboard', roles: ['Master', 'Administrador', 'Usuário'] },
    {
      isSubmenu: true,
      icon: <Briefcase className="h-5 w-5" />,
      label: 'Cadastros',
      roles: ['Master', 'Administrador', 'Usuário'],
      expanded: cadastrosExpanded,
      toggleExpand: () => setCadastrosExpanded(!cadastrosExpanded),
      subItems: cadastrosSubItemsBase,
    },
    ...(emiteNfse ? [{ href: '/nfse', icon: <FileText className="h-5 w-5" />, label: 'Emissão de NFS-e', roles: ['Master', 'Administrador', 'Usuário'] } as MenuItem] : []),
    ...(emiteNfe  ? [{ href: '/nfe',  icon: <FileText className="h-5 w-5" />, label: 'Emissão de NF-e', roles: ['Master', 'Administrador', 'Usuário'] } as MenuItem] : []),
    { 
      href: '/mensalidades', 
      icon: <CreditCard className="h-5 w-5" />, 
      label: 'Mensalidades', 
      roles: ['Master', 'Administrador'], 
      customCheck: () => showMensalidades || canAccessMensalidades
    },
    { 
      isSubmenu: true, 
      icon: <FileBarChart className="h-5 w-5" />, 
      label: 'Relatórios', 
      roles: ['Master', 'Administrador'],
      expanded: relatoriosExpanded,
      toggleExpand: () => setRelatoriosExpanded(!relatoriosExpanded),
      subItems: [
        { href: '/relatorios/tomadores', label: 'Tomadores', roles: ['Master', 'Administrador'] },
        { href: '/relatorios/servicos', label: 'Serviços', roles: ['Master', 'Administrador'] },
        { href: '/relatorios/notasFiscais', label: 'Notas Fiscais', roles: ['Master', 'Administrador'] },
        { href: '/relatorios/logs', label: 'Logs', roles: ['Master', 'Administrador'] },
        { href: '/relatorios/usuarios', label: 'Usuários', roles: ['Master', 'Administrador'] },
      ]
    },
  ];
  
  const regularMenuItems = allMenuItems.filter(item => {
    if (!user || !user.role) return false;
    
    // Verificar se o usuário tem o papel necessário
    const hasRole = item.roles.includes(user.role);
    
    // Se houver uma verificação personalizada, aplicá-la também
    if (item.customCheck) {
      return hasRole && item.customCheck();
    }
    
    // Ocultar quando as flags estiverem false
    if (item.href === '/nfse' && !emiteNfse) return false;
    if (item.href === '/nfe'  && !emiteNfe)  return false;

    return hasRole;
  });

  const bottomMenuItem = [
    { href: '/conhecimento', icon: <Book className="h-5 w-5" />, label: 'Base de Conhecimento' },
    { href: '#', icon: <LogOut className="h-5 w-5 text-red-500" />, label: 'Sair', onClick: logout },
  ];

  // Não precisamos mais dessa linha, pois vamos renderizar os itens separadamente

  if (!mounted) {
    return null; // Evitar renderização no servidor
  }

  return (
    <aside
      className={`bg-white shadow-md border-r border-gray-100 h-screen sticky top-0 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'
        } z-50`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={`flex items-center p-4 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && (
            <div className="flex items-center space-x-3">
              {/* Exibe a logomarca do prestador, inclusive para Master; fallback para user.prestador e depois padrão */}
              <img
                src={(prestador?.logoPath || user?.prestador?.logoPath || "/img/logo.png") as string}
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold">Sistema Fiscal</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`absolute right-0 top-4 transform translate-x-1/2 rounded-full bg-white border border-gray-200 p-1.5 hover:bg-gray-50 transition-colors ${
              collapsed ? 'rotate-180' : ''
            }`}
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {
              collapsed ?
                <ChevronRight className="h-5 w-5" /> :
                <ChevronLeft className="h-5 w-5" />
            }
          </button>
        </div>

        {/* Menu Principal */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {regularMenuItems.map((item) => (
              <React.Fragment key={item.label}>
                {item.isSubmenu ? (
                  <div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {collapsed ? (
                            <Link
                              href="/relatorios"
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              {item.icon}
                            </Link>
                          ) : (
                            <button
                              onClick={item.toggleExpand}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              {item.icon}
                              <span>{item.label}</span>
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  item.expanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {/* Submenu items */}
                    {item.expanded && !collapsed && (
                      <div className="pl-9 space-y-1 mt-1">
                        {(item.subItems ?? [])
                          .filter(subItem => {
                            if (!user || !user.role) return false;
                            return subItem.roles.includes(user.role);
                          })
                          .map(subItem => (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              className="block py-1.5 px-3 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              {subItem.label}
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${collapsed ? 'justify-center' : ''}`}
                          >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                          </Link>
                        ) : (
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${collapsed ? 'justify-center' : ''}`}>
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                          </div>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Menu Inferior */}
        <div className="border-t border-gray-200 mb-[50px]">
          <nav className="px-3 py-4">
            {bottomMenuItem.map((item) => (
              <TooltipProvider key={item.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {item.onClick ? (
                      <button
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                          collapsed ? 'justify-center' : ''
                        }`}
                      >
                        {item.icon}
                        {!collapsed && <span className={item.label === 'Sair' ? 'text-red-500' : ''}>{item.label}</span>}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors ${
                          collapsed ? 'justify-center' : ''
                        }`}
                      >
                        {item.icon}
                        {!collapsed && <span>{item.label}</span>}
                      </Link>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
