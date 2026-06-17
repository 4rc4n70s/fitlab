export interface GenerativeModel {
  name: string;
  fullName: string;
  displayName: string;
}

export interface ImagePart {
  mimeType: string;
  base64: string;
}

export interface TryOnPayload {
  apiKey: string;
  modelName: string;
  prompt: string;
  anchors: ImagePart[];
  modelPhoto: ImagePart;
}

export async function getAvailableModels(apiKey: string): Promise<{ success: boolean; models?: GenerativeModel[]; error?: string }> {
  if (!apiKey) return { success: false, error: "API key is required." };
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const json = await response.json();
    
    if (response.ok && json.models) {
      const models = json.models
        .filter((m: any) => 
          m.supportedGenerationMethods.includes("generateContent") &&
          (m.name.toLowerCase().includes("gemini") || 
           m.name.toLowerCase().includes("banana") || 
           m.name.toLowerCase().includes("nano")) &&
          !m.name.includes("embedding") &&
          !m.name.includes("aqa") &&
          !m.name.includes("bison") &&
          !m.name.includes("gecko") &&
          !m.name.includes("text-")
        )
        .map((m: any) => {
          const rawName = m.name.split('/').pop() || '';
          let displayName = m.displayName || rawName;
          if (rawName.includes('gemini-3-pro-image')) {
            displayName = 'Nano Banana Pro (Gemini 3 Pro)';
          } else if (rawName.includes('gemini-2.5-flash-image')) {
            displayName = 'Nano Banana (Gemini 2.5 Flash)';
          } else if (rawName.includes('gemini-3.1-flash-image')) {
            displayName = 'Nano Banana 2 (Gemini 3.1 Flash)';
          } else if (rawName.includes('gemini-1.5-pro')) {
            displayName = 'Nano Banana Pro (Gemini 1.5 Pro)';
          } else if (rawName.includes('gemini-1.5-flash')) {
            displayName = 'Nano Bana (Gemini 1.5 Flash)';
          }
          return {
            name: rawName,
            fullName: m.name,
            displayName: displayName
          };
        });
      return { success: true, models: models };
    } else {
      return { success: false, error: json.error ? json.error.message : "Failed to retrieve models." };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function processTryOn(payload: TryOnPayload): Promise<{ success: boolean; base64?: string; mimeType?: string; error?: string }> {
  const { apiKey, modelName, prompt, anchors, modelPhoto } = payload;
  
  if (!apiKey || !modelName || !prompt) return { success: false, error: "Missing configuration parameters." };
  
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const contextPrompt = "MANDATORY: You are a precision clothing applicator. Maintain the EXACT same camera distance, perspective, angle, and composition framing as the target model image. DO NOT change, crop, or zoom in. Exactly copy original environment geometry. " + prompt;

  const parts: any[] = [];
  
  anchors.forEach((anchor, index) => {
    parts.push({ text: `Anchor Image ${index + 1} (Reference clothing/style):` });
    parts.push({ inlineData: { mimeType: anchor.mimeType, data: anchor.base64 } });
  });
  
  parts.push({ text: "Target Model Image (To replicate identically while applying clothes):" });
  parts.push({ inlineData: { mimeType: modelPhoto.mimeType, data: modelPhoto.base64 } });

  const requestPayload = {
    systemInstruction: {
      parts: [{ text: contextPrompt }]
    },
    contents: [
      { role: "user", parts: parts }
    ]
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });
    
    const json = await response.json();
    
    if (!response.ok) {
      return { success: false, error: json.error ? json.error.message : 'Model execution error.' };
    }
    
    const candidate = json.candidates && json.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      return { success: false, error: "No response found from AI." };
    }

    const outputPart = candidate.content.parts[0];
    
    if (outputPart.inlineData && outputPart.inlineData.data) {
      return { 
        success: true, 
        base64: outputPart.inlineData.data, 
        mimeType: outputPart.inlineData.mimeType || 'image/jpeg' 
      };
    } else if (outputPart.text) {
      return { success: false, error: "Model returned text instead of an image. Verify the model capabilities and prompt." };
    } else {
      return { success: false, error: "Response did not contain image data." };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function analyzeStylePromptFromImage(apiKey: string, base64: string, mimeType: string): Promise<{ success: boolean; promptText?: string; usedModel?: string; error?: string }> {
  if (!apiKey || !base64) return { success: false, error: "API Key e Imagen son requeridos." };
  
  let selectedModel = "gemini-1.5-flash";
  try {
    const modelsList = await getAvailableModels(apiKey);
    if(modelsList.success && modelsList.models) {
      const names = modelsList.models.map(m => m.name.toLowerCase());
      if(names.includes("gemini-2.5-flash-lite")) selectedModel = "gemini-2.5-flash-lite";
      else if(names.includes("gemini-2.5-flash")) selectedModel = "gemini-2.5-flash";
      else if(names.includes("gemini-1.5-flash")) selectedModel = "gemini-1.5-flash";
      else if(modelsList.models.length > 0) selectedModel = modelsList.models[0].name;
    }
  } catch(e) {}

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
  
  const template = "Professional fashion editorial photography of a model wearing [DESCRIPCIÓN DE LA PRENDA]. The outfit features a [FIT/CORTE] silhouette with [TIPO DE TELA] texture. The model is in a [DESCRIPCIÓN DE LA POSE]. Maintaining the exact lighting, color palette, and atmosphere of the reference image. High-end catalog style, sharp focus on fabric details, realistic fabric draping, 8k resolution --ar 4:5";
  
  const instructions = `
    Analyze the image and completely fill in the specified template by replacing brackets with extremely precise, expert fashion descriptions strictly in ENGLISH.
    Output ONLY the final completed sentence prompt string. No introduction.
    Template: "${template}"
  `;

  const requestPayload = {
    contents: [{
      parts: [
        { text: instructions },
        { inlineData: { mimeType: mimeType, data: base64 } }
      ]
    }]
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });
    
    const json = await response.json();
    if (!response.ok) return { success: false, error: json.error ? json.error.message : 'Model execution error.' };
    const text = json.candidates[0].content.parts[0].text;
    return { success: true, promptText: text.trim(), usedModel: selectedModel };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
