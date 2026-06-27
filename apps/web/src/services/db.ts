import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  boilerplate_credits: number;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

// Resuelve dinámicamente la instancia del cliente adecuado (Cliente, Servidor o Admin)
function getClient(adminMode: boolean = false) {
  // 1. Si se solicita modo administrador y la Service Role Key está disponible en el servidor
  if (adminMode && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // 2. Si estamos ejecutando en el servidor (API routes, Server Actions, SSR)
  const isServer = typeof window === 'undefined';
  if (isServer) {
    // Importación dinámica para prevenir errores de bundle en código cliente
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient: createServerClient } = require('@/lib/supabase/server');
    return createServerClient();
  }

  // 3. Cliente estándar de navegador
  return createBrowserClient();
}

/**
 * ⚡ Boilerplate Custom Lightweight ORM
 * Provee una interfaz tipada y unificada de acceso a la base de datos Supabase
 */
export const db = {
  profiles: {
    /**
     * Busca un perfil de usuario por su ID
     */
    async findUnique(userId: string, options?: { admin?: boolean }): Promise<Profile | null> {
      const client = getClient(options?.admin);
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },

    /**
     * Crea un nuevo perfil en la base de datos
     */
    async create(data: { id: string; boilerplate_credits?: number }, options?: { admin?: boolean }): Promise<Profile> {
      const client = getClient(options?.admin);
      const { data: newProfile, error } = await client
        .from('profiles')
        .insert({
          id: data.id,
          boilerplate_credits: data.boilerplate_credits ?? 5
        })
        .select()
        .single();

      if (error) throw error;
      return newProfile;
    },

    /**
     * Actualiza propiedades del perfil de usuario
     */
    async update(userId: string, data: Partial<Omit<Profile, 'id'>>, options?: { admin?: boolean }): Promise<Profile> {
      const client = getClient(options?.admin);
      const { data: updated, error } = await client
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },

    /**
     * Incrementa saldo de créditos de manera segura usando RPC con fallback directo
     */
    async incrementCredits(userId: string, amount: number, options?: { admin?: boolean }): Promise<void> {
      const client = getClient(options?.admin);
      
      try {
        const { error: rpcErr } = await client.rpc('increment_boilerplate_credits', {
          user_id: userId,
          amount_to_add: amount
        });
        
        if (!rpcErr) return;
        console.warn('RPC increment_boilerplate_credits no disponible, usando fallback directo:', rpcErr.message);
      } catch (e) {
        console.warn('Excepción al ejecutar RPC increment_boilerplate_credits:', e);
      }

      // Fallback directo: Obtener saldo actual, sumar y actualizar
      const profile = await this.findUnique(userId, options);
      const currentCredits = profile?.boilerplate_credits || 0;
      await this.update(userId, { boilerplate_credits: currentCredits + amount }, options);
    },

    /**
     * Resta saldo de créditos de manera segura usando RPC con fallback directo
     */
    async decrementCredits(userId: string, amount: number, options?: { admin?: boolean }): Promise<void> {
      const client = getClient(options?.admin);
      
      try {
        const { error: rpcErr } = await client.rpc('decrement_boilerplate_credits', {
          user_id: userId,
          amount_to_subtract: amount
        });
        
        if (!rpcErr) return;
        console.warn('RPC decrement_boilerplate_credits no disponible, usando fallback directo:', rpcErr.message);
      } catch (e) {
        console.warn('Excepción al ejecutar RPC decrement_boilerplate_credits:', e);
      }

      // Fallback directo: Obtener saldo actual, validar, restar y actualizar
      const profile = await this.findUnique(userId, options);
      const currentCredits = profile?.boilerplate_credits || 0;
      if (currentCredits < amount) throw new Error('Saldo de créditos insuficiente.');
      await this.update(userId, { boilerplate_credits: currentCredits - amount }, options);
    }
  }
};
