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
  // En Vercel, fs.readFile para la carpeta public a veces falla dependiendo del build.
  // Es más seguro fetchear la URL directamente.
  if (url.startsWith('/')) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://fitlab-beta.vercel.app' // Asegúrate de tener el dominio correcto o config
    // Fallback a Vercel URL
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin
    url = `${baseUrl}${url}`
  }

  if (url.startsWith('data:')) {
    const [header, data] = url.split(',')
    const mimeType = header.replace('data:', '').replace(';base64', '')
    return { mimeType, base64: data }
  }
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch image from URL: ${url}`)
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    return { mimeType, base64 }
  }

  throw new Error(`Expected base64 image data URL or HTTP URL, but received: ${url.substring(0, 50)}...`)
}



export async function processVirtualTryOn(
  prompt: string, 
  modelImageUrl: string, 
  clothesImageUrls: string[],
  aspectRatio: string = '1:1'
): Promise<GenerationResponse> {
  let userId: string | null = null;
  let creditsDecremented = false;

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Usuario no autenticado.' }
    }
    userId = user.id;

    // Decrement credits before generating
    try {
      await db.profiles.decrementCredits(user.id, 1)
      creditsDecremented = true;
    } catch (e: unknown) {
      const err = e as Error
      return { success: false, error: err.message || 'Saldo de créditos insuficiente.' }
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      await db.profiles.incrementCredits(user.id, 1)
      return { success: false, error: 'GEMINI_API_KEY is not configured in the environment.' }
    }

    const finalModelName = 'models/gemini-3-pro-image'

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${finalModelName.includes('/') ? finalModelName : `models/${finalModelName}`}:generateContent?key=${apiKey}`
    
    // Construct the mandatory prompt
    const userPrompt = prompt
    const contextPrompt = "MANDATORY INSTRUCTION: You are an expert virtual try-on and clothing applicator AI. Your ONLY task is to dress the person in the Target Model Image using the exact clothing provided in the Anchor Images. CRITICAL: You MUST strictly preserve the ORIGINAL BACKGROUND, ORIGINAL CROP, and ORIGINAL PROPORTIONS of the Target Model Image. DO NOT use the background from the Anchor (clothing) images. The final image must look exactly like the Target Model Image in its environment, model's pose, and face, but wearing the new clothes. The final image must have a strict aspect ratio of " + aspectRatio + ". " + (userPrompt ? "Additional User Instructions: " + userPrompt : "")

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
      ],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
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
      return { success: false, error: `El modelo devolvió texto en lugar de una imagen. Respuesta del modelo: "${outputPart.text}"` }
    } else {
      await db.profiles.incrementCredits(user.id, 1)
      return { success: false, error: "Response did not contain image data." }
    }

  } catch (error: unknown) {
    if (creditsDecremented && userId) {
      try {
        await db.profiles.incrementCredits(userId, 1);
      } catch (refundError) {
        console.error("Critical: Failed to refund credits after error", refundError);
      }
    }
    const err = error as Error
    return { success: false, error: err.message || 'Unknown error occurred during generation' }
  }
}
