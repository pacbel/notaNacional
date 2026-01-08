import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const docsDir = path.join(process.cwd(), 'public', 'docs');
    const files = fs.readdirSync(docsDir);

    const documents = files.map(file => {
      const extension = path.extname(file).toLowerCase();
      const type = extension === '.pdf' ? 'pdf' : 'html';
      const id = path.basename(file, extension)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');

      return {
        id,
        title: file,
        path: `/docs/${file}`,
        type
      };
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar documentos' },
      { status: 500 }
    );
  }
}
