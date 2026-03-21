'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import SkillBadge from '@/components/SkillBadge'

function getYouTubeId(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
  return match ? match[1] : null
}

export default function CourseDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [completedIds, setCompletedIds] = useState(new Set())
  const [activeLesson, setActiveLesson] = useState(0)
  const [skills, setSkills] = useState([])
  const [newSkills, setNewSkills] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingSkills, setGeneratingSkills] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const [{ data: c }, { data: ls }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', id).single(),
        supabase.from('lessons').select('*').eq('course_id', id).order('order_index'),
      ])

      setCourse(c)
      setLessons(ls ?? [])

      if (user && c) {
        const [{ data: enroll }, { data: progress }] = await Promise.all([
          supabase.from('enrollments').select('*').eq('user_id', user.id).eq('course_id', id).maybeSingle(),
          supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id).eq('completed', true),
        ])
        setEnrollment(enroll)
        setCompletedIds(new Set((progress ?? []).map(p => p.lesson_id)))
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function enroll() {
    if (!user) { router.push('/login'); return }
    const { data } = await supabase.from('enrollments')
      .insert({ user_id: user.id, course_id: id, progress_pct: 0 })
      .select().single()
    setEnrollment(data)
  }

  async function markComplete(lessonId) {
    if (!enrollment) return
    await supabase.from('lesson_progress')
      .upsert({ user_id: user.id, lesson_id: lessonId, completed: true, done_at: new Date().toISOString() })
    const newSet = new Set([...completedIds, lessonId])
    setCompletedIds(newSet)

    const pct = Math.round((newSet.size / lessons.length) * 100)
    const updates = { progress_pct: pct }
    if (pct === 100) {
      updates.completed_at = new Date().toISOString()
      await supabase.from('enrollments').update(updates).eq('id', enrollment.id)
      setEnrollment(e => ({ ...e, ...updates }))
      await generateSkills()
    } else {
      await supabase.from('enrollments').update(updates).eq('id', enrollment.id)
      setEnrollment(e => ({ ...e, ...updates }))
    }
  }

  async function generateSkills() {
    setGeneratingSkills(true)
    try {
      const res = await fetch('/api/generate-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: id,
          courseTitle: course.title,
          courseDescription: course.description,
          lessonTitles: lessons.map(l => l.title),
          skillTags: course.skill_tags,
        }),
      })
      const { skills: generated } = await res.json()
      if (generated?.length) {
        for (const skill of generated) {
          await supabase.from('user_skills').upsert({
            user_id: user.id,
            skill_name: skill.skill_name,
            category: skill.category,
            level: skill.level,
            source_course_id: id,
          }, { onConflict: 'user_id,skill_name', ignoreDuplicates: false })
        }
        setNewSkills(generated)
      }
    } catch (e) {
      console.error('Error generando skills:', e)
    }
    setGeneratingSkills(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <p className="text-lg">Curso no encontrado</p>
      </div>
    </div>
  )

  const progress = enrollment ? enrollment.progress_pct : 0
  const currentLesson = lessons[activeLesson]
  const isCompleted = currentLesson && completedIds.has(currentLesson.id)
  const courseComplete = enrollment?.completed_at

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Header del curso */}
        <div className="card p-5 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h1>
              {course.description && <p className="text-sm text-gray-500">{course.description}</p>}
              {course.skill_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {course.skill_tags.map(t => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
            {!enrollment ? (
              <button onClick={enroll} className="btn-primary whitespace-nowrap">
                {user ? 'Inscribirse' : 'Entrar para inscribirse'}
              </button>
            ) : (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{progress}% completado</p>
                <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-1">
                  <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skills generadas al completar */}
        {courseComplete && newSkills.length > 0 && (
          <div className="card p-5 mb-5 border-green-100 bg-green-50">
            <h3 className="font-semibold text-green-800 mb-2">¡Curso completado! Habilidades generadas:</h3>
            <div className="flex flex-wrap gap-2">
              {newSkills.map((s, i) => <SkillBadge key={i} skill={s} />)}
            </div>
          </div>
        )}
        {generatingSkills && (
          <div className="card p-4 mb-5 flex items-center gap-3 border-brand-100 bg-brand-50">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-brand-700">Analizando el curso y generando tus habilidades...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Lista de lecciones */}
          <aside className="order-2 lg:order-1">
            <div className="card p-4">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">
                Contenido del curso ({lessons.length} lecciones)
              </h2>
              <div className="space-y-1">
                {lessons.map((lesson, idx) => (
                  <button key={lesson.id} onClick={() => setActiveLesson(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      idx === activeLesson ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50 text-gray-700'
                    }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      completedIds.has(lesson.id)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {completedIds.has(lesson.id) ? '✓' : idx + 1}
                    </span>
                    <span className="truncate">{lesson.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Visor de lección */}
          <main className="lg:col-span-2 order-1 lg:order-2">
            {currentLesson ? (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">{currentLesson.title}</h2>

                {currentLesson.content_type === 'video' && currentLesson.content_url && (
                  <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-black">
                    {getYouTubeId(currentLesson.content_url) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(currentLesson.content_url)}`}
                        className="w-full h-full" allowFullScreen />
                    ) : (
                      <video src={currentLesson.content_url} controls className="w-full h-full" />
                    )}
                  </div>
                )}

                {currentLesson.content_type === 'pdf' && currentLesson.content_url && (
                  <div className="mb-4">
                    <a href={currentLesson.content_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary inline-flex items-center gap-2">
                      Abrir PDF
                    </a>
                  </div>
                )}

                {currentLesson.content_type === 'file' && currentLesson.content_url && (
                  <div className="mb-4">
                    <a href={currentLesson.content_url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary inline-flex items-center gap-2">
                      Descargar archivo
                    </a>
                  </div>
                )}

                {currentLesson.content_body && (
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                    {currentLesson.content_body}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                  <div className="flex gap-2">
                    <button onClick={() => setActiveLesson(i => Math.max(0, i - 1))}
                      disabled={activeLesson === 0}
                      className="btn-secondary disabled:opacity-40">← Anterior</button>
                    <button onClick={() => setActiveLesson(i => Math.min(lessons.length - 1, i + 1))}
                      disabled={activeLesson === lessons.length - 1}
                      className="btn-secondary disabled:opacity-40">Siguiente →</button>
                  </div>

                  {enrollment && !isCompleted && (
                    <button onClick={() => markComplete(currentLesson.id)} className="btn-primary">
                      Marcar como completada ✓
                    </button>
                  )}
                  {isCompleted && (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-xs">✓</span>
                      Completada
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center text-gray-400">
                Selecciona una lección para comenzar
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
