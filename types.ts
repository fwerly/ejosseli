export enum FunctionType {
  ALI = 'ALI', // Arquivo Lógico Interno
  AIE = 'AIE', // Arquivo de Interface Externa
  EE = 'EE',   // Entrada Externa
  CE = 'CE',   // Consulta Externa
  SE = 'SE',   // Saída Externa
  UNKNOWN = 'UNKNOWN'
}

export enum ProjectType {
  DEVELOPMENT = 'Desenvolvimento',
  // Specific Improvement Types
  IMPROVEMENT_INCLUSION = 'Melhoria Inclusão',
  IMPROVEMENT_ALTERATION = 'Melhoria Alteração',
  IMPROVEMENT_ALTERATION_REDOC = 'Melhoria Alteração com Redocumentação',
  IMPROVEMENT_EXCLUSION = 'Melhoria Exclusão',
  
  // Maintenance & Migration
  CORRECTIVE_MAINTENANCE = 'Manutenção Corretiva',
  DATA_MIGRATION = 'Migração de Dados',
  
  // DevOps & Technical
  DEVOPS = 'Pipeline DevOps',
  ERROR_VERIFICATION = 'Verificação de Erros', // Replacing generic Security
  
  DOCUMENTATION = 'Manutenção de Documentação',
  OTHER = 'Outros'
}

export interface StoryAnalysis {
  id: string;
  originalText: string;
  shortName: string;
  functionType: FunctionType;
  projectType: ProjectType;
  confidence: number;
  warnings: string[]; // For "calculation table" or "duplicate" warnings
  isDuplicate: boolean;
  // New reasoning fields
  reasoningFunctionType: string;
  reasoningProjectType: string;
}

export interface AnalysisResponse {
  stories: StoryAnalysis[];
  summary: {
    totalStories: number;
    totalALI: number;
    totalAIE: number;
    totalEE: number;
    totalCE: number;
    totalSE: number;
  };
}

// Global declaration for Mammoth.js
declare global {
  interface Window {
    mammoth: {
      extractRawText: (options: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string; messages: any[] }>;
    };
  }
}