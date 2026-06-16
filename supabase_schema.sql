-- Script de configuración de Base de Datos para Supabase
-- Puedes ejecutar esto en el editor SQL (SQL Editor) de tu consola de Supabase.

-- 1. Crear la tabla processed_payments para evitar doble acreditación (Re-entrancy protection)
CREATE TABLE IF NOT EXISTS processed_payments (
    payment_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL, -- UUID de Supabase Auth
    amount NUMERIC(10, 2) NOT NULL,
    credits_added INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en processed_payments
ALTER TABLE processed_payments ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso total a service_role (usado por el backend/adminClient)
CREATE POLICY "Permitir service_role acceso completo" ON processed_payments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 2. Crear función RPC increment_user_credits para incrementar créditos de forma segura
CREATE OR REPLACE FUNCTION increment_user_credits(user_id UUID, amount_to_add INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Corre con privilegios de administrador para poder saltar RLS si es necesario
AS $$
BEGIN
    UPDATE profiles
    SET credits = COALESCE(credits, 0) + amount_to_add
    WHERE id = user_id;
    
    -- Si el perfil de usuario no existía aún en la tabla de perfiles, lo creamos
    IF NOT FOUND THEN
        INSERT INTO profiles (id, credits)
        VALUES (user_id, amount_to_add);
    END IF;
END;
$$;
