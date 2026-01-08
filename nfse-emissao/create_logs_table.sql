-- Script para criar a tabela de logs caso ela não exista
CREATE TABLE IF NOT EXISTS "log" (
    "id" TEXT NOT NULL,
    "prestadorId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tela" TEXT NOT NULL,
    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS "Log_prestadorId_idx" ON "log"("prestadorId");
CREATE INDEX IF NOT EXISTS "Log_usuarioId_idx" ON "log"("usuarioId");
CREATE INDEX IF NOT EXISTS "Log_entidade_idx" ON "log"("entidade");
CREATE INDEX IF NOT EXISTS "Log_dataHora_idx" ON "log"("dataHora");

-- Adicionar chaves estrangeiras se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'log_prestadorId_fkey'
    ) THEN
        ALTER TABLE "log" ADD CONSTRAINT "log_prestadorId_fkey" 
        FOREIGN KEY ("prestadorId") REFERENCES "prestador"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'log_usuarioId_fkey'
    ) THEN
        ALTER TABLE "log" ADD CONSTRAINT "log_usuarioId_fkey" 
        FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
