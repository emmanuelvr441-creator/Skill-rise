import { NextResponse } from 'next/server'

const SKILL_CATEGORIES = ['tecnologia', 'atencion_al_cliente', 'industria_alimentaria', 'seguridad_e_higiene', 'general']
const SKILL_LEVELS = ['basico', 'intermedio', 'avanzado']

export async function POST(request) {
  try {
    const { courseTitle, courseDescription, lessonTitles, skillTags } = await request.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ skills: fallbackSkills(courseTitle, skillTags) })
    }

    const prompt = `Analiza este curso de capacitación y extrae las habilidades que obtiene un estudiante al completarlo.

Curso: "${courseTitle}"
Descripción: "${courseDescription ?? 'No disponible'}"
Lecciones: ${lessonTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}
Tags del creador: ${skillTags?.join(', ') ?? 'ninguno'}

Devuelve ÚNICAMENTE un JSON array con las habilidades (máximo 6). Cada objeto debe tener:
- skill_name: nombre corto y claro de la habilidad (máximo 4 palabras)
- category: una de estas exactas: ${SKILL_CATEGORIES.join(', ')}
- level: una de estas exactas: ${SKILL_LEVELS.join(', ')}

Ejemplo de respuesta válida:
[{"skill_name":"Inocuidad alimentaria","category":"industria_alimentaria","level":"basico"},{"skill_name":"Manejo de BPM","category":"industria_alimentaria","level":"intermedio"}]

Responde SOLO con el JSON array, sin texto adicional.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? '[]'

    let skills = []
    try {
      const clean = text.replace(/```json|```/g, '').trim()
      skills = JSON.parse(clean)
      skills = skills.filter(s =>
        s.skill_name &&
        SKILL_CATEGORIES.includes(s.category) &&
        SKILL_LEVELS.includes(s.level)
      )
    } catch {
      skills = fallbackSkills(courseTitle, skillTags)
    }

    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Error en generate-skills:', error)
    return NextResponse.json({ skills: [] }, { status: 500 })
  }
}

function fallbackSkills(courseTitle, skillTags) {
  if (skillTags?.length > 0) {
    return skillTags.slice(0, 3).map(tag => ({
      skill_name: tag,
      category: 'general',
      level: 'basico',
    }))
  }
  return [{
    skill_name: courseTitle.slice(0, 30),
    category: 'general',
    level: 'basico',
  }]
}
