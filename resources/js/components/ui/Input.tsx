import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[#474d57] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={clsx(
            'w-full px-4 py-2 bg-white border rounded-lg text-[#1e2329] placeholder-[#b7b9bc]',
            'focus:outline-none focus:ring-2 focus:ring-[#f0b90b] focus:border-transparent',
            'transition-colors',
            error ? 'border-[#cf304a]' : 'border-[#eaecef]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-[#cf304a]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
