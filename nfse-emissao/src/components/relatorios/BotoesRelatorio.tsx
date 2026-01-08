"use client";

import { useRouter } from 'next/navigation';
import { Printer, X } from 'lucide-react';

interface BotoesRelatorioProps {
  onImprimir: () => void;
  urlVoltar: string;
}

export default function BotoesRelatorio({ onImprimir, urlVoltar }: BotoesRelatorioProps) {
  const router = useRouter();

  return (
    <div className="flex justify-end space-x-2 mt-6">
      <button
        type="button"
        onClick={() => router.push(urlVoltar)}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
      >
        <X className="mr-2 h-4 w-4" />
        Fechar
      </button>
      <button
        type="button"
        onClick={onImprimir}
        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
      >
        <Printer className="mr-2 h-4 w-4" />
        Visualizar
      </button>
    </div>
  );
}
