import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { db } from '@/services/db';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    
    // Mercado Pago envía notificaciones en varios formatos (Webhooks e IPN)
    const type = body.type || url.searchParams.get('type') || url.searchParams.get('topic');
    const paymentId = body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || body.resource?.split('/').pop();

    if (type === 'payment' && paymentId) {
      // 1. Consultar el pago en Mercado Pago para verificar autenticidad y estado
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        }
      });

      if (!mpRes.ok) {
        console.error('Error al consultar pago en Mercado Pago:', paymentId);
        return NextResponse.json({ error: 'Error al consultar pago' }, { status: 400 });
      }

      const paymentData = await mpRes.json();

      // 2. Si el pago está aprobado, acreditamos créditos
      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference; // Recuperar el ID del usuario
        const transactionAmount = paymentData.transaction_amount;

        // Regla de pruebas: $1.000 ARS = 100 créditos (1 crédito por cada $10 ARS)
        let creditsToAdd = 0;
        if (transactionAmount >= 1000) {
          creditsToAdd = 100;
        } else {
          creditsToAdd = Math.floor(transactionAmount / 10);
        }

        if (userId && creditsToAdd > 0) {
          // 3. Prevenir doble acreditación registrando el pago
          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const adminClient = createSupabaseClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            
            const { error: insertErr } = await adminClient
              .from('processed_payments')
              .insert({
                payment_id: paymentId,
                user_id: userId,
                amount: transactionAmount,
                credits_added: creditsToAdd
              });

            if (insertErr && insertErr.code === '23505') {
              console.log(`[Webhook] Pago ${paymentId} ya fue procesado anteriormente. Ignorando.`);
              return NextResponse.json({ received: true, alreadyProcessed: true });
            }
          }

          // 4. Acreditar los créditos usando la interfaz de nuestro ORM db (con bypass automático de RLS)
          await db.profiles.incrementCredits(userId, creditsToAdd, { admin: true });
          console.log(`[Acreditado] ${creditsToAdd} créditos al usuario ${userId} por pago ID ${paymentId}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error en Webhook de Mercado Pago:', error);
    const errMessage = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
