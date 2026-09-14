import React, { ReactNode } from 'react';
import { motion } from './motion';

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
