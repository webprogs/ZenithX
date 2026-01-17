import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-700 text-gray-300',
      success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
      warning: 'bg-amber-900/50 text-amber-400 border border-amber-800',
      danger: 'bg-red-900/50 text-red-400 border border-red-800',
      info: 'bg-cyan-900/50 text-cyan-400 border border-cyan-800',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
