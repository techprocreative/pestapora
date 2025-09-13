import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface BrutalInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  error?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export const BrutalInput: React.FC<BrutalInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled = false,
  icon: Icon,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-black font-black text-sm uppercase tracking-tight">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon className="h-5 w-5 text-black" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_#000000]
            font-bold text-black bg-white uppercase tracking-tight
            focus:outline-none focus:shadow-[2px_2px_0px_#000000] focus:translate-x-[2px] focus:translate-y-[2px]
            focus:bg-[#F5F5F5] transition-all duration-100
            ${Icon ? 'pl-12' : ''}
            ${error ? 'border-[#FF0000] shadow-[4px_4px_0px_#FF0000]' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-200' : ''}
          `}
        />
      </div>
      {error && (
        <div className="bg-[#FF0000] text-white p-2 border-4 border-black shadow-[4px_4px_0px_#000000]">
          <p className="font-black text-xs uppercase">{error}</p>
        </div>
      )}
    </div>
  );
};