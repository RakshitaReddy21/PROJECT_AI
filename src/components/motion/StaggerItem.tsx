import React, { ReactNode } from 'react';
import { motion } from './motion';

export interface StaggerItemProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  delay = 0,
  duration = 0.4,
  yOffset = 16,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
