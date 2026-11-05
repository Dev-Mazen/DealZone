export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#EAF4FF] flex items-center justify-center mb-4">
          <Icon size={32} className="text-[#1266D6]" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#06245B] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#64748B] max-w-md mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}

