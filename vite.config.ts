import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente (como API_KEY) para o build
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Garante que o código 'process.env.API_KEY' continue funcionando
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback para evitar erro 'process is not defined'
      'process.env': {}
    },
    server: {
      host: true
    }
  };
});