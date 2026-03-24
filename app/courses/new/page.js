'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const SKILL_CATEGORIES = [
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'atencion_al_cliente', label: 'Atención al cliente' },
  { value: 'industria_alimentaria', label: 'Industria alimentaria' },
  { value: 'seguridad_e_higiene', label: 'Seguridad e higiene' },
  { value: 'general', label: 'General' },
]

export default function NewCoursePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [course, setCourse] = useState({
    title: '', description: '', is_public: true, skill_tags: []
  })
  const [lessons, setLessons] = useState([
    { title: '', content_type: 'text', content_url: '', content_body: '', order_index: 0 }
  ])
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !course.skill_tags.includes(tag)) {
      setCourse(c => ({ ...c, skill_tags: [...c.skill_tags, tag] }))
    }
    setTagInput('')
  }

  function removeTag(tag) {
    setCourse(c => ({ ...c, skill_tags: c.skill_tags.filter(t => t !== tag) }))
  }

  function addLesson() {
    setLessons(ls => [...ls, {
      title: '', content_type: 'text', content_url: '', content_body: '', order_index: ls.length
    }])
  }

  function updateLesson(idx, field, value) {
    setLessons(ls => ls.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function removeLesson(idx) {
    setLessons(ls => ls.filter((_, i) => i !== idx).map((l, i) => ({ ...l, order_index: i })))
  }

  async function handleCreate() {
    if (!course.title.trim()) { setError('El título es obligatorio'); return }
    if (lessons.some(l => !l.title.trim())) { setError('Todas las lecciones necesitan título'); return }

    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()

    const { data: newCourse, error: courseErr } = await supabase
      .from('courses')
      .insert({
        creator_id: user.id,
        title: course.title.trim(),
        description: course.description.trim(),
        is_public: course.is_public,
        skill_tags: course.skill_tags,
      })
      .select().single()

    if (courseErr) { setError(courseErr.message); setLoading(false); return }

    const { error: lessonErr } = await supabase.from('lessons').insert(
      lessons.map((l, i) => ({
        course_id: newCourse.id,
        title: l.title.trim(),
        content_type: l.content_type,
        content_url: l.content_url.trim(),
        content_body: l.content_body.trim(),
        order_index: i,
      }))
    )

    if (lessonErr) { setError(lessonErr.message); setLoading(false); return }
    router.push(`/courses/${newCourse.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 text-sm">← Volver</button>
          <h1 className="text-xl font-bold text-gray-900">Crear curso</h1>
        </div>
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Información del curso</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input className="input" placeholder="Ej: Introducción a la inocuidad alimentaria"
                value={course.title} onChange={e => setCourse(c => ({ ...c, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea className="input h-24 resize-none" placeholder="¿Qué aprenderán los estudiantes?"
                value={course.description} onChange={e => setCourse(c => ({ ...c, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas de habilidades</label>
              <div className="flex gap-2 mb-2">
                <input className="input flex-1" placeholder="Ej: HACCP, BPM..."
                  value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <button onClick={addTag} className="btn-secondary">Agregar</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {course.skill_tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full text-xs">
                    {tag}
                    <button onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_public" checked={course.is_public}
                onChange={e => setCourse(c => ({ ...c, is_public: e.target.checked }))}
                className="w-4 h-4 accent-brand-600" />
              <label htmlFor="is_public" className="text-sm text-gray-700">Curso público</label>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Lecciones</h2>
              <button onClick={addLesson} className="btn-secondary text-xs">+ Agregar lección</button>
            </div>
            <div className="space-y-4">
              {lessons.map((lesson, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">Lección {idx + 1}</span>
                    {lessons.length > 1 && (
                      <button onClick={() => removeLesson(idx)} className="text-xs text-red-500">Eliminar</button>
                    )}
                  </div>
                  <input className="input" placeholder="Título de la lección *"
                    value={lesson.title} onChange={e => updateLesson(idx, 'title', e.target.value)} />
                  <select className="input" value={lesson.content_type}
                    onChange={e => updateLesson(idx, 'content_type', e.target.value)}>
                    <option value="text">Texto</option>
                    <option value="video">Video (YouTube)</option>
                    <option value="pdf">PDF (URL)</option>
                    <option value="file">Archivo (URL)</option>
                  </select>
                  {lesson.content_type === 'text' ? (
                    <textarea className="input h-28 resize-none" placeholder="Contenido..."
                      value={lesson.content_body} onChange={e => updateLesson(idx, 'content_body', e.target.value)} />
                  ) : (
                    <input className="input" placeholder="URL del contenido"
                      value={lesson.content_url} onChange={e => updateLesson(idx, 'content_url', e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button onClick={handleCreate} disabled={loading}
            className="w-full btn-primary py-3 text-base disabled:opacity-50">
            {loading ? 'Creando curso...' : 'Publicar curso'}
          </button>
        </div>
      </div>
    </div>
  )
}
