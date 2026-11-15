const pad = (n) => String(n).padStart(2, '0')

/** yyyy-MM-dd بالتوقيت المحلي */
export const toDateInputValue = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const addDays = (n, from = new Date()) => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  d.setDate(d.getDate() + n)
  return d
}

/** نهاية اليوم المحلي (23:59) كـ ISO، عشان "تاريخ الإغلاق" يعني نهاية اليوم المختار */
export const endOfLocalDayIso = (dateStr) => {
  if (!dateStr) return undefined
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 0).toISOString()
}