import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResponse, FunctionType, ProjectType, StoryAnalysis } from "../types";

// Schema for the main list analysis
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    stories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING },
          shortName: { type: Type.STRING, description: "A clean, concise name of the functionality extracted from the text." },
          functionType: { 
            type: Type.STRING, 
            enum: [
              'ALI', 'AIE', 'EE', 'CE', 'SE', 'UNKNOWN'
            ]
          },
          projectType: { 
            type: Type.STRING, 
            enum: [
              'Desenvolvimento',
              'Melhoria Inclusão',
              'Melhoria Alteração',
              'Melhoria Alteração com Redocumentação',
              'Melhoria Exclusão',
              'Manutenção Corretiva',
              'Migração de Dados',
              'Pipeline DevOps',
              'Verificação de Erros',
              'Manutenção de Documentação',
              'Outros'
            ]
          },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." },
          warnings: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Critiques in PORTUGUESE. Warn if an item classified as ALI might just be a calculation table. Warn if this looks like a duplicate."
          },
          isDuplicate: { type: Type.BOOLEAN, description: "True if this story describes the exact same functionality as another story in the list." },
          reasoningFunctionType: { type: Type.STRING, description: "Deep explanation in PORTUGUESE explaining WHY this Function Type was chosen." },
          reasoningProjectType: { type: Type.STRING, description: "Deep explanation in PORTUGUESE explaining WHY this Project Type was chosen." }
        },
        required: ["originalText", "shortName", "functionType", "projectType", "confidence", "warnings", "isDuplicate", "reasoningFunctionType", "reasoningProjectType"]
      }
    }
  },
  required: ["stories"]
};

// Schema for single story re-analysis with context
const singleStorySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    shortName: { type: Type.STRING },
    functionType: { 
      type: Type.STRING, 
      enum: ['ALI', 'AIE', 'EE', 'CE', 'SE', 'UNKNOWN']
    },
    projectType: { 
      type: Type.STRING, 
      enum: [
        'Desenvolvimento', 'Melhoria Inclusão', 'Melhoria Alteração', 
        'Melhoria Alteração com Redocumentação', 'Melhoria Exclusão', 
        'Manutenção Corretiva', 'Migração de Dados', 'Pipeline DevOps', 
        'Verificação de Erros', 'Manutenção de Documentação', 'Outros'
      ]
    },
    confidence: { type: Type.NUMBER },
    warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
    isDuplicate: { type: Type.BOOLEAN },
    reasoningFunctionType: { type: Type.STRING, description: "Very detailed explanation in Portuguese citing the attached document." },
    reasoningProjectType: { type: Type.STRING, description: "Very detailed explanation in Portuguese citing the attached document." }
  },
  required: ["shortName", "functionType", "projectType", "confidence", "warnings", "isDuplicate", "reasoningFunctionType", "reasoningProjectType"]
};

const getAIClient = () => {
  // ATENÇÃO: Mudamos de process.env para import.meta.env para funcionar no Vite/Vercel
  const apiKey = import.meta.env.VITE_API_KEY; 
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeStories = async (rawText: string): Promise<AnalysisResponse> => {
  const ai = getAIClient();

  const systemInstruction = `
    You are a Senior Function Point Analysis (FPA) Specialist using Gemini 3 technology.
    Your task is to analyze a list of raw User Stories / Tasks from a software project and classify them with HIGH PRECISION.

    **INPUT:** Raw text list of stories.

    **OUTPUT Rules:**
    1. **Extract Name:** Clean up the story text to get the core functionality name (Short Name).
    
    2. **Classify Function Type:**
       - **ALI (Arquivo Lógico Interno):** Major entities managed by the app. CRITICAL: Distinguish from calculation tables.
       - **AIE (Arquivo de Interface Externa):** Read-only data from other systems.
       - **EE (Entrada Externa):** Transactions that update data.
       - **CE (Consulta Externa):** Retrievals with derived data.
       - **SE (Saída Externa):** Reports, complex generation of documents.
    
    3. **Classify Project Type (STRICTLY):**
       - **Desenvolvimento:** New modules/apps.
       - **Melhoria Inclusão:** Adding NEW fields/buttons/features.
       - **Melhoria Alteração:** Modifying EXISTING logic/layout.
       - **Melhoria Exclusão:** Removing features.
       - **Manutenção Corretiva:** Bug fixes.
       - **Pipeline DevOps:** Deployments.
       - **Migração de Dados:** Data movement.
       - **Verificação de Erros:** Security/Vulnerability.

    **Language:** All output reasoning and warnings MUST BE IN PORTUGUESE.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: rawText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const parsedData = JSON.parse(jsonText);
    const stories = parsedData.stories.map((s: any, index: number) => ({
      ...s,
      id: `story-${index}-${Date.now()}`
    }));

    // Calculate summary
    const summary = {
      totalStories: stories.length,
      totalALI: stories.filter((s: any) => s.functionType === 'ALI').length,
      totalAIE: stories.filter((s: any) => s.functionType === 'AIE').length,
      totalEE: stories.filter((s: any) => s.functionType === 'EE').length,
      totalCE: stories.filter((s: any) => s.functionType === 'CE').length,
      totalSE: stories.filter((s: any) => s.functionType === 'SE').length,
    };

    return { stories, summary };

  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

export const reanalyzeStoryWithContext = async (story: StoryAnalysis, contextText: string): Promise<StoryAnalysis> => {
  const ai = getAIClient();

  const prompt = `
    TASK: Re-evaluate a specific User Story for Function Point Analysis based on provided technical documentation.

    ORIGINAL STORY INFO:
    - Text: "${story.originalText}"
    - Current Function Type: ${story.functionType}
    - Current Project Type: ${story.projectType}

    ATTACHED DOCUMENT CONTEXT (DOCX CONTENT):
    """
    ${contextText.slice(0, 50000)} 
    """

    INSTRUCTIONS:
    1. Analyze the 'ATTACHED DOCUMENT CONTEXT' to understand the deep technical scope of this specific story.
    2. Re-classify the Function Type (ALI, AIE, EE, CE, SE) and Project Type based on this new evidence.
    3. Provide VERY DETAILED reasoning in Portuguese, citing specific details found in the document content to support your decision.
    4. If the classification changes, explain why the initial guess was wrong.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: singleStorySchema,
      temperature: 0.2, // Slightly higher for more creative reasoning but still structured
    },
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from AI for context analysis");

  const updatedData = JSON.parse(jsonText);

  // Return merged object, keeping the original ID and text
  return {
    ...story,
    ...updatedData,
    originalText: story.originalText, // Keep original text
    id: story.id // Keep original ID
  };
};
