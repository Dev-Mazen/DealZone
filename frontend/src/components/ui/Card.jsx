import { forwardRef } from 'react';

const paddingMap = { none: '0', sm: '16px', md: '24px', lg: '32px' };

const Card = forwardRef(({
  children,
  className = '',
  padding = 'md',
  hoverable = false,
  as: Tag = 'div',
  ...rest
}, ref) => (
  <Tag
    ref={ref}
    className={`dz-card animate-fade-in${className ? ` ${className}` : ''}`}
    style={{
      padding: paddingMap[padding] ?? paddingMap.md,
      cursor: hoverable ? 'pointer' : undefined,
    }}
    {...rest}
  >
    {children}
  </Tag>
));
Card.displayName = 'Card';

const CardHeader = ({ children, className = '', ...rest }) => (
  <div
    className={className}
    style={{
      marginBottom: '16px',
      paddingBottom: '16px',
      borderBottom: '1px solid var(--border)',
    }}
    {...rest}
  >
    {children}
  </div>
);
CardHeader.displayName = 'CardHeader';

const CardBody = ({ children, className = '', ...rest }) => (
  <div className={className} {...rest}>
    {children}
  </div>
);
CardBody.displayName = 'CardBody';

const CardFooter = ({ children, className = '', ...rest }) => (
  <div
    className={className}
    style={{
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '8px',
    }}
    {...rest}
  >
    {children}
  </div>
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
