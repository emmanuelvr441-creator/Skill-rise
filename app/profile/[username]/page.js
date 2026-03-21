'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import SkillBadge from '@/components/SkillBadge'
import CourseCard from '@/components/CourseCard'
import Link from 'next/link'

const CATEGORY_LABELS = {
  tecnologia: 'Tecnología',
  atencion_al_cliente: 'Atención al cliente',
  industria_alimentaria: 'Industria alimentaria',
  seguridad_e_higiene: 'Seguridad e higiene',
  general: 'General',
}

export default function ProfilePage() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [completedCourses, setCompletedCourses] = useState([])
  const [isOwner, setIsOwner] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ display_name: '', bio: '' })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof, error } = await supabase
        .from('profiles').select('*').eq('username', username).single()

      if (error || !prof) { setNotFound(true); return }

      setProfile(prof)
      setForm({ display_name: prof.display_name ?? '', bio: prof.bio ?? '' })
      setIsOwner(user?.id === prof.id)

      const [{ data: userSkills }, { data: enroll }] = await Promise.all([
        supabase.from('user_skills').select('*').eq('user_id', prof.id),
        supabase.from('enrollments').select('*, courses(*)')
          .eq('user_id', prof.id).eq('progress_pct', 100),
      ])

      setSkills(userSkills ?? [])
      setCompletedCourses(enroll ?? [])
    }
    load()
  }, [username])

  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({
      display_name: form.display_name,
      bio: form.bio,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setProfile(p => ({ ...p, ...form }))
    setEditMode(false)
  }

  if (notFound) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <p className="text-6xl mb-4">404</p>
        <p className="text-lg mb-6">Perfil no encontrado</p>
        <Link href="/explore" className="btn-primary">Explorar usuarios</Link>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  const skillsByCategory = skills.reduce((acc, s) => {
    const cat = s.category ?? 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold flex-shrink-0">
                {profile.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div>
                {editMode ? (
                  <input className="input text-lg font-bold mb-1" value={form.display_name}
                    onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} />
                ) : (
                  <h1 className="text-xl font-bold text-gray-900">{profile.display_name}</h1>
                )}
                <p className="text-sm text-gray-400">@{profile.username}</p>
              </div>
            </div>
            {isOwner && (
              editMode ? (
                <div className="flex gap-2">
                  <button onClick={saveProfile} className="btn-primary">Guardar</button>
                  <button onClick={() => setEditMode(false)} className="btn-secondary">Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setEditMode(true)} className="btn-secondary">Editar perfil</button>
              )
            )}
          </div>

          {editMode ? (
            <textarea className="input mt-4 h-20 resize-none" placeholder="Tu bio..."
              value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          ) : profile.bio ? (
            <p className="text-gray-600 text-sm mt-4 leading-relaxed">{profile.bio}</p>
          ) : isOwner ? (
            <p className="text-gray-400 text-sm mt-4 italic">Agrega una bio para que otros te conozcan.</p>
          ) : null}

          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="font-bold text-gray-900">{completedCourses.length}</p>
              <p className="text-xs text-gray-500">Cursos</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">{skills.length}</p>
              <p className="text-xs text-gray-500">Habilidades</p>
            </div>
          </div>
        </div>

        {/* Skills por categoría */}
        {skills.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Habilidades</h2>
            <div className="space-y-4">
              {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                <div key={cat}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {catSkills.map(s => <SkillBadge key={s.id} skill={s} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cursos completados */}
        {completedCourses.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Cursos completados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {completedCourses.map(e => (
                <CourseCard key={e.id} course={e.courses} progress={100} />
              ))}
            </div>
          </div>
        )}

        {skills.length === 0 && completedCourses.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-gray-400 mb-4">
              {isOwner ? 'Completa tu primer curso para ver tus habilidades aquí.' : 'Este usuario aún no ha completado cursos.'}
            </p>
            {isOwner && <Link href="/courses" className="btn-primary">Explorar cursos</Link>}
          </div>
        )}
      </div>
    </div>
  )
}
