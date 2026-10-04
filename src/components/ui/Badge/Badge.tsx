'use client';

import React from 'react';
import { css } from '@emotion/css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: 'default' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'blue';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

const styles = {
  badge: (v: string, s: string) => {
    let bg = 'rgba(255, 255, 255, 0.08)';
    let color = '#d4d4d8';
    let border = 'rgba(255, 255, 255, 0.12)';

    switch (v) {
      case 'emerald':
        bg = 'rgba(16, 185, 129, 0.16)';
        color = '#34d399';
        border = 'rgba(16, 185, 129, 0.35)';
        break;
      case 'violet':
        bg = 'rgba(139, 92, 246, 0.16)';
        color = '#c084fc';
        border = 'rgba(139, 92, 246, 0.35)';
        break;
      case 'amber':
        bg = 'rgba(245, 158, 11, 0.16)';
        color = '#fcd34d';
        border = 'rgba(245, 158, 11, 0.35)';
        break;
      case 'rose':
        bg = 'rgba(244, 63, 94, 0.16)';
        color = '#fb7185';
        border = 'rgba(244, 63, 94, 0.35)';
        break;
      case 'cyan':
        bg = 'rgba(6, 182, 212, 0.16)';
        color = '#67e8f9';
        border = 'rgba(6, 182, 212, 0.35)';
        break;
      case 'blue':
        bg = 'rgba(59, 130, 246, 0.16)';
        color = '#60a5fa';
        border = 'rgba(59, 130, 246, 0.35)';
        break;
    }

    let pad = '3px 8px';
    let fs = '11px';
    if (s === 'xs') {
      pad = '2px 6px';
      fs = '10px';
    } else if (s === 'md') {
      pad = '4px 10px';
      fs = '12px';
    }

    return css`
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: ${pad};
      font-size: ${fs};
      font-weight: 700;
      font-family: ui-monospace, SFMono-Regular, monospace;
      border-radius: 6px;
      background: ${bg};
      color: ${color};
      border: 1px solid ${border};
      user-select: none;
      line-height: 1;
    `;
  },

  dotSpan: (v: string) => {
    let dotColor = '#10b981';
    if (v === 'amber') dotColor = '#f59e0b';
    if (v === 'rose') dotColor = '#f43f5e';
    if (v === 'violet') dotColor = '#8b5cf6';
    if (v === 'cyan') dotColor = '#06b6d4';

    return css`
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${dotColor};
      box-shadow: 0 0 6px ${dotColor};
    `;
  },
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
  ...props
}: BadgeProps) {
  return (
    <span className={`${styles.badge(variant, size)} ${className}`} {...props}>
      {dot && <span className={styles.dotSpan(variant)} />}
      {children}
    </span>
  );
}
