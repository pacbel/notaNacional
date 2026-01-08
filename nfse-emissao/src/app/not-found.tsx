'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  const [counter, setCounter] = useState(10);
  const router = useRouter();
  
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    
    if (counter > 0) {
      timer = setInterval(() => {
        setCounter(counter - 1);
      }, 1000);
    } else {
      router.push('/dashboard');
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [counter, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <Image
            src="/img/logo.png"
            width={120}
            height={48}
            alt="Logo NFSe"
            className="mb-4"
          />
        </div>
        
        <h1 className="text-4xl font-bold text-[#14773a]">404</h1>
        <h2 className="text-2xl font-semibold text-blue-700">Página não encontrada</h2>
        
        <p className="text-gray-600 mb-4 text-center">
          A página que você está procurando não existe ou foi movida.<br />
          Verifique o endereço digitado ou utilize o menu para navegar.
        </p>
        
        <div className="pt-4">
          <p className="text-sm text-gray-400 mb-4">
            Redirecionando para a página inicial em {counter} segundos...
          </p>
          
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-[#14773a] hover:bg-[#2563eb] transition-colors text-white font-semibold py-2 px-6 rounded shadow focus:outline-none focus:ring-2 focus:ring-[#14773a] focus:ring-offset-2"
          >
            Voltar para a página inicial
          </Button>
        </div>
      </Card>
    </div>
  );
}