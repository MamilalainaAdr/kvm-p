import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({ 
  type = 'text', 
  className = '', 
  error,
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="relative">
      <input
        type={inputType}
        className={[
          'w-full p-3 border rounded-lg outline-none transition-all',
          'focus:ring-2 focus:ring-accent border-muted',
          error && 'border-error focus:ring-error',
          isPassword && 'pr-10',
          className
        ].join(' ')}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
};