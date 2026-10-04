'use client';

import React from 'react';
import { css } from '@emotion/css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'emerald' | 'violet' | 'ghost' | 'outline' | 'danger' | 'accent' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  kbd?: string | null;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const styles = {
  base: css`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-weight: 600;
    transition: all 0.16s ease;
    cursor: pointer;
    user-select: none;
    border: none;
    outline: none;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  `,

  size: (s: string) => {
    switch (s) {
      case 'xs':
        return css`
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 8px;
          gap: 6px;
        `;
      case 'sm':
        return css`
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 10px;
          gap: 6px;
        `;
      case 'lg':
        return css`
          font-size: 14px;
          padding: 12px 20px;
          border-radius: 14px;
          gap: 10px;
          font-weight: 700;
        `;
      case 'icon':
        return css`
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        `;
      case 'icon-sm':
        return css`
          width: 28px;
          height: 28px;
          padding: 0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        `;
      case 'md':
      default:
        return css`
          font-size: 12px;
          padding: 8px 16px;
          border-radius: 12px;
          gap: 8px;
        `;
    }
  },

  variant: (v: string) => {
    switch (v) {
      case 'emerald':
        return css`
          background: linear-gradient(135deg, #10b981, #059669);
          color: #ffffff;
          border: 1px solid rgba(16, 185, 129, 0.4);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          &:hover:not(:disabled) {
            filter: brightness(1.1);
            transform: translateY(-1px);
          }
        `;
      case 'violet':
        return css`
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: #ffffff;
          border: 1px solid rgba(139, 92, 246, 0.4);
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
          &:hover:not(:disabled) {
            filter: brightness(1.1);
            transform: translateY(-1px);
          }
        `;
      case 'danger':
        return css`
          background: rgba(244, 63, 94, 0.18);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.35);
          &:hover:not(:disabled) {
            background: rgba(244, 63, 94, 0.28);
          }
        `;
      case 'accent':
        return css`
          background: rgba(6, 182, 212, 0.18);
          color: #22d3ee;
          border: 1px solid rgba(6, 182, 212, 0.35);
          &:hover:not(:disabled) {
            background: rgba(6, 182, 212, 0.28);
          }
        `;
      case 'ghost':
        return css`
          background: transparent;
          color: #a1a1aa;
          border: 1px solid transparent;
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
          }
        `;
      case 'outline':
        return css`
          background: rgba(255, 255, 255, 0.03);
          color: #d4d4d8;
          border: 1px solid rgba(255, 255, 255, 0.12);
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.22);
          }
        `;
      case 'primary':
      default:
        return css`
          background: rgba(255, 255, 255, 0.08);
          color: #f4f4f5;
          border: 1px solid rgba(255, 255, 255, 0.14);
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
          }
        `;
    }
  },

  kbdBadge: css`
    margin-left: 4px;
    padding: 2px 6px;
    font-size: 10px;
    font-family: ui-monospace, monospace;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #a1a1aa;
  `,
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  kbd = null,
  icon = null,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  const resolvedSize = variant === 'icon' ? (size === 'sm' ? 'icon-sm' : 'icon') : size;
  const resolvedVariant = variant === 'icon' ? 'ghost' : variant;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${styles.base} ${styles.size(resolvedSize)} ${styles.variant(resolvedVariant)} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
            marginRight: '4px',
          }}
        />
      ) : icon ? (
        <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>
      ) : null}

      {children && <span>{children}</span>}

      {kbd && <kbd className={styles.kbdBadge}>{kbd}</kbd>}
    </button>
  );
}
