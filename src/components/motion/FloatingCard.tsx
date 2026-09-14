import React, { ReactNode } from 'react';
import { motion } from './motion';

export interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.3, delay, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
