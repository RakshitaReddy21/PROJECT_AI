import React, { ReactNode } from 'react';
import { motion } from './motion';

export interface HoverCardProps {
  children: ReactNode;
  className?: string;
  yOffset?: number;
  scale?: number;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  className = '',
  yOffset = -8,
  scale = 1.015,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: yOffset, scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      className={`cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
