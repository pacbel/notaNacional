import type { NextRequest } from 'next/server'
import { POST as cancelarPost } from '../cancelar/route'

// Alias compatível com documentação antiga: /api/nfse/cancelar-nfse
// Redireciona a chamada para a mesma lógica de /api/nfse/cancelar
export async function POST(request: NextRequest) {
  return cancelarPost(request as unknown as Request)
}
