-- Crear tabla de prompts guardados por usuario
CREATE TABLE IF NOT EXISTS public.user_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad de Fila (RLS)
CREATE POLICY "Usuarios pueden ver sus propios prompts" 
ON public.user_prompts 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios prompts" 
ON public.user_prompts 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios prompts" 
ON public.user_prompts 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
