'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import SkillBadge from '@/components/SkillBadge'
import Link from 'next/link'

export default function ExplorePage() {
  const [profiles, setProfiles] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('*, user_skills(*)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      setProfiles(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    return (
      p.display_name?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q) ||
      p.bio?.toLowerCase().includes(q) ||
      p.user_skills?.some(s => s.skill_name.toLowerCase().includes(q))
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Explorar</h1>
          <p className="text-gray-500 text-sm">Encuentra personas por nombre o habilidades</p>
        </div>

        <div className="mb-6">
          <input className="input max-w-md" placeholder="Buscar por nombre, username o habilidad..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {search ? `No se encontraron usuarios para "${search}"` : 'Aún no hay usuarios públicos.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(p => (
              <Link key={p.id} href={`/profile/${p.username}`}
                className="card p-4 hover:shadow-md transition-shadow block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                    {p.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.display_name}</p>
                    <p className="text-xs text-gray-400">@{p.username}</p>
                  </div>
                </div>
                {p.bio && <p className="text-xs text-gray-500 line-clamp-2 mb-2">{p.bio}</p>}
                {p.user_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.user_skills.slice(0, 4).map(s => <SkillBadge key={s.id} skill={s} />)}
                    {p.user_skills.length > 4 && (
                      <span className="text-xs text-gray-400 self-center">+{p.user_skills.length - 4} más</span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
