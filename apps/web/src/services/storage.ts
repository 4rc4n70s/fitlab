import { createClient } from '@/lib/supabase/client'


export async function uploadImageToSupabase(base64Str: string, folder: string): Promise<string> {
  const supabase = createClient()
  
  if (!base64Str.startsWith('data:')) {
    // Si ya es una URL pública (ej. al procesar colecciones que ya se subieron)
    return base64Str
  }

  // Extract base64 and mime
  const mimeMatch = base64Str.match(/^data:(image\/\w+);base64,/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, '')
  
  // Convert base64 to Blob rapidly using native fetch API
  const fetchResponse = await fetch(`data:${mime};base64,${base64Data}`)
  const blob = await fetchResponse.blob()

  const ext = mime.split('/')[1] || 'jpg'
  const fileName = `${folder}/${Math.random().toString(36).substring(2) + Date.now().toString(36)}.${ext}`

  const { error } = await supabase.storage
    .from('fitlab-images')
    .upload(fileName, blob, {
      contentType: mime,
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading to Supabase:', error)
    throw new Error('Error al subir la imagen a la nube')
  }

  const { data: publicUrlData } = supabase.storage
    .from('fitlab-images')
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}
