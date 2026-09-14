import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { motion } from './motion';

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 20,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: yOffset }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: yOffset }}
        transition={{ duration, delay, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {children}
      </motion.div>
    </div>
  );
};
