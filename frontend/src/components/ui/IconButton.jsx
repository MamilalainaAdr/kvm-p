import { forwardRef } from 'react';

export const IconButton = forwardRef(({ 
  icon: Icon, 
  variant = 'primary',
  size = 'md',
  className = '',
  ...props 
}, ref) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const variants = {
    primary: 'bg-primary text-white hover:bg-primaryDark',
    secondary: 'bg-accent text-white hover:bg-blue-600',
    danger: 'bg-error text-white hover:bg-red-700',
    ghost: 'bg-transparent text-text hover:bg-background',
    outline: 'bg-white border border-primary text-primary hover:bg-primary hover:text-white',
  };

  return (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center rounded-lg transition-all',
        'focus:ring-2 focus:ring-offset-2 focus:ring-accent',
        sizes[size],
        variants[variant],
        className
      ].join(' ')}
      {...props}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
});