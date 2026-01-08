'use client';

import { useEffect, useState } from 'react';

interface LogoDisplayProps {
  cnpj: string;
  className?: string;
}

export function LogoDisplay({ cnpj, className = '' }: LogoDisplayProps) {
  const [logoUrl, setLogoUrl] = useState<string>('/logos/default-logo.png');

  useEffect(() => {
    const carregarLogomarca = async () => {
      if (cnpj) {
        try {
          // Remover caracteres não numéricos do CNPJ
          const cnpjLimpo = cnpj.replace(/\D/g, '');
          // Verificar se existe logomarca para este prestador
          const logoPath = `/logos/${cnpjLimpo}/logo.jpg`;
          const logoPngPath = `/logos/${cnpjLimpo}/logo.png`;
          
          // Verificar se a imagem existe
          const checkImage = (url: string) => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(true);
              img.onerror = () => resolve(false);
              img.src = url;
            });
          };
          
          // Tentar primeiro o JPG, depois o PNG
          const jpgExists = await checkImage(logoPath);
          if (jpgExists) {
            setLogoUrl(logoPath);
            return;
          }
          
          const pngExists = await checkImage(logoPngPath);
          if (pngExists) {
            setLogoUrl(logoPngPath);
            return;
          }
          
          // Se não encontrar, usar a imagem padrão
          setLogoUrl('/logos/default-logo.png');
        } catch (error) {
          console.error('Erro ao carregar logomarca:', error);
          setLogoUrl('/logos/default-logo.png');
        }
      }
    };
    
    carregarLogomarca();
  }, [cnpj]);

  return (
    <img 
      src={logoUrl} 
      alt="Logomarca do Prestador" 
      className={`max-h-20 max-w-32 object-contain ${className}`} 
    />
  );
}
