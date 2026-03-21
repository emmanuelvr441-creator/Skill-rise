import Link from 'next/link'

export default function CourseCard({ course, progress }) {
  return (
    <Link href={`/courses/${course.id}`}
      className="card p-4 hover:shadow-md transition-shadow block group">
      <div className="aspect-video bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg mb-3 flex items-center justify-center">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover rounded-lg" />
          : <span className="text-white text-2xl font-bold opacity-30">{course.title[0]}</span>
        }
      </div>
      <h3 className="font-medium text-gray-900 group-hover:text-brand-600 transition-colors text-sm leading-snug mb-1">
        {course.title}
      </h3>
      {course.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{course.description}</p>
      )}
      {course.skill_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {course.skill_tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
      {typeof progress === 'number' && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progreso</span><span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </Link>
  )
}
