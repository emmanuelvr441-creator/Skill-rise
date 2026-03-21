'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('username,display_name,avatar_url')
          .eq('id', user.id).single()
          .then(({ data }) => setProfile(data))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const links = [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/courses', label: 'Cursos' },
    { href: '/explore', label: 'Explorar' },
  ]

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={user ? '/dashboard' : '/'} className="font-bold text-brand-600 text-lg tracking-tight">
          SkillRise
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname.startsWith(l.href)
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span className="text-sm text-gray-700 hidden md:block">
                  {profile?.display_name ?? 'Mi perfil'}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                  <Link href={`/profile/${profile?.username}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}>
                    Mi perfil
                  </Link>
                  <Link href="/courses/new"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}>
                    Crear curso
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-secondary">Entrar</Link>
              <Link href="/login?mode=signup" className="btn-primary">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
