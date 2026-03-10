import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, HTMLMotionProps } from 'motion/react';

interface PremiumCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export default function PremiumCard({ children, className = '', dark = false, ...props }: PremiumCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;
    
    mouseX.set(mX);
    mouseY.set(mY);
    
    const xPct = mX / width - 0.5;
    const yPct = mY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const spotlightColor = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.04)';

  return (
    <motion.div
      style={{ perspective: 1000, ...props.style }}
      {...props}
      className={`h-full w-full ${props.className || ''}`}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`group relative h-full w-full rounded-2xl transition-all duration-300 ease-out ${className}`}
      >
        {/* Animated Black Glow Border using Mask */}
        <div 
          className="absolute -inset-[3px] z-[-1] rounded-[inherit] opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ 
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
            <div className="absolute top-1/2 left-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(transparent_0%,rgba(0,0,0,0.5)_15%,transparent_30%,rgba(0,0,0,0.5)_65%,transparent_80%)] animate-[spin_3s_linear_infinite_reverse] blur-[1px]" />
          </div>
        </div>

        {/* Spotlight Effect */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
          style={{
            background: useMotionTemplate`radial-gradient(600px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 40%)`
          }}
        />
        
        {/* Content Wrapper with 3D translation */}
        <div 
          style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} 
          className="h-full w-full relative z-10"
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
