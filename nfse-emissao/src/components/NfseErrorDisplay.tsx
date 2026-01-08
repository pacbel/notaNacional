import React from 'react';
import { ClassifiedError } from '@/utils/errorClassifier';

interface NfseErrorDisplayProps {
  error: ClassifiedError | string;
}

/**
 * Componente para exibir erros de NFSe de forma amigável
 */
const NfseErrorDisplay: React.FC<NfseErrorDisplayProps> = ({ error }) => {
  // Se o erro for uma string, exibir mensagem simples
  if (typeof error === 'string') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se o erro for um ClassifiedError, exibir informações detalhadas
  const classifiedError = error as ClassifiedError;
  
  // Definir cores com base no tipo de erro
  let borderColor = 'border-red-500';
  let bgColor = 'bg-red-50';
  let titleColor = 'text-red-800';
  let textColor = 'text-red-700';
  
  switch (classifiedError.type) {
    case 'VALIDATION':
      borderColor = 'border-orange-500';
      bgColor = 'bg-orange-50';
      titleColor = 'text-orange-800';
      textColor = 'text-orange-700';
      break;
    case 'BUSINESS':
      borderColor = 'border-yellow-500';
      bgColor = 'bg-yellow-50';
      titleColor = 'text-yellow-800';
      textColor = 'text-yellow-700';
      break;
    case 'AUTHENTICATION':
      borderColor = 'border-purple-500';
      bgColor = 'bg-purple-50';
      titleColor = 'text-purple-800';
      textColor = 'text-purple-700';
      break;
    case 'TECHNICAL':
    case 'COMMUNICATION':
    case 'UNKNOWN':
    default:
      // Manter as cores padrão (vermelho)
      break;
  }

  return (
    <div className={`${bgColor} border-l-4 ${borderColor} p-4 mb-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className={`h-5 w-5 ${borderColor.replace('border-', 'text-')}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${titleColor}`}>
            Erro {classifiedError.type === 'UNKNOWN' ? '' : `de ${getTipoErroTexto(classifiedError.type)}`} - Código {classifiedError.code}
          </h3>
          <div className={`mt-2 text-sm ${textColor}`}>
            <p className="font-medium">{classifiedError.message}</p>
            <p className="mt-1">{classifiedError.description}</p>
            {classifiedError.suggestion && (
              <p className="mt-2 font-medium">
                <span className="underline">Sugestão:</span> {classifiedError.suggestion}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Retorna o texto descritivo para o tipo de erro
 */
function getTipoErroTexto(tipo: string): string {
  switch (tipo) {
    case 'VALIDATION':
      return 'Validação';
    case 'AUTHENTICATION':
      return 'Autenticação';
    case 'BUSINESS':
      return 'Regra de Negócio';
    case 'TECHNICAL':
      return 'Técnico';
    case 'COMMUNICATION':
      return 'Comunicação';
    default:
      return 'Desconhecido';
  }
}

export default NfseErrorDisplay;
