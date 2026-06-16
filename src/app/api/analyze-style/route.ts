import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeStylePromptFromImage } from '@/services/gemini';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('La variable GEMINI_API_KEY no está configurada en el servidor.');
      return NextResponse.json({ error: 'La variable de entorno GEMINI_API_KEY no está configurada en el servidor.' }, { status: 500 });
    }

    const body = await request.json();
    const { base64, mimeType } = body;

    if (!base64 || !mimeType) {
      return NextResponse.json({ error: 'Parámetros faltantes.' }, { status: 400 });
    }

    const res = await analyzeStylePromptFromImage(process.env.GEMINI_API_KEY, base64, mimeType);

    if (res.success && res.promptText) {
      return NextResponse.json({
        success: true,
        promptText: res.promptText
      });
    } else {
      return NextResponse.json({
        success: false,
        error: res.error || 'Error al analizar el estilo de la imagen.'
      }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Error en Analyze Style API:', error);
    const errMessage = error instanceof Error ? error.message : 'Error interno del servidor.';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
