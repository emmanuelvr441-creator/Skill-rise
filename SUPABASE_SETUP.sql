-- ============================================================
-- SKILLRISE — SQL completo para Supabase
-- Ejecuta esto en: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. TABLA PROFILES (extiende auth.users)
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  username      text unique,
  display_name  text,
  bio           text,
  avatar_url    text,
  interests     text[] default '{}',
  is_public     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. TABLA COURSES
create table if not exists public.courses (
  id            uuid default gen_random_uuid() primary key,
  creator_id    uuid references public.profiles(id) on delete cascade not null,
  title         text not null,
  description   text,
  thumbnail_url text,
  is_public     boolean default true,
  skill_tags    text[] default '{}',
  created_at    timestamptz default now()
);

-- 3. TABLA LESSONS
create table if not exists public.lessons (
  id           uuid default gen_random_uuid() primary key,
  course_id    uuid references public.courses(id) on delete cascade not null,
  title        text not null,
  content_type text check (content_type in ('video','text','pdf','file')) default 'text',
  content_url  text,
  content_body text,
  order_index  int default 0,
  created_at   timestamptz default now()
);

-- 4. TABLA ENROLLMENTS (inscripciones)
create table if not exists public.enrollments (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  course_id    uuid references public.courses(id) on delete cascade not null,
  progress_pct int default 0 check (progress_pct between 0 and 100),
  completed_at timestamptz,
  enrolled_at  timestamptz default now(),
  unique(user_id, course_id)
);

-- 5. TABLA LESSON_PROGRESS
create table if not exists public.lesson_progress (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  lesson_id  uuid references public.lessons(id) on delete cascade not null,
  completed  boolean default false,
  done_at    timestamptz,
  unique(user_id, lesson_id)
);

-- 6. TABLA USER_SKILLS (generadas automáticamente)
create table if not exists public.user_skills (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  skill_name       text not null,
  category         text check (category in ('tecnologia','atencion_al_cliente','industria_alimentaria','seguridad_e_higiene','general')) default 'general',
  level            text check (level in ('basico','intermedio','avanzado')) default 'basico',
  source_course_id uuid references public.courses(id) on delete set null,
  created_at       timestamptz default now(),
  unique(user_id, skill_name)
);

-- 7. TABLA POSTS (feed global)
create table if not exists public.posts (
  id         uuid default gen_random_uuid() primary key,
  author_id  uuid references public.profiles(id) on delete cascade not null,
  content    text not null,
  image_url  text,
  group_id   uuid,
  created_at timestamptz default now()
);

-- ============================================================
-- ACTIVAR ROW LEVEL SECURITY (protección por usuario)
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.courses        enable row level security;
alter table public.lessons        enable row level security;
alter table public.enrollments    enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.user_skills    enable row level security;
alter table public.posts          enable row level security;

-- ============================================================
-- POLÍTICAS RLS
-- ============================================================

-- PROFILES
create policy "Perfiles públicos visibles para todos"
  on public.profiles for select using (is_public = true);
create policy "Usuario ve su propio perfil"
  on public.profiles for select using (auth.uid() = id);
create policy "Usuario actualiza su perfil"
  on public.profiles for update using (auth.uid() = id);
create policy "Usuario inserta su perfil"
  on public.profiles for insert with check (auth.uid() = id);

-- COURSES
create policy "Cursos públicos visibles para todos"
  on public.courses for select using (is_public = true);
create policy "Usuario ve sus cursos privados"
  on public.courses for select using (auth.uid() = creator_id);
create policy "Usuario crea cursos"
  on public.courses for insert with check (auth.uid() = creator_id);
create policy "Usuario edita sus cursos"
  on public.courses for update using (auth.uid() = creator_id);
create policy "Usuario elimina sus cursos"
  on public.courses for delete using (auth.uid() = creator_id);

-- LESSONS
create policy "Lecciones visibles si el curso es público"
  on public.lessons for select using (
    exists (select 1 from public.courses c where c.id = course_id and (c.is_public = true or c.creator_id = auth.uid()))
  );
create policy "Creador gestiona lecciones"
  on public.lessons for all using (
    exists (select 1 from public.courses c where c.id = course_id and c.creator_id = auth.uid())
  );

-- ENROLLMENTS
create policy "Usuario ve sus inscripciones"
  on public.enrollments for select using (auth.uid() = user_id);
create policy "Usuario se inscribe"
  on public.enrollments for insert with check (auth.uid() = user_id);
create policy "Usuario actualiza su progreso"
  on public.enrollments for update using (auth.uid() = user_id);

-- LESSON_PROGRESS
create policy "Usuario ve su progreso"
  on public.lesson_progress for select using (auth.uid() = user_id);
create policy "Usuario registra progreso"
  on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "Usuario actualiza progreso"
  on public.lesson_progress for update using (auth.uid() = user_id);

-- USER_SKILLS
create policy "Skills públicas si perfil es público"
  on public.user_skills for select using (
    exists (select 1 from public.profiles p where p.id = user_id and p.is_public = true)
  );
create policy "Usuario ve sus skills"
  on public.user_skills for select using (auth.uid() = user_id);
create policy "Sistema inserta skills"
  on public.user_skills for insert with check (auth.uid() = user_id);
create policy "Sistema actualiza skills"
  on public.user_skills for update using (auth.uid() = user_id);

-- POSTS
create policy "Posts visibles para todos"
  on public.posts for select using (true);
create policy "Usuario crea posts"
  on public.posts for insert with check (auth.uid() = author_id);
create policy "Usuario elimina sus posts"
  on public.posts for delete using (auth.uid() = author_id);

-- ============================================================
-- TRIGGER: crear perfil automáticamente al registrarse
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g')) || '_' || substr(new.id::text, 1, 4)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: calcular progreso del curso automáticamente
-- ============================================================
create or replace function public.update_course_progress()
returns trigger as $$
declare
  total_lessons int;
  done_lessons int;
  pct int;
begin
  select count(*) into total_lessons from public.lessons where course_id = (
    select course_id from public.lessons where id = new.lesson_id
  );
  select count(*) into done_lessons from public.lesson_progress
  where user_id = new.user_id and completed = true
  and lesson_id in (
    select id from public.lessons where course_id = (
      select course_id from public.lessons where id = new.lesson_id
    )
  );
  if total_lessons > 0 then
    pct := (done_lessons * 100) / total_lessons;
  else
    pct := 0;
  end if;
  update public.enrollments
  set progress_pct = pct,
      completed_at = case when pct = 100 then now() else null end
  where user_id = new.user_id
  and course_id = (select course_id from public.lessons where id = new.lesson_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_lesson_completed on public.lesson_progress;
create trigger on_lesson_completed
  after insert or update on public.lesson_progress
  for each row execute procedure public.update_course_progress();
