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
  const handleBuyCredits = async (planId: string) => {
    if (!user) {
      alert(language === 'es' ? 'Debes iniciar sesión para comprar créditos.' : 'You must sign in to buy credits.')
      return
    }
    
    setIsCheckoutLoading(true)
    try {
      const res = await fetch('/api/checkout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })
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
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col pb-24">
      <div className="flex flex-col gap-8 p-6 md:p-10 max-w-6xl mx-auto w-full text-foreground flex-1">
      
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
          disabled={isSyncing}
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
      <div className="flex flex-col gap-8">
        
        {/* Card Saldo Actual */}
        <div className="rounded-2xl border border-border bg-gradient-to-b from-surface-card to-background p-6 flex flex-col justify-between shadow-xl relative overflow-hidden group">
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
              ? 'Se consume 1 crédito por cada imagen generada.' 
              : '1 credit is consumed per generated image.'}
          </div>
        </div>

        {/* Planes de Compra */}
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              id: 'basic',
              name: language === 'es' ? 'Paquete Básico' : 'Basic Pack',
              credits: 10,
              originalPrice: 9900,
              price: 7920,
              popular: false
            },
            {
              id: 'standard',
              name: language === 'es' ? 'Paquete Estándar' : 'Standard Pack',
              credits: 30,
              originalPrice: 23900,
              price: 19120,
              popular: true
            },
            {
              id: 'pro',
              name: language === 'es' ? 'Paquete Pro' : 'Pro Pack',
              credits: 100,
              originalPrice: 59900,
              price: 47920,
              popular: false
            }
          ].map((plan) => (
            <div key={plan.id} className={`rounded-2xl border ${plan.popular ? 'border-primary shadow-primary/20 shadow-2xl relative' : 'border-border shadow-xl'} bg-gradient-to-b from-surface-card to-background p-6 flex flex-col justify-between gap-6 overflow-hidden`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  {language === 'es' ? 'Más popular' : 'Most popular'}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">${plan.price.toLocaleString('es-AR')}</span>
                  <span className="text-sm font-semibold text-muted-foreground">ARS</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="line-through text-muted-foreground">${plan.originalPrice.toLocaleString('es-AR')}</span>
                  <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">20% OFF</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>{plan.credits} {language === 'es' ? 'créditos Fitlab' : 'Fitlab credits'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{language === 'es' ? 'Acreditación instantánea' : 'Instant delivery'}</span>
                </div>
              </div>

              <button
                onClick={() => handleBuyCredits(plan.id)}
                disabled={isCheckoutLoading || isSyncing}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transform ${plan.popular ? 'bg-primary hover:bg-primary-hover text-white hover:shadow-primary/20' : 'bg-surface-soft hover:bg-surface border border-border text-foreground'}`}
              >
                {isCheckoutLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {language === 'es' ? 'Comprar' : 'Buy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de compras (Mock) */}
      <div className="mt-8 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-foreground font-heading">
          {language === 'es' ? 'Historial de Compras' : 'Purchase History'}
        </h2>
        <div className="rounded-2xl border border-border bg-surface-card overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-soft text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">{language === 'es' ? 'Fecha' : 'Date'}</th>
                <th className="px-6 py-4 font-medium">{language === 'es' ? 'Detalle' : 'Detail'}</th>
                <th className="px-6 py-4 font-medium">{language === 'es' ? 'Monto' : 'Amount'}</th>
                <th className="px-6 py-4 font-medium">{language === 'es' ? 'Estado' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Ejemplo mockeado */}
              <tr className="hover:bg-surface-soft/50 transition-colors">
                <td className="px-6 py-4 text-foreground whitespace-nowrap">
                  {new Date().toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {language === 'es' ? 'Paquete Estándar (100 créditos)' : 'Standard Pack (100 credits)'}
                </td>
                <td className="px-6 py-4 text-foreground font-medium">
                  $100 ARS
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'es' ? 'Aprobado' : 'Approved'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
