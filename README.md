# SkillRise 🚀

Plataforma de capacitación con perfil profesional basado en habilidades reales generadas por IA.

## Qué incluye este MVP

- Registro e inicio de sesión (email)
- Perfil público por usuario con bio y habilidades
- Creación y visualización de cursos con lecciones (video, texto, PDF, archivos)
- Sistema de progreso por lección
- Motor de habilidades automático: al completar un curso, la IA genera tus skills
- Página Explorar: busca usuarios por nombre o habilidad
- Sin company_id — cada usuario es independiente desde el registro

---

## Pasos para desplegarlo (sin instalar nada en tu computadora)

### 1. Crear el repositorio en GitHub

1. Ve a **github.com** → New repository
2. Nombre: `skillrise`, público
3. NO inicialices con README
4. En la página de tu nuevo repo, haz clic en **"uploading an existing file"**
5. Sube todos los archivos de este ZIP manteniendo la estructura de carpetas

### 2. Configurar Supabase

1. Ve a **supabase.com** → New project → Nombre: `skillrise`
2. Espera 2-3 minutos a que se cree
3. Ve a **SQL Editor → New Query**
4. Pega el contenido completo de `SUPABASE_SETUP.sql` y haz clic en **Run**
5. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

### 3. Configurar variables de entorno en Vercel

1. Ve a **vercel.com** → Add New Project → importa tu repo de GitHub
2. Antes de hacer Deploy, en **Environment Variables** agrega:
   ```
   NEXT_PUBLIC_SUPABASE_URL    = tu Project URL de Supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY = tu anon key de Supabase
   ANTHROPIC_API_KEY           = tu API key de Anthropic (opcional, para skills con IA)
   ```
3. Haz clic en **Deploy**

### 4. Configurar URL en Supabase

1. En Supabase → **Authentication → URL Configuration**
2. En **Site URL** pon tu URL de Vercel: `https://skillrise.vercel.app`
3. En **Redirect URLs** agrega: `https://skillrise.vercel.app/**`

### 5. Obtener API Key de Anthropic (opcional pero recomendado)

1. Ve a **console.anthropic.com**
2. Crea una cuenta → API Keys → Create Key
3. Copia la key y agrégala en Vercel como `ANTHROPIC_API_KEY`

> Si no tienes API Key, el sistema igual funciona — genera skills básicas a partir de las etiquetas del curso.

---

## Estructura del proyecto

```
skillrise/
├── app/
│   ├── page.js                    # Landing page
│   ├── layout.js                  # Layout raíz
│   ├── globals.css                # Estilos globales
│   ├── login/page.js              # Login y registro
│   ├── dashboard/page.js          # Inicio del usuario
│   ├── courses/
│   │   ├── page.js                # Catálogo de cursos
│   │   ├── new/page.js            # Crear curso
│   │   └── [id]/page.js          # Ver curso + lecciones
│   ├── profile/[username]/page.js # Perfil público
│   ├── explore/page.js            # Buscar usuarios
│   └── api/generate-skills/route.js # Motor de habilidades IA
├── components/
│   ├── Navbar.js                  # Navegación
│   ├── CourseCard.js              # Tarjeta de curso
│   └── SkillBadge.js             # Badge de habilidad
├── lib/
│   ├── supabase.js                # Cliente browser
│   └── supabase-server.js        # Cliente servidor
├── middleware.js                  # Protección de rutas
├── SUPABASE_SETUP.sql            # SQL completo para Supabase
└── .env.local.example            # Variables de entorno
```

---

## Flujo del motor de habilidades

1. Usuario completa todas las lecciones de un curso
2. La función `markComplete()` detecta el 100% de progreso
3. Llama a `/api/generate-skills` con título, descripción y nombres de lecciones
4. La API de Claude analiza el contenido y devuelve habilidades categorizadas
5. Las skills se guardan en `user_skills` y aparecen en el perfil automáticamente

---

## Errores del intento anterior — resueltos

| Problema anterior | Solución implementada |
|---|---|
| Dependencia de company_id | Cada registro usa `auth.uid()` como owner |
| Usuarios nuevos sin acceso | Trigger SQL crea perfil automáticamente al registrarse |
| Fallos de sesión | Supabase SSR maneja cookies automáticamente |
| Sin logout | Navbar siempre visible con botón de cierre de sesión |
| Datos falsos | Sin seeds — todo parte de cero limpio |
