import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface UploadLogomarcaProps {
  onUploadSuccess?: (response: unknown) => void;
  onUploadError?: (error: string) => void;
  prestadorId?: string;
  cnpj?: string;
}

const UploadLogomarca: React.FC<UploadLogomarcaProps> = ({ onUploadSuccess, onUploadError, prestadorId, cnpj }) => {
  const [, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoAtual, setLogoAtual] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateUserPrestador } = useAuth();

  useEffect(() => {
    // Carregar a logo atual se o prestador já tiver uma
    const carregarLogoAtual = async () => {
      if (prestadorId) {
        try {
          const response = await fetch(`/api/prestadores/${prestadorId}/logo`);
          if (response.ok) {
            const data = await response.json();
            if (data.logoPath) {
              setLogoAtual(data.logoPath);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar logo atual:', error);
        }
      }
    };

    carregarLogoAtual();
  }, [prestadorId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Verificar se o arquivo é uma imagem JPG ou PNG
      if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
        setMessage('Apenas imagens JPG ou PNG são permitidas.');
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      
      setFile(selectedFile);
      
      // Criar URL para preview da imagem
      const fileUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(fileUrl);
      
      // Enviar arquivo automaticamente quando selecionado
      handleUpload(selectedFile);
    }
  };

  const handleUpload = async (selectedFile: File) => {
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (prestadorId) {
        formData.append('prestadorId', prestadorId);
      }
      if (cnpj) {
        formData.append('cnpj', cnpj);
      }
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        setMessage('Erro ao enviar logomarca: ' + errorText);
        if (onUploadError) onUploadError(errorText);
      } else {
        const data: unknown = await response.json();
        setMessage('Logomarca enviada com sucesso!');
        const logoPath = (data as { logoPath?: string }).logoPath;
        if (logoPath) {
          setLogoAtual(logoPath);
          // Atualiza também o AuthContext para refletir imediatamente na Sidebar
          try { updateUserPrestador({ logoPath }); } catch {}
        }
        if (onUploadSuccess) onUploadSuccess(data);
        
        // Limpar a mensagem após 3 segundos
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error: unknown) {
      const msg = (error as Error)?.message || 'Erro inesperado';
      setMessage('Erro inesperado: ' + msg);
      if (onUploadError) onUploadError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    // Acionar o input de arquivo quando a imagem for clicada
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-md p-4 bg-gray-50 max-w-[200px]">
      <h3 className="text-base font-medium text-gray-800 mb-3 text-center">Logomarca</h3>
      
      <input
        ref={fileInputRef}
        id="logomarca"
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div onClick={handleImageClick} className="cursor-pointer mx-auto">
        {previewUrl ? (
          <div className="relative w-40 h-40 border border-gray-300 rounded-md overflow-hidden">
            <Image 
              src={previewUrl} 
              alt="Preview da logomarca" 
              fill 
              style={{ objectFit: 'contain' }} 
            />
          </div>
        ) : logoAtual ? (
          <div className="relative w-40 h-40 border border-gray-300 rounded-md overflow-hidden">
            <Image 
              src={logoAtual} 
              alt="Logomarca atual" 
              fill 
              style={{ objectFit: 'contain' }} 
            />
          </div>
        ) : (
          <div className="w-40 h-40 border border-gray-300 rounded-md flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
            <p className="text-sm text-gray-500 text-center">Nenhuma logomarca<br />cadastrada</p>
            <p className="text-xs text-blue-600 mt-2">Clique aqui para carregar sua logo</p>
          </div>
        )}
      </div>
      
      {message && (
        <div className={`mt-3 p-3 rounded text-center ${message.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}
      
      {loading && (
        <div className="mt-3 text-center text-gray-600">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
          Enviando...
        </div>
      )}
    </div>
  );
};

export default UploadLogomarca;
