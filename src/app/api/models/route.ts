import { NextResponse } from 'next/server';
import { getAvailableModels } from '@/services/gemini';

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.error('La variable GEMINI_API_KEY no está configurada en el servidor.');
      return NextResponse.json({ error: 'La variable de entorno GEMINI_API_KEY no está configurada en el servidor de Vercel. Por favor, configúrala en Vercel.' }, { status: 500 });
    }

    const res = await getAvailableModels(process.env.GEMINI_API_KEY);
    if (res.success && res.models) {
      return NextResponse.json(res.models);
    } else {
      return NextResponse.json({ error: res.error || 'Failed to fetch models' }, { status: 500 });
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
