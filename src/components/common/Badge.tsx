import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'emerald' | 'amber' | 'red' | 'cyan';
  size?: 'sm' | 'xs';
  mono?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'xs',
  mono = true,
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-[#18181C] text-[#A1A1AA] border-[#27272A]',
    emerald: 'bg-[#062016] text-[#10B981] border-[#0A3D28]',
    amber: 'bg-[#221805] text-[#F59E0B] border-[#422D0A]',
    red: 'bg-[#260B0B] text-[#EF4444] border-[#4A1616]',
    cyan: 'bg-[#061C24] text-[#06B6D4] border-[#0A3644]',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 tracking-wider',
    sm: 'text-[11px] px-2 py-0.5 tracking-normal',
  };

  return (
    <span
      className={`inline-flex items-center uppercase font-medium border rounded-[3px] ${mono ? 'font-mono' : ''} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
