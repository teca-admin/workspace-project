import React from 'react';

export enum View {
  HOME = 'HOME',         // HOME (Nova)
  TOOLS = 'TOOLS',       // FERRAMENTA
  PROJECTS = 'PROJECTS', // PROJETOS
  DEMANDS = 'DEMANDS',   // DEMANDAS
  LIBRARY = 'LIBRARY',   // BIBLIOTECA
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
  title: string;
  description: string;
  url: string;
  icon?: string;
  category?: string;
}