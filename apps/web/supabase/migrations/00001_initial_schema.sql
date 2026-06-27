-- Tabla de perfiles públicos de usuario
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Políticas de Seguridad de Fila (RLS)
alter table profiles enable row level security;

create policy "Perfiles públicos visibles para todos" on profiles for select using (true);
create policy "Usuarios pueden insertar su propio perfil" on profiles for insert with check (auth.uid() = id);
create policy "Usuarios pueden actualizar su propio perfil" on profiles for update using (auth.uid() = id);

-- Trigger automático para crear perfil tras registro en Auth.Users
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
