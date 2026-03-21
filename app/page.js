import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-brand-600 text-lg">SkillRise</span>
          <div className="flex gap-2">
            <Link href="/login" className="btn-secondary">Entrar</Link>
            <Link href="/login?mode=signup" className="btn-primary">Empezar gratis</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
          Plataforma de capacitación
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
          Aprende. Crece.<br />
          <span className="text-brand-600">Demuestra tus habilidades.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Completa cursos y genera automáticamente un perfil profesional
          con las habilidades que realmente dominas.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/login?mode=signup" className="btn-primary px-6 py-3 text-base">
            Crear cuenta gratis
          </Link>
          <Link href="/courses" className="btn-secondary px-6 py-3 text-base">
            Ver cursos
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Aprende a tu ritmo', desc: 'Cursos con video, texto y archivos. Progreso guardado automáticamente.', icon: '📚' },
            { title: 'Skills automáticas', desc: 'Al completar un curso, la IA analiza lo que aprendiste y genera tus habilidades.', icon: '⚡' },
            { title: 'Perfil profesional', desc: 'Tu historial de cursos y habilidades en un perfil público que puedes compartir.', icon: '🎯' },
          ].map(f => (
            <div key={f.title} className="card p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
