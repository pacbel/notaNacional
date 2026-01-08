import { NextResponse } from 'next/server';

type RouteParams = { params: { method: string } };

export async function POST(
  request: Request,
  context: RouteParams
) {
  await Promise.resolve(context.params);
  return NextResponse.json({
    error: 'Rota descontinuada. Utilize a API local para assinatura, transmissão, emissão e download do PDF.'
  }, { status: 410 });
}