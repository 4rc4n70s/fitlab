-- 1. Agregar columna de créditos de boilerplate a perfiles (independiente de Fitlab)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS boilerplate_credits INTEGER DEFAULT 5;

-- 2. Actualizar perfiles existentes para que tengan los 5 créditos por defecto (evita que queden en NULL)
UPDATE public.profiles SET boilerplate_credits = 5 WHERE boilerplate_credits IS NULL;

-- 3. Crear la tabla boilerplate_processed_payments para evitar doble acreditación en Boilerplate
CREATE TABLE IF NOT EXISTS public.boilerplate_processed_payments (
    payment_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    credits_added INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS) en la tabla
ALTER TABLE public.boilerplate_processed_payments ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso total a service_role (backend/adminClient)
CREATE POLICY "Permitir service_role acceso completo" ON public.boilerplate_processed_payments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 4. Crear función RPC increment_boilerplate_credits
CREATE OR REPLACE FUNCTION public.increment_boilerplate_credits(user_id UUID, amount_to_add INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Corre con privilegios de administrador para saltar RLS
AS $$
BEGIN
    UPDATE public.profiles
    SET boilerplate_credits = COALESCE(boilerplate_credits, 5) + amount_to_add
    WHERE id = user_id;
    
    -- Si el perfil de usuario no existía, lo creamos
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id, boilerplate_credits)
        VALUES (user_id, 5 + amount_to_add);
    END IF;
END;
$$;
