'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSavedPrompts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data, error } = await supabase
    .from('user_prompts')
    .select('prompt')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching prompts:', error)
    return []
  }

  return data.map(d => d.prompt)
}

export async function savePrompt(prompt: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('user_prompts')
    .insert({ user_id: user.id, prompt })

  if (error) {
    console.error('Error saving prompt:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deletePrompt(prompt: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase
    .from('user_prompts')
    .delete()
    .eq('user_id', user.id)
    .eq('prompt', prompt)

  if (error) {
    console.error('Error deleting prompt:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
