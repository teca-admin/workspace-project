import { createClient } from '@supabase/supabase-js';

// Função auxiliar para acessar variáveis de ambiente com segurança
const getEnv = (key: string, fallback: string): string => {
  try {
    // Verifica se import.meta e import.meta.env existem
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    console.warn('Erro ao acessar variáveis de ambiente:', e);
  }
  return fallback;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://kefuxhtlekzswpakvmhz.supabase.co');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlZnV4aHRsZWt6c3dwYWt2bWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODkxODMsImV4cCI6MjA4MTQ2NTE4M30.PJan5F7QJZWvpE33UCO8-lqYZohbwLfIpQ41kW_QzNQ');

export const supabase = createClient(supabaseUrl, supabaseKey);