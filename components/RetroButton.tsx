import React from 'react';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'default';
  children: React.ReactNode;
}

export const RetroButton: React.FC<RetroButtonProps> = ({ 
  children, 
  variant = 'default', 
  className = '', 
  ...props 
}) => {
  const baseStyle = "font-pixel uppercase px-4 py-2 border-t-2 border-l-2 border-b-4 border-r-4 active:border-t-4 active:border-l-4 active:border-b-2 active:border-r-2 active:translate-y-1 transition-none";
  
  const variants = {
    default: "bg-[#c0c0c0] text-black border-t-white border-l-white border-b-black border-r-black active:bg-[#a0a0a0]",
    primary: "bg-[#000080] text-white border-t-[#4040ff] border-l-[#4040ff] border-b-black border-r-black active:bg-[#000060]",
    danger: "bg-[#800000] text-white border-t-[#ff4040] border-l-[#ff4040] border-b-black border-r-black active:bg-[#600000]"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};