import './globals.css'

export const metadata = {
  title: 'SkillRise — Aprende, crece, conecta',
  description: 'Plataforma de capacitación con perfil profesional basado en habilidades reales.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
