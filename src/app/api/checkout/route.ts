import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('La variable MP_ACCESS_TOKEN no está configurada en el servidor.');
      return NextResponse.json({ error: 'La variable de entorno MP_ACCESS_TOKEN no está configurada en el servidor de Vercel. Por favor, configúrala en Vercel.' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://virtual-try-on-ashen.vercel.app';

    const amount = 100; // $100 ARS de prueba
    const creditsToAssign = 100; // 100 imágenes

    // Generar la preferencia de Mercado Pago
    const preferenceData = {
      items: [
        {
          id: 'fitlab-credits-100',
          title: `${creditsToAssign} Créditos para Fit Lab`,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS',
          description: 'Créditos para generar prendas virtuales con IA de alta calidad',
        }
      ],
      // ENLACE CRÍTICO: Asociamos el ID del usuario como external_reference
      external_reference: user.id,
      back_urls: {
        success: `${origin}/?payment=success`,
        pending: `${origin}/?payment=pending`,
        failure: `${origin}/?payment=failure`,
      },
      auto_return: 'approved',
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    });

    const preference = await response.json();

    if (!response.ok) {
      console.error('Error de Mercado Pago:', preference);
      return NextResponse.json({ error: preference.message || 'Error al generar preferencia de Mercado Pago.' }, { status: 400 });
    }

    return NextResponse.json({ init_point: preference.init_point });
  } catch (error: unknown) {
    console.error('Error en Checkout API:', error);
    const errMessage = error instanceof Error ? error.message : 'Error interno del servidor.';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
