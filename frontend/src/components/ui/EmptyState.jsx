import React from 'react'

const isComponentType = (v) =>
  typeof v === 'function' ||
  (typeof v === 'object' && v !== null && '$$typeof' in v && !React.isValidElement(v))

export default function EmptyState({ icon, title, description, action, message }) {
  const displayTitle = title || message
  const isElement = React.isValidElement(icon)
  const isComponent = isComponentType(icon)

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#EAF4FF] flex items-center justify-center mb-4 text-[#1266D6]">
          {isElement
            ? icon
            : isComponent
              ? React.createElement(icon, { size: 32, className: 'text-[#1266D6]', strokeWidth: 1.5 })
              : null}
        </div>
      )}
      {displayTitle && <h3 className="text-lg font-semibold text-[#06245B] mb-2">{displayTitle}</h3>}
      {description && <p className="text-sm text-[#64748B] max-w-md mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}