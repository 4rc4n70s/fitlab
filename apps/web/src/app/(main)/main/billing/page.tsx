'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { useUser } from '@/hooks/use-user'
import { useUI } from '@/hooks/use-ui'
import { CreditCard, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'

interface UserProfile {
  boilerplate_credits?: number;
}

export default function BillingPage() {
  const { user, profile, isLoading: isUserLoading } = useUser()
  const { language } = useUI()
  
  const [localCredits, setLocalCredits] = useState<number | null>(null)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Sincronizar el saldo local con el perfil cargado de Supabase
  useEffect(() => {
    if (profile) {
      setLocalCredits((profile as unknown as UserProfile).boilerplate_credits ?? 5)
    }
  }, [profile])

  // Escuchar parámetros de redirección de Mercado Pago
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment') || params.get('status') || params.get('collection_status')
    const paymentId = params.get('payment_id') || params.get('collection_id')

    if ((paymentStatus === 'success' || paymentStatus === 'approved') && paymentId) {
      setIsSyncing(true)
      setStatusMessage(language === 'es' ? 'Sincronizando créditos con Mercado Pago...' : 'Syncing credits with Mercado Pago...')

      fetch(`/api/sync-credits?payment_id=${paymentId}`)
        .then(async (res) => {
          const data = await res.json()
          if (res.ok && data.success) {
            setLocalCredits(data.credits)
            alert(data.message || (language === 'es' ? '¡Créditos acreditados con éxito!' : 'Credits synced successfully!'))
          } else {
            console.error('Error al sincronizar:', data.error)
            alert(language === 'es' 
              ? 'Tu pago fue aprobado, pero se acreditará de forma asíncrona mediante el webhook en unos segundos.' 
              : 'Your payment was approved, but it will be credited asynchronously via webhook in a few seconds.'
            )
          }
        })
        .catch((err) => {
          console.error('Error en fetch de sincronización:', err)
        })
        .finally(() => {
          setIsSyncing(false)
          setStatusMessage(null)
          // Limpiar la URL para evitar ejecuciones repetidas al recargar
          const newUrl = window.location.pathname
          window.history.replaceState({}, document.title, newUrl)
        })
    } else if (paymentStatus === 'failure' || paymentStatus === 'rejected' || paymentStatus === 'pending') {
      alert(language === 'es' 
        ? 'El pago fue cancelado o no pudo ser completado.' 
        : 'Payment was canceled or could not be completed.'
      )
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [language])

  // Ejecutar checkout
  const handleBuyCredits = async () => {
    if (!user) {
      alert(language === 'es' ? 'Debes iniciar sesión para comprar créditos.' : 'You must sign in to buy credits.')
      return
    }
    
    setIsCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.preference_id) {
        // Detectar si es dispositivo móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        
        if (isMobile) {
          // En móviles redirigir directamente (previene bloqueos de popups y fallos de rendering del modal)
          window.location.href = data.init_point
        } else {
          // En desktop usar modal integrado
          const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'APP_USR-18dd512b-ee57-41af-bf28-e4ee5791cd79'
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const MercadoPagoClass = (window as any).MercadoPago
          if (MercadoPagoClass) {
            const mp = new MercadoPagoClass(MP_PUBLIC_KEY, { locale: 'es-AR' })
            mp.checkout({
              preference: {
                id: data.preference_id
              },
              autoOpen: true,
              onClose: () => {
                setIsCheckoutLoading(false)
                // Limpieza forzada de residuos en el DOM de Mercado Pago
                const overlays = document.querySelectorAll('.mercadopago-modal-container, .mercadopago-iframe')
                overlays.forEach(el => el.remove())
              }
            })
            // Fallback de desbloqueo automático tras abrir
            setTimeout(() => {
              setIsCheckoutLoading(false)
            }, 3000)
          } else {
            window.location.href = data.init_point
            setIsCheckoutLoading(false)
          }
        }
      } else {
        alert(language === 'es' 
          ? `Error al iniciar checkout: ${data.error || 'Intenta nuevamente.'}` 
          : `Checkout error: ${data.error || 'Try again.'}`
        )
        setIsCheckoutLoading(false)
      }
    } catch (err) {
      console.error('Checkout connection error:', err)
      alert(language === 'es' ? 'Error al conectar con Mercado Pago.' : 'Connection error with Mercado Pago.')
      setIsCheckoutLoading(false)
    }
  }

  // Sincronización manual histórica
  const handleManualSync = async () => {
    setIsSyncing(true)
    setStatusMessage(language === 'es' ? 'Buscando pagos históricos pendientes...' : 'Searching for pending historical payments...')
    try {
      const res = await fetch('/api/sync-credits')
      const data = await res.json()
      if (res.ok && data.success) {
        setLocalCredits(data.credits)
        alert(data.message)
      } else {
        alert(data.error || 'Error al sincronizar.')
      }
    } catch (err) {
      console.error(err)
      alert('Error de conexión.')
    } finally {
      setIsSyncing(false)
      setStatusMessage(null)
    }
  }

  const creditsToShow = localCredits !== null ? localCredits : ((profile as unknown as UserProfile)?.boilerplate_credits ?? 5)

  return (
    <div className="flex flex-col gap-8 p-6 md:p-10 max-w-5xl mx-auto w-full text-foreground">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight font-heading bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
            {language === 'es' ? 'Facturación y Créditos' : 'Billing & Credits'}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {language === 'es' 
              ? 'Administra tu cuenta, adquiere créditos y consulta tu historial de pagos.' 
              : 'Manage your account, purchase credits, and view your payment history.'}
          </p>
        </div>

        {/* Botón de Sincronizar */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing || isUserLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-surface-soft border border-border hover:bg-surface hover:text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {language === 'es' ? 'Sincronizar Saldo' : 'Sync Balance'}
        </button>
      </div>

      {/* Mensaje de Estado / Cargando */}
      {statusMessage && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary-foreground animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-foreground">{statusMessage}</span>
        </div>
      )}

      {/* Panel Principal */}
      <div className="grid gap-8 md:grid-cols-3">
        
        {/* Card Saldo Actual (Izquierda) */}
        <div className="md:col-span-1 rounded-2xl border border-border bg-gradient-to-b from-surface-card to-background p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-500" />
          <div className="flex flex-col gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                {language === 'es' ? 'Créditos Disponibles' : 'Available Credits'}
              </h3>
              <p className="text-5xl font-extrabold tracking-tight mt-1 text-foreground">
                {isUserLoading ? (
                  <span className="inline-block w-16 h-10 bg-surface-soft rounded-lg animate-pulse" />
                ) : (
                  creditsToShow === 999999 
                    ? (language === 'es' ? 'Ilimitados' : 'Unlimited') 
                    : creditsToShow
                )}
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-border/60 text-xs text-muted-foreground relative z-10">
            {language === 'es' 
              ? 'Los créditos se consumen al ejecutar tareas en el Boilerplate.' 
              : 'Credits are consumed when running tasks on the Boilerplate.'}
          </div>
        </div>

        {/* Card Oferta / Paquete de Compra (Derecha) */}
        <div className="md:col-span-2 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 via-transparent to-transparent p-8 flex flex-col md:flex-row justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          
          {/* Detalles del paquete */}
          <div className="flex flex-col justify-between gap-6 flex-1">
            <div className="flex flex-col gap-2">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wider uppercase w-fit">
                {language === 'es' ? 'Oferta de Lanzamiento' : 'Launch Offer'}
              </span>
              <h2 className="text-2xl font-bold text-foreground">
                {language === 'es' ? 'Paquete Estándar' : 'Standard Pack'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {language === 'es' 
                  ? 'Añade créditos de forma inmediata y segura a tu cuenta.' 
                  : 'Add credits immediately and securely to your account.'}
              </p>
            </div>

            {/* Lista de características */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === 'es' ? '100 créditos para Boilerplate' : '100 credits for Boilerplate'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{language === 'es' ? 'Acreditación instantánea y segura' : 'Instant & secure delivery'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>{language === 'es' ? 'Garantía por doble pago de Mercado Pago' : 'Anti-reentrancy transaction protection'}</span>
              </div>
            </div>
          </div>

          {/* Precio y Botón de Pago */}
          <div className="flex flex-col justify-between items-center md:items-end gap-6 min-w-[200px] shrink-0 border-t md:border-t-0 md:border-l border-border/60 pt-6 md:pt-0 md:pl-8">
            <div className="text-center md:text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-widest block">
                {language === 'es' ? 'Precio Final' : 'Final Price'}
              </span>
              <span className="text-4xl font-extrabold text-foreground tracking-tight">$100</span>
              <span className="text-sm font-semibold text-muted-foreground ml-1">ARS</span>
            </div>

            <button
              onClick={handleBuyCredits}
              disabled={isCheckoutLoading || isSyncing}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary-hover hover:to-violet-500 text-white font-semibold text-sm shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transform"
            >
              {isCheckoutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'es' ? 'Iniciando Pago...' : 'Starting Payment...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {language === 'es' ? 'Pagar con Mercado Pago' : 'Pay with Mercado Pago'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <Script src="https://sdk.mercadopago.com/js/v2" strategy="lazyOnload" />
      
      {/* Estilos para forzar un modal más grande en desktop sin barras de scroll */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 768px) {
          .mercadopago-modal-container {
            padding: 24px !important;
          }
          .mercadopago-iframe {
            width: 90% !important;
            height: 90% !important;
            max-width: 1100px !important;
            max-height: 850px !important;
            border-radius: 20px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          }
        }
      `}} />
    </div>
  )
}
