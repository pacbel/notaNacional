'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Servico } from '@/types/servico';

interface AlterarStatusDialogProps {
  servico: Servico | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export default function AlterarStatusDialog({
  servico,
  open,
  onOpenChange,
  onConfirm,
}: AlterarStatusDialogProps) {
  if (!servico) return null;

  const novoStatus = servico.ativo ? 'inativar' : 'ativar';
  const statusAtual = servico.ativo ? 'ativo' : 'inativo';
  const statusFuturo = servico.ativo ? 'inativo' : 'ativo';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {servico.ativo ? 'Inativar' : 'Ativar'} serviço
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm sm:text-base">
            Você está prestes a {novoStatus} o serviço <strong className="break-words">{servico.descricao}</strong>.
            <br /><br />
            O serviço está atualmente <strong>{statusAtual}</strong> e ficará <strong>{statusFuturo}</strong>.
            <br /><br />
            Esta ação pode ser revertida posteriormente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={`w-full sm:w-auto ${servico.ativo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            Confirmar {novoStatus.charAt(0).toUpperCase() + novoStatus.slice(1)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
