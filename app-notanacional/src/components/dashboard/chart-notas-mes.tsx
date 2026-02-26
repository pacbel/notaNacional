"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartNotasMesProps {
  data: Array<{
    mes: string;
    total: number;
  }>;
}

export function ChartNotasMes({ data }: ChartNotasMesProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="mes" 
          className="text-xs"
          tick={{ fill: '#374151' }} // Cinza escuro para melhor legibilidade
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: '#374151' }} // Cinza escuro para melhor legibilidade
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            color: '#111827',
          }}
          labelStyle={{ color: '#111827' }}
        />
        <Bar 
          dataKey="total" 
          fill="#1351b4" // Azul do tema para consistência
          radius={[4, 4, 0, 0]}
          name="Notas Emitidas"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
