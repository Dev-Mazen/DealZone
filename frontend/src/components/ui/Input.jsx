import { forwardRef, useState, useId } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  required,
  id: propId,
  className = '',
  type = 'text',
  ...rest
}, ref) => {
  const autoId = useId();
  const id = propId || autoId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasLeftIcon = !!LeftIcon;
  const hasRightIcon = !!RightIcon || isPassword;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            display: 'flex',
            gap: '4px',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--error)', lineHeight: 1 }}>*</span>
          )}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {LeftIcon && (
          <span
            style={{
              position: 'absolute',
              insetInlineStart: '12px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            <LeftIcon size={16} />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={inputType}
          className={`dz-input${error ? ' dz-input-error' : ''}${className ? ` ${className}` : ''}`}
          style={{
            paddingInlineStart: hasLeftIcon ? '40px' : undefined,
            paddingInlineEnd: hasRightIcon ? '40px' : undefined,
          }}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: 'absolute',
              insetInlineEnd: '12px',
              color: 'var(--text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              padding: '2px',
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : RightIcon ? (
          <span
            style={{
              position: 'absolute',
              insetInlineEnd: '12px',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              display: 'flex',
            }}
          >
            <RightIcon size={16} />
          </span>
        ) : null}
      </div>
      {error && (
        <span
          id={`${id}-error`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.8125rem',
            color: 'var(--error-text)',
          }}
        >
          <AlertCircle size={13} />
          {error}
        </span>
      )}
      {!error && hint && (
        <span
          id={`${id}-hint`}
          style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}
        >
          {hint}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export { Input };
export default Input;
