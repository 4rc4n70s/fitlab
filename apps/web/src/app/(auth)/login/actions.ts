'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

import { z } from 'zod'

const authSchema = z.object({
  email: z.string().email("El correo electrónico no es válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
})

export async function login(formData: FormData) {
  const supabase = createClient()

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = authSchema.safeParse(rawData)
  if (!parsed.success) {
    return redirect('/login?error=' + encodeURIComponent(parsed.error.issues[0].message))
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/main')
}

export async function signup(formData: FormData) {
  const supabase = createClient()
  const origin = headers().get('origin')

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const parsed = authSchema.safeParse(rawData)
  if (!parsed.success) {
    return redirect('/login?error=' + encodeURIComponent(parsed.error.issues[0].message))
  }

  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/main')
}

export async function signInWithGoogle() {
  const supabase = createClient()
  const origin = headers().get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  if (data.url) {
    redirect(data.url)
  }
}
