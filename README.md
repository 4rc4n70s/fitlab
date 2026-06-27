# Boilerplate Next.js 14 + Supabase

Plantilla profesional y escalable utilizando Next.js (App Router), TypeScript, Tailwind CSS y Supabase para Autenticación y Base de datos.

## Requisitos Previos

- Node.js 18+
- Proyecto en Supabase (https://supabase.com)

## Configuración de Entorno

Crea un archivo `.env.local` en la raíz del proyecto y añade las siguientes variables desde tu proyecto de Supabase (Settings > API):

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

## Configuración de Supabase (SQL Editor)

Para que el registro y gestión de usuarios funcione correctamente, necesitas crear la tabla `profiles` vinculada a `auth.users`. Ejecuta este script en el SQL Editor de tu proyecto en Supabase:

```sql
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Set up Storage for avatars
insert into storage.buckets (id, name)
  values ('avatars', 'avatars');

create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

-- Create a trigger to automatically create a profile for new users
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Configurar Autenticación en Supabase

Asegúrate de ir a la sección Authentication > Providers en Supabase y habilitar:
- **Email** (desactiva 'Confirm email' para pruebas más rápidas si lo deseas).
- **Google** (configurando el Client ID y Secret desde Google Cloud Console).

## Inicialización

Para ejecutar el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.
