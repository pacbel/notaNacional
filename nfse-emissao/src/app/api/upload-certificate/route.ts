import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenData, verifyJwt } from '@/services/authService';
import { logService } from '@/services/logService';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

// POST /api/upload-certificate - Endpoint para upload de certificado digital
export async function POST(request: NextRequest) {
  try {
    console.log('[API:UploadCertificate] Iniciando processo de upload de certificado');
    
    // Verificar autenticação e permissões - verificando tanto por cookie quanto por header de autorização
    let userData;
    
    // Tentar obter o token do cookie
    userData = await getTokenData(request);
    
    // Se não encontrar no cookie, tentar obter do header de autorização
    if (!userData) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          userData = await verifyJwt(token);
          console.log(`[API:UploadCertificate] Autenticado com token de header: ${userData.email}`);
        } catch (error) {
          console.error('[API:UploadCertificate] Erro ao verificar token do header:', error);
        }
      }
    }
    
    if (!userData) {
      console.error('[API:UploadCertificate] Usuário não autenticado');
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    console.log(`[API:UploadCertificate] Usuário autenticado: ${userData.email} (ID: ${userData.id}, Role: ${userData.role})`);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const senha = formData.get('senha') as string;
    const prestadorId = formData.get('prestadorId') as string;

    if (!file || !senha) {
      return NextResponse.json(
        { message: 'Arquivo e senha do certificado são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o prestador existe
    const prestador = await prisma.prestador.findUnique({
      where: { id: prestadorId }
    });

    if (!prestador) {
      return NextResponse.json(
        { message: 'Prestador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões: apenas Master pode modificar qualquer prestador
    // Outros usuários só podem modificar seu próprio prestador
    if (userData.role !== 'Master' && prestador.id !== userData.prestadorId) {
      return NextResponse.json(
        { message: 'Você não tem permissão para modificar este prestador' },
        { status: 403 }
      );
    }

    // Criar diretório para os certificados se não existir
    const certificadosDir = join(process.cwd(), 'certificados');
    try {
      await mkdir(certificadosDir, { recursive: true });
    } catch (err) {
      // Ignora erro se o diretório já existir
    }

    // Salvar o arquivo no sistema de arquivos
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'pfx';
    const fileName = `certificado_${prestadorId}.${fileExtension}`;
    const filePath = join(certificadosDir, fileName);
    
    await writeFile(filePath, buffer);

    // Como esses campos não existem no modelo, vamos criar uma configuração para armazenar esses dados
    // Criar ou atualizar uma configuração para armazenar informações do certificado
    const configId = `certificado_${prestadorId}`;
    const configData = {
      path: filePath,
      senha: senha, // Considere criptografar esta senha!
      atualizado: new Date().toISOString()
    };
    
    // Verificar se a configuração já existe
    const existingConfig = await prisma.configuracao.findUnique({
      where: { id: configId }
    });
    
    if (existingConfig) {
      // Atualizar configuração existente
      await prisma.configuracao.update({
        where: { id: configId },
        data: {
          valor: JSON.stringify(configData),
          updatedAt: new Date()
        }
      });
    } else {
      // Criar nova configuração
      await prisma.configuracao.create({
        data: {
          id: configId,
          chave: `certificado_digital_${prestadorId}`,
          valor: JSON.stringify(configData),
          descricao: `Certificado digital do prestador ${prestador.razaoSocial} (CNPJ: ${prestador.cnpj})`,
          updatedAt: new Date()
        }
      });
    }

    // Registrar log de upload de certificado (usando 'Editar' como ação válida)
    await logService.registrarLog({
      usuarioId: userData.id,
      prestadorId: userData.prestadorId,
      acao: 'Editar',
      entidade: 'Certificado',
      entidadeId: prestadorId,
      descricao: `Usuário ${userData.nome} realizou upload de certificado digital para o prestador ${prestador.razaoSocial} (CNPJ: ${prestador.cnpj})`,
      tela: 'Prestadores',
    });

    return NextResponse.json({
      message: 'Certificado enviado com sucesso',
      prestador: prestador.razaoSocial
    });
  } catch (error: any) {
    console.error('Erro ao enviar certificado:', error);
    return NextResponse.json(
      { message: `Erro ao processar certificado: ${error.message}` },
      { status: 500 }
    );
  }
}
