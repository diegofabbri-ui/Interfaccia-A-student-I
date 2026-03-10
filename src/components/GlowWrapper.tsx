import React from 'react';

interface GlowWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  opacity?: number;
  key?: React.Key;
}

export default function GlowWrapper({ children, className = '', opacity = 0.4, ...props }: GlowWrapperProps) {
  return (
    <div className={`group relative ${className}`} {...props}>
      {/* Animated Black Glow Border using Mask */}
      <div 
        className="absolute -inset-[3px] z-0 rounded-[inherit] transition-opacity duration-500 pointer-events-none"
        style={{ 
          opacity: opacity,
          padding: '3px', 
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', 
          WebkitMaskComposite: 'xor', 
          maskComposite: 'exclude' 
        }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          {/* Layer 1 */}
          <div className="absolute top-1/2 left-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(transparent_0%,black_25%,transparent_50%,black_75%,transparent_100%)] animate-[spin_4s_linear_infinite] blur-[2px]" />
          {/* Layer 2 */}
          <div className="absolute top-1/2 left-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(transparent_0%,rgba(0,0,0,0.6)_15%,transparent_30%,rgba(0,0,0,0.6)_65%,transparent_80%)] animate-[spin_3s_linear_infinite_reverse] blur-[1px]" />
        </div>
      </div>
      
      <div className="relative z-10 h-full w-full rounded-[inherit]">
        {children}
      </div>
    </div>
  );
}
