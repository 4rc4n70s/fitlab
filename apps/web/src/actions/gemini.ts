'use server'

interface GenerationResponse {
  success: boolean
  base64?: string
  mimeType?: string
  error?: string
}

import { createClient } from '@/lib/supabase/server'
import { db } from '@/services/db'

async function fetchImageAsBase64(url: string): Promise<{ mimeType: string, base64: string }> {
  // We now expect the client to always send a base64 string
  if (url.startsWith('data:')) {
    const [header, data] = url.split(',')
    const mimeType = header.replace('data:', '').replace(';base64', '')
    return { mimeType, base64: data }
  }

  throw new Error(`Expected base64 image data URL, but received: ${url.substring(0, 50)}...`)
}

export async function processVirtualTryOn(
  prompt: string, 
  modelImageUrl: string, 
  clothesImageUrls: string[]
): Promise<GenerationResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' }
    }

    // Decrement credits before generating
    try {
      await db.profiles.decrementCredits(user.id, 1)
    } catch (e: unknown) {
      const err = e as Error
      return { success: false, error: err.message || 'Saldo de créditos insuficiente.' }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      await db.profiles.incrementCredits(user.id, 1)
      return { success: false, error: 'GEMINI_API_KEY is not configured in the environment.' }
    }

    // Always use the requested model ("Nano Banana Pro" -> gemini-1.5-pro)
    const modelName = 'gemini-1.5-pro'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`
    
    // Construct the mandatory prompt
    const contextPrompt = "MANDATORY: You are a precision clothing applicator. Maintain the EXACT same camera distance, perspective, angle, and composition framing as the target model image. DO NOT change, crop, or zoom in. Exactly copy original environment geometry. " + prompt

    interface Part {
      text?: string
      inlineData?: {
        mimeType: string
        data: string
      }
    }

    const parts: Part[] = []
    
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
      await db.profiles.incrementCredits(user.id, 1)
      return { success: false, error: json.error ? json.error.message : 'Model execution error.' }
    }
    
    const candidate = json.candidates && json.candidates[0]
    if (!candidate || !candidate.content || !candidate.content.parts) {
      await db.profiles.incrementCredits(user.id, 1)
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
      await db.profiles.incrementCredits(user.id, 1)
      return { success: false, error: "Model returned text instead of an image. Verify the model capabilities and prompt." }
    } else {
      await db.profiles.incrementCredits(user.id, 1)
      return { success: false, error: "Response did not contain image data." }
    }

  } catch (error: unknown) {
    const err = error as Error
    return { success: false, error: err.message || 'Unknown error occurred during generation' }
  }
}
