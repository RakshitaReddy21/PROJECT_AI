import React, { useEffect, useState, ReactNode } from 'react';

// Motion transition configuration
export interface MotionTransition {
  duration?: number;
  delay?: number;
  ease?: string;
  type?: 'spring' | 'tween';
  stiffness?: number;
  damping?: number;
}

export interface MotionStyleValues {
  opacity?: number;
  scale?: number;
  x?: number | string;
  y?: number | string;
  rotate?: number;
  backgroundColor?: string;
  borderColor?: string;
  [key: string]: any;
}

export interface MotionProps extends React.HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  className?: string;
  initial?: MotionStyleValues | boolean;
  animate?: MotionStyleValues;
  exit?: MotionStyleValues;
  whileHover?: MotionStyleValues;
  whileTap?: MotionStyleValues;
  transition?: MotionTransition;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<any>) => void;
  [key: string]: any;
}

// Convert motion values to inline CSS transform / opacity string styles
function formatMotionStyle(
  values: MotionStyleValues,
  hoverState: boolean = false,
  hoverValues?: MotionStyleValues,
  tapState: boolean = false,
  tapValues?: MotionStyleValues
): React.CSSProperties {
  const merged = { ...values };
  if (hoverState && hoverValues) {
    Object.assign(merged, hoverValues);
  }
  if (tapState && tapValues) {
    Object.assign(merged, tapValues);
  }

  const { opacity, scale, x, y, rotate, ...rest } = merged;
  const transformParts: string[] = [];

  if (scale !== undefined) transformParts.push(`scale(${scale})`);
  if (x !== undefined) transformParts.push(`translateX(${typeof x === 'number' ? `${x}px` : x})`);
  if (y !== undefined) transformParts.push(`translateY(${typeof y === 'number' ? `${y}px` : y})`);
  if (rotate !== undefined) transformParts.push(`rotate(${rotate}deg)`);

  const style: React.CSSProperties = { ...rest };
  if (opacity !== undefined) style.opacity = opacity;
  if (transformParts.length > 0) style.transform = transformParts.join(' ');

  return style;
}

// Higher-order Motion Component wrapper
export function createMotionComponent<T extends Element = HTMLElement>(
  Tag: keyof JSX.IntrinsicElements
) {
  const MotionComp = React.forwardRef<T, MotionProps>(
    (
      {
        children,
        className = '',
        initial,
        animate,
        exit,
        whileHover,
        whileTap,
        transition = {},
        style = {},
        onMouseEnter,
        onMouseLeave,
        onMouseDown,
        onMouseUp,
        ...props
      },
      ref
    ) => {
      const [isHovered, setIsHovered] = useState(false);
      const [isTapped, setIsTapped] = useState(false);
      const [currentAnimate, setCurrentAnimate] = useState<MotionStyleValues>(() => {
        if (typeof initial === 'object' && initial !== null) {
          return initial;
        }
        return animate || {};
      });

      const { duration = 0.3, delay = 0, ease = 'cubic-bezier(0.16, 1, 0.3, 1)' } = transition;

      useEffect(() => {
        if (animate) {
          if (delay > 0) {
            const timer = setTimeout(() => {
              setCurrentAnimate(animate);
            }, delay * 1000);
            return () => clearTimeout(timer);
          } else {
            setCurrentAnimate(animate);
          }
        }
      }, [JSON.stringify(animate), delay]);

      const computedMotionStyle = formatMotionStyle(
        currentAnimate,
        isHovered,
        whileHover,
        isTapped,
        whileTap
      );

      const combinedStyle: React.CSSProperties = {
        transition: `all ${duration}s ${ease}`,
        willChange: 'transform, opacity',
        ...style,
        ...computedMotionStyle,
      };

      const handleMouseEnter = (e: React.MouseEvent<any>) => {
        setIsHovered(true);
        if (onMouseEnter) onMouseEnter(e);
      };

      const handleMouseLeave = (e: React.MouseEvent<any>) => {
        setIsHovered(false);
        setIsTapped(false);
        if (onMouseLeave) onMouseLeave(e);
      };

      const handleMouseDown = (e: React.MouseEvent<any>) => {
        setIsTapped(true);
        if (onMouseDown) onMouseDown(e);
      };

      const handleMouseUp = (e: React.MouseEvent<any>) => {
        setIsTapped(false);
        if (onMouseUp) onMouseUp(e);
      };

      const Component: any = Tag;

      return (
        <Component
          ref={ref}
          className={className}
          style={combinedStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          {...props}
        >
          {children}
        </Component>
      );
    }
  );

  MotionComp.displayName = `Motion.${Tag}`;
  return MotionComp;
}

// Proxied motion object mapping HTML tag elements
export const motion = {
  div: createMotionComponent<HTMLDivElement>('div'),
  button: createMotionComponent<HTMLButtonElement>('button'),
  span: createMotionComponent<HTMLSpanElement>('span'),
  section: createMotionComponent<HTMLElement>('section'),
  article: createMotionComponent<HTMLElement>('article'),
  header: createMotionComponent<HTMLElement>('header'),
  footer: createMotionComponent<HTMLElement>('footer'),
  nav: createMotionComponent<HTMLElement>('nav'),
  aside: createMotionComponent<HTMLElement>('aside'),
  h1: createMotionComponent<HTMLHeadingElement>('h1'),
  h2: createMotionComponent<HTMLHeadingElement>('h2'),
  h3: createMotionComponent<HTMLHeadingElement>('h3'),
  p: createMotionComponent<HTMLParagraphElement>('p'),
  ul: createMotionComponent<HTMLUListElement>('ul'),
  li: createMotionComponent<HTMLLIElement>('li'),
  a: createMotionComponent<HTMLAnchorElement>('a'),
  svg: createMotionComponent<SVGSVGElement>('svg' as any),
  path: createMotionComponent<SVGPathElement>('path' as any),
};

// AnimatePresence component wrapper
export const AnimatePresence: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Custom MotionValue hook
export function useMotionValue<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  return {
    get: () => value,
    set: (v: T) => setValue(v),
  };
}

// Custom Transform hook mapping numerical input ranges to output strings/numbers
export function useTransform(
  value: { get: () => number },
  inputRange: number[],
  outputRange: (number | string)[]
) {
  const current = value.get();
  if (inputRange.length < 2 || outputRange.length < 2) return outputRange[0];
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;

  const pct = Math.max(0, Math.min(1, (current - inMin) / (inMax - inMin)));

  if (typeof outMin === 'number' && typeof outMax === 'number') {
    return outMin + pct * (outMax - outMin);
  }

  return pct > 0.5 ? outMax : outMin;
}
