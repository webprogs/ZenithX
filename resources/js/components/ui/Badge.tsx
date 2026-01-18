import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#f5f5f5] text-[#707a8a] border border-[#eaecef]',
      success: 'bg-[#e6f7f0] text-[#03a66d] border border-[#03a66d]/20',
      warning: 'bg-[#fef6d8] text-[#c99400] border border-[#f0b90b]/20',
      danger: 'bg-[#fce8eb] text-[#cf304a] border border-[#cf304a]/20',
      info: 'bg-[#e6f4ff] text-[#0070f3] border border-[#0070f3]/20',
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
