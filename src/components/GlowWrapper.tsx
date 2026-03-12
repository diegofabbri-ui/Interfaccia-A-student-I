import React from 'react';

interface GlowWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  opacity?: number;
  glowColor?: string; // Changed to string to support hex/tailwind colors
  key?: React.Key;
}

export default function GlowWrapper({ children, className = '', opacity = 0.4, glowColor = '#000000', alwaysOn = false, ...props }: GlowWrapperProps & { alwaysOn?: boolean }) {
  // Use the provided color in the conic-gradient
  const glowGradient = `conic-gradient(transparent_0%,${glowColor}_25%,transparent_50%,${glowColor}_75%,transparent_100%)`;
  const glowGradient2 = `conic-gradient(transparent_0%,${glowColor}_15%,transparent_30%,${glowColor}_65%,transparent_80%)`;

  return (
    <div className={`group relative ${className}`} {...props}>
      {/* Animated Glow Border using Mask */}
      <div 
        className={`absolute -inset-[3px] z-0 rounded-[inherit] transition-opacity duration-500 pointer-events-none ${alwaysOn ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}
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
          <div className="absolute top-1/2 left-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] blur-[2px]" style={{ background: glowGradient }} />
          {/* Layer 2 */}
          <div className="absolute top-1/2 left-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite_reverse] blur-[1px]" style={{ background: glowGradient2 }} />
        </div>
      </div>
      
      <div className="relative z-10 h-full w-full rounded-[inherit]">
        {children}
      </div>
    </div>
  );
}
