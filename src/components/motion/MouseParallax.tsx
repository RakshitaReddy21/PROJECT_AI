import React, { useState, ReactNode, MouseEvent } from 'react';

export interface MouseParallaxProps {
  children: ReactNode;
  maxOffset?: number; // Maximum offset in pixels (e.g. 5 to 10px)
  className?: string;
}

export const MouseParallax: React.FC<MouseParallaxProps> = ({
  children,
  maxOffset = 8,
  className = '',
}) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    const targetX = Math.max(-maxOffset, Math.min(maxOffset, deltaX * maxOffset));
    const targetY = Math.max(-maxOffset, Math.min(maxOffset, deltaY * maxOffset));

    setOffset({ x: targetX, y: targetY });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0px)`,
          transition: 'transform 0.15s ease-out',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
};
