import React, { ReactNode, Children, isValidElement, cloneElement } from 'react';

export interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  baseDelay?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.08,
  baseDelay = 0.05,
  className = '',
}) => {
  let childIndex = 0;

  const childrenWithDelays = Children.map(children, (child) => {
    if (isValidElement(child)) {
      const index = childIndex++;
      return cloneElement(child as React.ReactElement<any>, {
        delay: (child.props.delay ?? 0) + baseDelay + index * staggerDelay,
      });
    }
    return child;
  });

  return <div className={className}>{childrenWithDelays}</div>;
};
