import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processTryOn } from '@/services/gemini';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('La variable GEMINI_API_KEY no está configurada en el servidor.');
      return NextResponse.json({ error: 'La variable de entorno GEMINI_API_KEY no está configurada en el servidor de Vercel. Por favor, configúrala en Vercel.' }, { status: 500 });
    }

    const isUnlimited = user.email === 'zanardi.ag@gmail.com';

    if (!isUnlimited) {
      // 1. Obtener perfil para verificar saldo
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profileErr || !profile) {
        return NextResponse.json({ error: 'No se pudo obtener el saldo de créditos' }, { status: 500 });
      }

      if (profile.credits < 1) {
        return NextResponse.json({ error: 'Créditos insuficientes. Por favor compra créditos o introduce tu API Key.' }, { status: 403 });
      }
    }

    // 2. Leer payload del cuerpo del request
    const body = await request.json();
    const { modelName, prompt, anchors, modelPhoto } = body;

    if (!modelName || !prompt || !anchors || !modelPhoto) {
      return NextResponse.json({ error: 'Parámetros de configuración faltantes.' }, { status: 400 });
    }

    // 3. Procesar el try-on con la API Key del Servidor
    const geminiRes = await processTryOn({
      apiKey: process.env.GEMINI_API_KEY!,
      modelName,
      prompt,
      anchors,
      modelPhoto
    });

    if (geminiRes.success && geminiRes.base64 && geminiRes.mimeType) {
      // 4. Si la generación fue exitosa, descontamos 1 crédito de forma segura en Supabase
      if (!isUnlimited) {
        const { data: successDec, error: decErr } = await supabase.rpc('decrement_user_credits', {
          user_id: user.id,
          amount_to_subtract: 1
        });

        if (decErr || successDec === false) {
          return NextResponse.json({ error: 'Error al descontar los créditos o saldo insuficiente.' }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        base64: geminiRes.base64,
        mimeType: geminiRes.mimeType
      });
    } else {
      return NextResponse.json({
        success: false,
        error: geminiRes.error || 'Error al procesar la imagen con IA.'
      }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Error en Try-On API secure route:', error);
    const errMessage = error instanceof Error ? error.message : 'Error interno del servidor.';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
