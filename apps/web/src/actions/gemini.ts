'use server'

interface GenerationResponse {
  success: boolean
  base64?: string
  mimeType?: string
  error?: string
}

async function fetchImageAsBase64(url: string): Promise<{ mimeType: string, base64: string }> {
  // If it's already a base64 string
  if (url.startsWith('data:')) {
    const [header, data] = url.split(',')
    const mimeType = header.replace('data:', '').replace(';base64', '')
    return { mimeType, base64: data }
  }

  // Otherwise, fetch the image from URL
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${url}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = response.headers.get('content-type') || 'image/jpeg'
  
  return { mimeType, base64: buffer.toString('base64') }
}

export async function processVirtualTryOn(
  prompt: string, 
  modelImageUrl: string, 
  clothesImageUrls: string[]
): Promise<GenerationResponse> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { success: false, error: 'GEMINI_API_KEY is not configured in the environment.' }
    }

    // Always use the requested model ("Nano Banana Pro" -> gemini-1.5-pro)
    const modelName = 'gemini-1.5-pro'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
    
    // Construct the mandatory prompt
    const contextPrompt = "MANDATORY: You are a precision clothing applicator. Maintain the EXACT same camera distance, perspective, angle, and composition framing as the target model image. DO NOT change, crop, or zoom in. Exactly copy original environment geometry. " + prompt

    const parts: any[] = []
    
    // Fetch and process clothes images (anchors)
    for (let i = 0; i < clothesImageUrls.length; i++) {
      const anchor = await fetchImageAsBase64(clothesImageUrls[i])
      parts.push({ text: `Anchor Image ${i + 1} (Reference clothing/style):` })
      parts.push({ inlineData: { mimeType: anchor.mimeType, data: anchor.base64 } })
    }
    
    // Fetch and process target model image
    const modelPhoto = await fetchImageAsBase64(modelImageUrl)
    parts.push({ text: "Target Model Image (To replicate identically while applying clothes):" })
    parts.push({ inlineData: { mimeType: modelPhoto.mimeType, data: modelPhoto.base64 } })

    const requestPayload = {
      systemInstruction: {
        parts: [{ text: contextPrompt }]
      },
      contents: [
        { role: "user", parts: parts }
      ]
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    })
    
    const json = await response.json()
    
    if (!response.ok) {
      return { success: false, error: json.error ? json.error.message : 'Model execution error.' }
    }
    
    const candidate = json.candidates && json.candidates[0]
    if (!candidate || !candidate.content || !candidate.content.parts) {
      return { success: false, error: "No response found from AI." }
    }

    const outputPart = candidate.content.parts[0]
    
    if (outputPart.inlineData && outputPart.inlineData.data) {
      return { 
        success: true, 
        base64: outputPart.inlineData.data, 
        mimeType: outputPart.inlineData.mimeType || 'image/jpeg' 
      }
    } else if (outputPart.text) {
      // Sometimes models return the image as base64 text if incorrectly prompted, or it might just fail to generate an image and return text explaining why.
      // We will assume failure if it doesn't use inlineData as requested by the old logic.
      return { success: false, error: "Model returned text instead of an image. Verify the model capabilities and prompt." }
    } else {
      return { success: false, error: "Response did not contain image data." }
    }

  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error occurred during generation' }
  }
}
