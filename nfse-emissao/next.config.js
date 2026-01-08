/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configurações para evitar erros de permissão
  serverExternalPackages: ['reap2'],
  // Desativar completamente o rastreamento
  experimental: {
    disableOptimizedLoading: true,
    disablePostcssPresetEnv: true,
    // Remover a opção standalone para evitar erros ENOTEMPTY
  },
  // Desativar a geração do diretório standalone
  // output: 'standalone',


  // Configurações para permitir scripts externos
  webpack: (config) => {
    // Resolver o problema do módulo 'emitter' faltante no pacote reap2
    config.resolve.fallback = {
      ...config.resolve.fallback,
      emitter: false,
      events: require.resolve('events'),
    };
    
    // Ignorar problemas com o pacote reap2
    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false
    };
    
    return config;
  },
  // Desabilitar verificações de ESLint durante o build
  eslint: {
    // Ignorar erros de ESLint durante o build
    ignoreDuringBuilds: true,
  },
  // Desabilitar verificações de tipos durante o build
  typescript: {
    // Ignorar erros de tipagem durante o build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
