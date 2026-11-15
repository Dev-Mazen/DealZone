export const GOVERNORATES = [
  { value: 'Cairo', ar: 'القاهرة', en: 'Cairo' },
  { value: 'Giza', ar: 'الجيزة', en: 'Giza' },
  { value: 'Alexandria', ar: 'الإسكندرية', en: 'Alexandria' },
  { value: 'Qalyubia', ar: 'القليوبية', en: 'Qalyubia' },
  { value: 'Port Said', ar: 'بورسعيد', en: 'Port Said' },
  { value: 'Suez', ar: 'السويس', en: 'Suez' },
  { value: 'Damietta', ar: 'دمياط', en: 'Damietta' },
  { value: 'Dakahlia', ar: 'الدقهلية', en: 'Dakahlia' },
  { value: 'Sharqia', ar: 'الشرقية', en: 'Sharqia' },
  { value: 'Gharbia', ar: 'الغربية', en: 'Gharbia' },
  { value: 'Monufia', ar: 'المنوفية', en: 'Monufia' },
  { value: 'Kafr el-Sheikh', ar: 'كفر الشيخ', en: 'Kafr el-Sheikh' },
  { value: 'Beheira', ar: 'البحيرة', en: 'Beheira' },
  { value: 'Ismailia', ar: 'الإسماعيلية', en: 'Ismailia' },
  { value: 'Beni Suef', ar: 'بني سويف', en: 'Beni Suef' },
  { value: 'Fayoum', ar: 'الفيوم', en: 'Fayoum' },
  { value: 'Minya', ar: 'المنيا', en: 'Minya' },
  { value: 'Asyut', ar: 'أسيوط', en: 'Asyut' },
  { value: 'Sohag', ar: 'سوهاج', en: 'Sohag' },
  { value: 'Qena', ar: 'قنا', en: 'Qena' },
  { value: 'Luxor', ar: 'الأقصر', en: 'Luxor' },
  { value: 'Aswan', ar: 'أسوان', en: 'Aswan' },
  { value: 'Red Sea', ar: 'البحر الأحمر', en: 'Red Sea' },
  { value: 'New Valley', ar: 'الوادي الجديد', en: 'New Valley' },
  { value: 'Matruh', ar: 'مطروح', en: 'Matruh' },
  { value: 'North Sinai', ar: 'شمال سيناء', en: 'North Sinai' },
  { value: 'South Sinai', ar: 'جنوب سيناء', en: 'South Sinai' },
]

const clean = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^a-z\u0600-\u06ff]/g, '')

/** يحوّل أي قيمة (عربي/إنجليزي/اختلافات كتابة) للقيمة المخزنة، أو '' لو مش معروفة */
export function normalizeGovernorate(raw) {
  const c = clean(raw)
  if (!c) return ''
  const g = GOVERNORATES.find((x) => clean(x.value) === c || clean(x.ar) === c || clean(x.en) === c)
  return g ? g.value : ''
}

export const governorateLabel = (value, isAr) => {
  const g = GOVERNORATES.find((x) => x.value === normalizeGovernorate(value))
  return g ? (isAr ? g.ar : g.en) : value || ''
}

export const governorateOptions = (isAr) =>
  GOVERNORATES.map((g) => ({ value: g.value, label: isAr ? g.ar : g.en })).sort((a, b) =>
    a.label.localeCompare(b.label, isAr ? 'ar' : 'en')
  )

export const getGovernorateOptions = governorateOptions
