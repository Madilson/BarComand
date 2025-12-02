import { GoogleGenAI } from "@google/genai";
import { Product, Tab } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const askBarAssistant = async (
  query: string, 
  menu: Product[],
  activeTabs: Tab[]
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Erro: Chave de API não configurada.";

  const menuString = menu.map(p => `- ${p.name} (R$ ${p.price.toFixed(2)}): ${p.description || ''}`).join('\n');
  const activeTabsSummary = activeTabs.filter(t => t.status === 'Aberta').length;
  const totalRevenue = activeTabs.reduce((acc, tab) => {
      return acc + tab.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, 0);

  const systemInstruction = `
    Você é um especialista em mixologia, gestão de bares e atendimento ao cliente chamado "BarGPT".
    
    Contexto do Bar:
    - Mesas Abertas: ${activeTabsSummary}
    - Faturamento Atual (estimado): R$ ${totalRevenue.toFixed(2)}
    
    Menu Atual:
    ${menuString}

    Suas funções:
    1. Sugerir drinks com base em ingredientes ou preferências do cliente.
    2. Explicar itens do menu.
    3. Dar dicas de gestão baseadas no movimento atual (ex: se muitas mesas, sugerir agilidade).
    4. Criar descrições criativas para novos pratos ou drinks se solicitado.
    
    Responda de forma concisa, amigável e profissional (em Português do Brasil).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Desculpe, não consegui processar sua solicitação no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao conectar com o assistente inteligente.";
  }
};
