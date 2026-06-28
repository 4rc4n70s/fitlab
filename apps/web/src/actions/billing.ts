'use server'

import { createClient } from '@/lib/supabase/server'

export async function getBillingHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Usuario no autenticado.' }
  }

  const { data, error } = await supabase
    .from('boilerplate_processed_payments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching billing history:', error)
    return { success: false, error: 'Error al obtener el historial.' }
  }

  return { success: true, data }
}
