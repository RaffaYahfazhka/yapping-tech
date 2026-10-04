'use client';

import React from 'react';
import { css } from '@emotion/css';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  glass?: boolean;
  elevated?: boolean;
  bordered?: boolean;
  padded?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const styles = {
  container: (glass: boolean, bordered: boolean, padded: boolean, elevated: boolean) => css`
    border-radius: 20px;
    transition: all 0.2s ease;
    background: ${glass ? 'rgba(17, 18, 24, 0.88)' : '#111218'};
    backdrop-filter: ${glass ? 'blur(16px)' : 'none'};
    -webkit-backdrop-filter: ${glass ? 'blur(16px)' : 'none'};
    border: ${bordered ? '1px solid rgba(255, 255, 255, 0.12)' : 'none'};
    box-shadow: ${bordered ? '0 16px 36px rgba(0, 0, 0, 0.4)' : 'none'};
    padding: ${padded ? '20px' : '0'};

    ${elevated
      ? `
      &:hover {
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 0 20px 45px rgba(0, 0, 0, 0.55);
        transform: translateY(-2px);
      }
    `
      : ''}
  `,
};

export default function Container({
  children,
  className = '',
  glass = true,
  elevated = false,
  bordered = true,
  padded = true,
  onClick,
  ...props
}: ContainerProps) {
  return (
    <div
      onClick={onClick}
      className={`${styles.container(glass, bordered, padded, elevated)} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
