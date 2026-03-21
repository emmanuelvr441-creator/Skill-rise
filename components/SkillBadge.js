const CATEGORY_STYLES = {
  tecnologia:            'bg-blue-50 text-blue-700',
  atencion_al_cliente:   'bg-green-50 text-green-700',
  industria_alimentaria: 'bg-amber-50 text-amber-700',
  seguridad_e_higiene:   'bg-red-50 text-red-700',
  general:               'bg-gray-100 text-gray-700',
}

const LEVEL_DOTS = { basico: 1, intermedio: 2, avanzado: 3 }

export default function SkillBadge({ skill }) {
  const style = CATEGORY_STYLES[skill.category] ?? CATEGORY_STYLES.general
  const dots = LEVEL_DOTS[skill.level] ?? 1

  return (
    <span className={`skill-badge ${style}`}>
      {skill.skill_name}
      <span className="flex gap-0.5 ml-1">
        {[1,2,3].map(n => (
          <span key={n} className={`w-1 h-1 rounded-full ${n <= dots ? 'bg-current' : 'bg-current opacity-20'}`} />
        ))}
      </span>
    </span>
  )
}
