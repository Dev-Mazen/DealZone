import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const sizeClasses = {
  sm: { padding: '6px 16px', fontSize: '0.8125rem', gap: '6px', iconSize: 14 },
  md: { padding: '10px 24px', fontSize: '0.9375rem', gap: '8px', iconSize: 16 },
  lg: { padding: '13px 32px', fontSize: '1.0625rem', gap: '10px', iconSize: 18 },
};

const variantClass = {
  primary:   'dz-btn-primary',
  secondary: 'dz-btn-secondary',
  ghost:     'dz-btn-ghost',
  danger:    'dz-btn-danger',
};

const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  as: Tag = 'button',
  className = '',
  children,
  ...rest
}, ref) => {
  const sz = sizeClasses[size] || sizeClasses.md;
  const isDisabled = disabled || loading;

  return (
    <Tag
      ref={ref}
      className={`${variantClass[variant] || variantClass.primary} ${className}`}
      disabled={Tag === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled}
      style={{
        padding: sz.padding,
        fontSize: sz.fontSize,
        gap: sz.gap,
        width: fullWidth ? '100%' : undefined,
        opacity: isDisabled && variant !== 'primary' ? 0.5 : undefined,
        pointerEvents: isDisabled ? 'none' : undefined,
        justifyContent: 'center',
      }}
      {...rest}
    >
      {loading ? (
        <Loader2 size={sz.iconSize} style={{ animation: 'spinCycle 0.8s linear infinite' }} />
      ) : LeftIcon ? (
        <LeftIcon size={sz.iconSize} />
      ) : null}
      {children}
      {!loading && RightIcon && <RightIcon size={sz.iconSize} />}
    </Tag>
  );
});

Button.displayName = 'Button';
export { Button };
export default Button;
