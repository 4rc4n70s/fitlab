import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { db } from '@/services/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('payment_id');
    
    // 1. Verificar la sesión del usuario
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Usuario no autenticado.' }, { status: 401 });
    }

    const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
      : supabase;

    // --- COMPORTAMIENTO B: SINCRO GENÉRICA DE PAGOS HISTÓRICOS ---
    if (!paymentId) {
      if (!process.env.MP_ACCESS_TOKEN) {
        const profile = await db.profiles.findUnique(user.id);
        return NextResponse.json({ success: true, credits: profile?.credits || 0 });
      }

      // Buscar pagos aprobados con el ID del usuario en Mercado Pago
      const searchRes = await fetch(`https://api.mercadopago.com/v1/payments/search?external_reference=${user.id}&status=approved`, {
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        }
      });

      if (!searchRes.ok) {
        console.error('Error al buscar pagos en Mercado Pago para usuario:', user.id);
        const profile = await db.profiles.findUnique(user.id);
        return NextResponse.json({ 
          success: true, 
          credits: profile?.credits || 0, 
          message: 'No se pudieron sincronizar compras históricas temporalmente.' 
        });
      }

      const searchData = await searchRes.json();
      const payments = searchData.results || [];
      
      let newlyCredited = 0;
      
      for (const payment of payments) {
        const pId = String(payment.id);
        const transactionAmount = payment.transaction_amount;
        const creditsToAdd = transactionAmount >= 1000 ? 100 : Math.floor(transactionAmount / 10);

        if (creditsToAdd <= 0) continue;

        // Intentar registrar el pago para comprobar si ya fue procesado
        const { error: insertErr } = await adminClient
          .from('processed_payments')
          .insert({
            payment_id: pId,
            user_id: user.id,
            amount: transactionAmount,
            credits_added: creditsToAdd
          });

        // Si se inserta correctamente (no existía), se le acreditan los créditos correspondientes
        if (!insertErr) {
          await db.profiles.incrementCredits(user.id, creditsToAdd, { admin: true });
          newlyCredited += creditsToAdd;
          console.log(`[Sincro Histórica] ${creditsToAdd} créditos acreditados al usuario ${user.id} por pago histórico ID ${pId}`);
        }
      }

      const updatedProfile = await db.profiles.findUnique(user.id);
      return NextResponse.json({
        success: true,
        credits: updatedProfile?.credits || 0,
        newlyCredited,
        message: newlyCredited > 0 
          ? `¡Se encontraron pagos anteriores pendientes y se te acreditaron ${newlyCredited} créditos con éxito!` 
          : 'Tus créditos están completamente actualizados.'
      });
    }

    // --- COMPORTAMIENTO A: SINCRO DE UN PAGO ESPECÍFICO (REDIRECT DE COMPRA) ---
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      }
    });

    if (!mpRes.ok) {
      console.error('Error al consultar pago en Mercado Pago desde sync:', paymentId);
      return NextResponse.json({ error: 'No se pudo verificar el pago con Mercado Pago.' }, { status: 400 });
    }

    const paymentData = await mpRes.json();

    // Validar estado y pertenencia del pago
    if (paymentData.status !== 'approved') {
      return NextResponse.json({ error: `El pago no está aprobado. Estado: ${paymentData.status}` }, { status: 400 });
    }

    const paymentUserId = paymentData.external_reference;
    if (paymentUserId !== user.id) {
      return NextResponse.json({ error: 'El pago no corresponde al usuario autenticado.' }, { status: 403 });
    }

    const transactionAmount = paymentData.transaction_amount;
    let creditsToAdd = 0;
    if (transactionAmount >= 1000) {
      creditsToAdd = 100;
    } else {
      creditsToAdd = Math.floor(transactionAmount / 10);
    }

    if (creditsToAdd <= 0) {
      return NextResponse.json({ error: 'El monto de la transacción no es válido para sumar créditos.' }, { status: 400 });
    }

    // Intentar registrar el pago para evitar doble acreditación (Re-entrancy protection)
    const { error: insertErr } = await adminClient
      .from('processed_payments')
      .insert({
        payment_id: paymentId,
        user_id: user.id,
        amount: transactionAmount,
        credits_added: creditsToAdd
      });

    if (insertErr) {
      if (insertErr.code === '23505') {
        console.log(`El pago ${paymentId} ya fue acreditado anteriormente.`);
        const profile = await db.profiles.findUnique(user.id);
        return NextResponse.json({ 
          success: true, 
          alreadyProcessed: true, 
          credits: profile?.credits || 0,
          message: 'Este pago ya fue acreditado con anterioridad.' 
        });
      }
      
      if (insertErr.code === '42P01') {
        console.warn('Tabla processed_payments no existe. Por favor ejecuta el script de migración SQL en Supabase.');
      } else {
        console.error('Error al registrar pago procesado:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    // Incrementar los créditos del usuario usando el ORM seguro
    await db.profiles.incrementCredits(user.id, creditsToAdd, { admin: true });
    
    // Obtener los créditos finales actualizados
    const updatedProfile = await db.profiles.findUnique(user.id);

    console.log(`[Sync Acreditado] ${creditsToAdd} créditos sincronizados al usuario ${user.id} por pago ID ${paymentId}`);

    return NextResponse.json({ 
      success: true, 
      credits: updatedProfile?.credits || 0,
      message: `¡Se acreditaron ${creditsToAdd} créditos con éxito!`
    });
  } catch (error: unknown) {
    console.error('Error en Sync Credits API:', error);
    const errMessage = error instanceof Error ? error.message : 'Error interno de sincronización.';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
