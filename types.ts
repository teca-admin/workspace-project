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
  title: string;       // Frontend: title, DB: titulo
  description: string; // Frontend: description, DB: descricao
  url: string;
  icon?: string;       // Frontend: icon, DB: icone
  category?: string;   // Frontend: category, DB: categoria
  parentId?: string | null; // Frontend: parentId, DB: parent_id
  isFolder?: boolean;       // Frontend: isFolder, DB: is_folder
  createdAt?: Date;    // Frontend: createdAt, DB: criado_em
  updatedAt?: Date;    // Frontend: updatedAt, DB: atualizado_em
}

export interface Note {
  id: string;
  title: string;       // Frontend: title, DB: titulo
  content: string;     // Frontend: content, DB: conteudo
  createdAt: Date;     // Frontend: createdAt, DB: criado_em
  updatedAt: Date;     // Frontend: updatedAt, DB: atualizado_em
}

// Interfaces para os Artefatos (Conceito de Mago/Arsenal)
export interface ArtifactCollection {
  id: string;
  name: string;         // Frontend: name, DB: nome
  icon: string;         // Frontend: icon, DB: icone
  description?: string; // Frontend: description, DB: descricao
}

export interface Artifact {
  id: string;
  collectionId: string; // Frontend: collectionId, DB: colecao_id
  title: string;        // Frontend: title, DB: titulo
  content: string;      // Frontend: content, DB: conteudo
  description?: string; // Frontend: description, DB: descricao
  type: 'code' | 'text' | 'spell' | 'pdf' | 'word' | 'excel' | 'powerpoint'; // Frontend: type, DB: tipo
  createdAt: Date;      // Frontend: createdAt, DB: criado_em
  icon?: string;        // Frontend: icon, DB: icone
  color?: string;       // Frontend: color, DB: cor
}