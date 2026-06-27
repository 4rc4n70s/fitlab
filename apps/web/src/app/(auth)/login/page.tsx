import { login, signup, signInWithGoogle } from './actions'
import { TextInput } from '@/components/text-input'
import { ButtonPrimary } from '@/components/button-primary'
import { ButtonSecondary } from '@/components/button-secondary'



export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] items-center p-4 bg-background">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Fit Lab</h1>
            <p className="text-sm text-muted mt-2">La plataforma de generación de imágenes con IA para tu marca de ropa.</p>
          </div>
          <div className="h-px w-full bg-border" />

        {searchParams.error && (
          <div className="rounded-full bg-terminal-red/10 border border-terminal-red/20 px-4 py-2 text-sm text-terminal-red text-center">
            {searchParams.error}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-charcoal ml-1">Email</label>
            <TextInput 
              id="email" 
              name="email" 
              type="email" 
              placeholder="correo@ejemplo.com" 
              required 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-charcoal ml-1">Contraseña</label>
            <TextInput 
              id="password" 
              name="password" 
              type="password" 
              required 
            />
          </div>
          <div className="flex flex-col gap-3 mt-2">
            <ButtonPrimary type="submit" formAction={login} className="w-full">
              Iniciar Sesión
            </ButtonPrimary>
            <ButtonSecondary type="submit" formAction={signup} className="w-full">
              Registrarse
            </ButtonSecondary>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted">O continuar con</span>
          </div>
        </div>

        <form action={signInWithGoogle}>
          <ButtonSecondary type="submit" className="w-full flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
              <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
              <path d="M5.26498 14.2949C5.02498 13.5699 4.875 12.8 4.875 12C4.875 11.2 5.01998 10.43 5.26498 9.70496L1.275 6.60999C0.46 8.22999 0 10.06 0 12C0 13.94 0.46 15.77 1.28 17.39L5.26498 14.2949Z" fill="#FBBC05" />
              <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
            </svg>
            Google
          </ButtonSecondary>
        </form>
        </div>
      </div>
      
      <div className="w-full text-center py-6 mt-auto">
        <a 
          href="https://tetsustudio.com" 
          target="_blank" 
          rel="noreferrer"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          tetsustudio.com
        </a>
      </div>
    </div>
  )
}
