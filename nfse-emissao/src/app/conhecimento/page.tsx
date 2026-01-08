'use client';

import { useEffect, useState } from 'react';
import { Book, ChevronRight, FileText, FileTextIcon } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  path: string;
}

interface Document {
  id: string;
  title: string;
  path: string;
  type: 'html' | 'pdf';
}

export default function ConhecimentoPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documentos');
        if (!response.ok) {
          throw new Error('Erro ao carregar documentos');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Erro ao carregar documentos</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar com lista de documentos */}
        <div className="col-span-1 bg-white rounded-lg shadow-sm p-4 h-[calc(100vh-6rem)] sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <Book className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-700">Documentos</h2>
          </div>
          <div className="space-y-1">
            {documents.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm ${
                  selectedDoc?.id === doc.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {doc.type === 'pdf' ? (
                  <FileText size={16} className="text-red-500" />
                ) : (
                  <FileTextIcon size={16} className="text-blue-500" />
                )}
                <span>{doc.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Área de conteúdo */}
        <div className="col-span-3">
          {selectedDoc ? (
            <iframe
              src={selectedDoc.path}
              className="w-full h-[calc(100vh-4rem)] border-0 rounded-lg shadow-sm bg-white"
              title={selectedDoc.title}
            />
          ) : (
            <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-sm">
              <Book size={48} className="mx-auto mb-4 opacity-50" />
              <p>Selecione um documento para visualizar seu conteúdo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
