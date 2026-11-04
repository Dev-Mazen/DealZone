import { forwardRef } from 'react';

const variantStyles = {
  success: 'dz-badge-success',
  warning: 'dz-badge-warning',
  error:   'dz-badge-error',
  info:    'dz-badge-info',
  neutral: 'dz-badge-neutral',
  brand:   'dz-badge-brand',
};

const Badge = forwardRef(({
  variant = 'neutral',
  size = 'md',
  dot = true,
  children,
  className = '',
  style: styleProp,
  ...rest
}, ref) => (
  <span
    ref={ref}
    className={`dz-badge ${variantStyles[variant] || variantStyles.neutral}${className ? ` ${className}` : ''}`}
    style={{
      fontSize: size === 'sm' ? '11px' : size === 'lg' ? '13px' : undefined,
      padding:  size === 'sm' ? '1px 8px' : size === 'lg' ? '4px 14px' : undefined,
      ...styleProp,
    }}
    data-no-dot={!dot ? '' : undefined}
    {...rest}
  >
    {children}
  </span>
));

Badge.displayName = 'Badge';
export { Badge };
export default Badge;
