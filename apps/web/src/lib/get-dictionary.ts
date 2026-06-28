import 'server-only'
import { cookies } from 'next/headers'

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  es: () => import('@/dictionaries/es.json').then((module) => module.default),
}

export type Locale = keyof typeof dictionaries

export const getDictionary = async () => {
  const cookieStore = cookies()
  const locale = (cookieStore.get('NEXT_LOCALE')?.value as Locale) || 'es'
  
  if (dictionaries[locale]) {
    return dictionaries[locale]()
  }
  return dictionaries['es']()
}
