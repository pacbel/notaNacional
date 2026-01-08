'use client';

import NaturezaForm, { NaturezaDTO } from './NaturezaForm';

export default function NaturezaFormWrapper({ isNew, natureza, defaultValues }: { isNew: boolean; natureza: NaturezaDTO | null; defaultValues: { descricao: string } }) {
  return <NaturezaForm isNew={isNew} natureza={natureza} defaultValues={defaultValues} />;
}
