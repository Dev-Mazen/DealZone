import { Minus, Plus } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'

/** يحوّل الأرقام العربية/الفارسية وفواصل الآلاف لصيغة قياسية */
export function normalizeDigits(input) {
    return String(input ?? '')
        .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
        .replace(/٫/g, '.')
        .replace(/[٬,\s]/g, '')
}

const inputBase = (invalid) =>
    `w-full h-10 px-3 rounded-xl border text-sm bg-white outline-none transition-colors focus:ring-2 disabled:bg-slate-50 disabled:opacity-70 ${invalid
        ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
        : 'border-slate-300 focus:border-[#1266D6] focus:ring-[#1266D6]/15'
    }`

export function FormField({ id, label, required = false, optional = false, error, helper, children }) {
    const { language } = useTranslation()
    const isAr = language === 'ar'
    return (
        <div>
            {label && (
                <label htmlFor={id} className="block text-xs font-bold text-[#06245B] mb-1">
                    {label}
                    {required && (
                        <span className="text-red-500 ms-0.5" aria-hidden="true">*</span>
                    )}
                    {optional && !required && (
                        <span className="ms-1 font-normal text-slate-400">{isAr ? '(اختياري)' : '(optional)'}</span>
                    )}
                </label>
            )}
            {children}
            {error ? (
                <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>
            ) : helper ? (
                <p id={`${id}-help`} className="mt-1 text-xs text-slate-400">{helper}</p>
            ) : null}
        </div>
    )
}

export function TextField({ invalid = false, className = '', ...props }) {
    return (
        <input
            {...props}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
            className={`${inputBase(invalid)} ${className}`}
        />
    )
}

export function TextArea({ invalid = false, className = '', rows = 3, ...props }) {
    return (
        <textarea
            {...props}
            rows={rows}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
            className={`${inputBase(invalid).replace('h-10', 'min-h-[5rem]').replace('px-3', 'px-3 py-2')} resize-y ${className}`}
        />
    )
}

export function SelectField({ invalid = false, options = [], placeholder, className = '', ...props }) {
    return (
        <select
            {...props}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
            className={`${inputBase(invalid)} ${className}`}
        >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    )
}

/**
 * حقل رقم بدون أسهم المتصفح (اللي بتنقص 0.1):
 * - الخطوة (step) محددة لكل حقل، وأزرار +/- بتحترمها
 * - قبول الأرقام العربية، ومنع أي حروف، وتحديد عدد الخانات العشرية
 * - value و onChange بتتعامل كـ string
 */
export function NumberField({
    id,
    value,
    onChange,
    onBlur,
    min = 0,
    max,
    step = 1,
    decimals = 0,
    suffix,
    invalid = false,
    disabled = false,
    placeholder,
    showStepper = true,
}) {
    const { language } = useTranslation()
    const isAr = language === 'ar'
    const str = value === null || value === undefined ? '' : String(value)
    const num = str === '' || Number.isNaN(Number(str)) ? null : Number(str)

    const clamp = (n) => {
        let v = n
        if (min != null) v = Math.max(min, v)
        if (max != null) v = Math.min(max, v)
        return Number(v.toFixed(decimals))
    }

    const sanitize = (raw) => {
        const s = normalizeDigits(raw).replace(/[^0-9.]/g, '')
        const dot = s.indexOf('.')
        if (dot === -1) return s
        if (decimals === 0) return s.slice(0, dot)
        const intPart = s.slice(0, dot)
        const frac = s.slice(dot + 1).replace(/\./g, '').slice(0, decimals)
        return `${intPart}.${frac}`
    }

    const stepBy = (dir) => {
        if (disabled) return
        const next =
            num === null
                ? clamp(dir > 0 ? Math.max(min ?? 0, step) : min ?? 0)
                : clamp(num + dir * step)
        onChange(String(next))
    }

    const handleBlur = () => {
        // تنظيف الشكل فقط (007 -> 7 ، 5. -> 5)؛ التحقق من الحدود بيظهر كرسالة خطأ
        if (str !== '') onChange(num === null ? '' : String(num))
        onBlur?.()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); stepBy(1) }
        if (e.key === 'ArrowDown') { e.preventDefault(); stepBy(-1) }
    }

    const preview =
        num !== null && Math.abs(num) >= 1000
            ? new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', { maximumFractionDigits: decimals }).format(num)
            : null

    const stepBtn =
        'h-full w-9 shrink-0 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#06245B] disabled:opacity-40 disabled:hover:bg-transparent'

    return (
        <div
            dir="ltr"
            className={`flex items-center h-10 rounded-xl border bg-white overflow-hidden transition-colors focus-within:ring-2 ${invalid
                    ? 'border-red-400 focus-within:ring-red-200'
                    : 'border-slate-300 focus-within:border-[#1266D6] focus-within:ring-[#1266D6]/15'
                } ${disabled ? 'bg-slate-50 opacity-70' : ''}`}
        >
            {showStepper && (
                <button
                    type="button"
                    tabIndex={-1}
                    className={`${stepBtn} border-e border-slate-200`}
                    onClick={() => stepBy(-1)}
                    disabled={disabled || (num !== null && min != null && num <= min)}
                    aria-label={isAr ? 'تقليل' : 'Decrease'}
                >
                    <Minus size={14} />
                </button>
            )}
            <input
                id={id}
                type="text"
                inputMode={decimals > 0 ? 'decimal' : 'numeric'}
                autoComplete="off"
                value={str}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(e) => onChange(sanitize(e.target.value))}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid && id ? `${id}-error` : undefined}
                className="flex-1 min-w-0 h-full px-3 bg-transparent text-sm text-center outline-none"
            />
            {preview && (
                <span className="text-[11px] text-slate-400 px-1 whitespace-nowrap">{preview}</span>
            )}
            {suffix && <span className="text-xs text-slate-500 px-2 whitespace-nowrap">{suffix}</span>}
            {showStepper && (
                <button
                    type="button"
                    tabIndex={-1}
                    className={`${stepBtn} border-s border-slate-200`}
                    onClick={() => stepBy(1)}
                    disabled={disabled || (num !== null && max != null && num >= max)}
                    aria-label={isAr ? 'زيادة' : 'Increase'}
                >
                    <Plus size={14} />
                </button>
            )}
        </div>
    )
}