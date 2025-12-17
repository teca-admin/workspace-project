import React from 'react';

export enum View {
  HOME = 'HOME',         // HOME
  TOOLS = 'TOOLS',       // FERRAMENTA
  PROJECTS = 'PROJECTS', // PROJETOS
  NOTES = 'NOTES',       // NOTAS
  DEMANDS = 'DEMANDS',   // DEMANDAS
  ARTIFACTS = 'ARTIFACTS', // ARTEFATOS (Antiga Library)
  DASHBOARD = 'DASHBOARD' // PAINEL
}

export interface NavItem {
  id: View;
  label: string;
  icon: React.ComponentType<any>;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface Tool {
  id: string;
  titulo: string;
  descricao: string;
  url: string;
  icone?: string;
  categoria?: string;
  // Novos campos para sistema de pastas
  parentId?: string | null; 
  isFolder?: boolean;
}

export interface Note {
  id: string;
  titulo: string;
  conteudo: string;
  criado_em: Date;
  atualizado_em: Date;
}

// Interfaces para os Artefatos (Conceito de Mago/Arsenal)
export interface ArtifactCollection {
  id: string;
  name: string; // Ex: "Prompts", "Necromancia", "Frontend"
  icon: string; // Identificador do ícone
  description?: string;
}

export interface Artifact {
  id: string;
  collectionId: string;
  title: string;
  content: string;
  type: 'code' | 'text' | 'spell';
  createdAt: Date;
  icon?: string;
  color?: string; // 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray' etc
}