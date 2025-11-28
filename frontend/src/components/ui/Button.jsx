import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary hover:bg-primaryDark text-white',
  secondary: 'bg-accent hover:bg-blue-600 text-white',
  warning: 'bg-warning hover:bg-yellow-600 text-white',
  danger: 'bg-error hover:bg-red-700 text-white',
  success: 'bg-success hover:bg-green-600 text-white',
  outline: 'bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'bg-transparent text-text hover:bg-background',
  gray: 'bg-background hover:bg-muted',
};

const sizes = {
  sm: 'px-2 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled,
  className = '',
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
        'focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:scale-105 active:scale-95',
        variants[variant], // ✅ Correspond exactement aux clés définies
        sizes[size],
        className
      ].join(' ')}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
});