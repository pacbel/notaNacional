import React, { useState } from 'react';

interface UploadCertificadoProps {
  onUploadSuccess?: (response: unknown) => void;
  onUploadError?: (error: string) => void;
  prestadorId?: string;
}

const UploadCertificado: React.FC<UploadCertificadoProps> = ({ onUploadSuccess, onUploadError, prestadorId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSenha(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Selecione o certificado digital.');
      return;
    }
    if (!senha) {
      setMessage('Informe a senha do certificado.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('senha', senha);
      if (prestadorId) {
        formData.append('prestadorId', prestadorId);
      }
      const response = await fetch('/api/upload-certificate', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        setMessage('Erro ao enviar certificado: ' + errorText);
        if (onUploadError) {
          onUploadError(errorText);
        }
      } else {
        setMessage('Certificado enviado com sucesso!');
        const data = await response.json();
        if (onUploadSuccess) {
          onUploadSuccess(data);
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro inesperado';
      setMessage('Erro inesperado: ' + msg);
      if (onUploadError) {
        onUploadError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-md p-6 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Certificado Digital</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="certificado" className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo do Certificado (.pfx ou .pem)
          </label>
          <input
            id="certificado"
            type="file"
            accept=".pfx,.pem"
            onChange={handleFileChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        
        <div>
          <label htmlFor="senhaCertificado" className="block text-sm font-medium text-gray-700 mb-1">
            Senha do Certificado
          </label>
          <input
            id="senhaCertificado"
            type="password"
            value={senha}
            onChange={handleSenhaChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
      
      <div className="mt-4">
        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Certificado'}
        </button>
      </div>
      
      {message && (
        <div className={`mt-3 p-3 rounded ${message.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default UploadCertificado;
