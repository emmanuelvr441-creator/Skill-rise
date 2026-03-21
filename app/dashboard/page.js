'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import CourseCard from '@/components/CourseCard'
import SkillBadge from '@/components/SkillBadge'
import Link from 'next/link'

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [skills, setSkills] = useState([])
  const [recentCourses, setRecentCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: enroll }, { data: userSkills }, { data: courses }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('enrollments').select('*, courses(*)').eq('user_id', user.id).order('enrolled_at', { ascending: false }).limit(6),
        supabase.from('user_skills').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('courses').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(4),
      ])

      setProfile(prof)
      setEnrollments(enroll ?? [])
      setSkills(userSkills ?? [])
      setRecentCourses(courses ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  const inProgress = enrollments.filter(e => e.progress_pct < 100 && e.progress_pct > 0)
  const completed = enrollments.filter(e => e.progress_pct === 100)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Saludo */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {profile?.display_name?.split(' ')[0] ?? 'usuario'} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {completed.length} curso{completed.length !== 1 ? 's' : ''} completado{completed.length !== 1 ? 's' : ''} · {skills.length} habilidades adquiridas
            </p>
          </div>
          <Link href={`/profile/${profile?.username}`} className="btn-secondary hidden md:flex">
            Ver mi perfil
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">

            {/* En progreso */}
            {inProgress.length > 0 && (
              <section>
                <h2 className="font-semibold text-gray-900 mb-3">Continúa aprendiendo</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inProgress.map(e => (
                    <CourseCard key={e.id} course={e.courses} progress={e.progress_pct} />
                  ))}
                </div>
              </section>
            )}

            {/* Descubrir cursos */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Descubrir cursos</h2>
                <Link href="/courses" className="text-sm text-brand-600 hover:underline">Ver todos</Link>
              </div>
              {recentCourses.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-gray-500 text-sm mb-3">Aún no hay cursos disponibles.</p>
                  <Link href="/courses/new" className="btn-primary">Crea el primero</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentCourses.map(c => <CourseCard key={c.id} course={c} />)}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* Skills */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Mis habilidades</h2>
              {skills.length === 0 ? (
                <p className="text-sm text-gray-400">Completa un curso para generar tus habilidades automáticamente.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => <SkillBadge key={s.id} skill={s} />)}
                </div>
              )}
            </div>

            {/* Cursos completados */}
            {completed.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Completados</h2>
                <div className="space-y-2">
                  {completed.slice(0, 4).map(e => (
                    <Link key={e.id} href={`/courses/${e.courses.id}`}
                      className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 transition-colors">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                      <span className="truncate">{e.courses.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA crear curso */}
            <div className="card p-5 bg-brand-50 border-brand-100">
              <h3 className="font-semibold text-brand-800 mb-1">¿Sabes algo valioso?</h3>
              <p className="text-xs text-brand-600 mb-3">Crea un curso y comparte tu conocimiento.</p>
              <Link href="/courses/new" className="btn-primary w-full text-center block">
                Crear curso
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
