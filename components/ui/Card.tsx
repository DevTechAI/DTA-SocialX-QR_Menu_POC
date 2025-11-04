import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'gradient';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', hover = false, className = '', ...props }, ref) => {
    const baseStyles = 'rounded-3xl p-6 transition-all duration-300';
    
    const variants = {
      default: 'bg-white shadow-soft',
      elevated: 'bg-white shadow-soft-lg',
      gradient: 'gradient-soft shadow-soft',
    };
    
    const hoverStyles = hover ? 'hover:shadow-card-hover hover:scale-[1.02] cursor-pointer' : '';
    
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
