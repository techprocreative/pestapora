import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface BrutalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export const BrutalButton: React.FC<BrutalButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon: Icon,
  className = '',
}) => {
  const baseClasses = 'font-black uppercase tracking-tight border-4 border-black transition-all duration-100 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-[#00FF00] text-black shadow-[6px_6px_0px_#000000] hover:bg-black hover:text-[#00FF00] hover:shadow-[3px_3px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]',
    secondary: 'bg-white text-black shadow-[6px_6px_0px_#000000] hover:bg-[#00FFFF] hover:shadow-[3px_3px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]',
    danger: 'bg-[#FF0000] text-white shadow-[6px_6px_0px_#000000] hover:bg-white hover:text-[#FF0000] hover:shadow-[3px_3px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]',
    success: 'bg-[#00FF00] text-black shadow-[6px_6px_0px_#000000] hover:bg-black hover:text-[#00FF00] hover:shadow-[3px_3px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]',
    warning: 'bg-[#FFD700] text-black shadow-[6px_6px_0px_#000000] hover:bg-black hover:text-[#FFD700] hover:shadow-[3px_3px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px]',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-lg',
  };

  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed hover:transform-none hover:shadow-[6px_6px_0px_#000000] bg-gray-300 text-gray-600' 
    : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
};