'use client';

import React, { useEffect } from 'react';
import { css, keyframes } from '@emotion/css';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  maxWidth?: string;
  className?: string;
  bodyClassName?: string;
  /** Tinggi tetap (mis. '85vh') — berguna untuk modal dengan panel scroll internal */
  fixedHeight?: string;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const popIn = keyframes`
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

export const scrollbar = css`
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.14) transparent;
  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  &::-webkit-scrollbar-thumb:hover { background-color: rgba(255, 255, 255, 0.22); }
`;

const styles = {
  backdrop: css`
    position: fixed;
    inset: 0;
    z-index: 130;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(4, 5, 8, 0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    animation: ${fadeIn} 0.18s ease-out;

    @media (max-width: 640px) {
      padding: 0;
      align-items: flex-end;
    }
  `,

  dialog: (maxWidthStr: string, fixedHeight?: string) => css`
    position: relative;
    width: 100%;
    max-width: ${maxWidthStr};
    max-height: min(88vh, 960px);
    ${fixedHeight ? `height: ${fixedHeight};` : ''}
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, #111218 0%, #0c0d11 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 22px;
    box-shadow: 0 30px 80px -12px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    overflow: hidden;
    color: #f4f4f5;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: ${popIn} 0.22s cubic-bezier(0.16, 1, 0.3, 1);

    @media (max-width: 640px) {
      max-width: 100%;
      max-height: 94dvh;
      ${fixedHeight ? 'height: 94dvh;' : ''}
      border-radius: 20px 20px 0 0;
      border-bottom: none;
    }
  `,

  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 22px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    flex-shrink: 0;

    @media (max-width: 640px) {
      padding: 14px 16px;
    }
  `,

  titleGroup: css`
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  `,

  iconBadge: css`
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    flex-shrink: 0;

    @media (max-width: 640px) {
      width: 34px;
      height: 34px;
      font-size: 16px;
    }
  `,

  titleText: css`
    font-size: 16px;
    font-weight: 750;
    color: #ffffff;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 640px) {
      font-size: 14.5px;
    }
  `,

  subtitleText: css`
    font-size: 12px;
    color: #a1a1aa;
    margin-top: 2px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    @media (max-width: 640px) {
      display: none;
    }
  `,

  closeBtn: css`
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #a1a1aa;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 13px;
    flex-shrink: 0;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
  `,

  body: css`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    ${scrollbar}

    @media (max-width: 640px) {
      padding: 14px 16px;
      gap: 14px;
    }
  `,

  footer: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 22px;
    background: rgba(255, 255, 255, 0.02);
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    flex-shrink: 0;

    @media (max-width: 640px) {
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    }
  `,
};

const SIZES: Record<string, string> = {
  sm: '480px',
  md: '680px',
  lg: '920px',
  xl: '1120px',
  full: '1240px',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  maxWidth,
  className = '',
  bodyClassName = '',
  fixedHeight,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolvedMaxWidth = maxWidth || SIZES[size] || SIZES.md;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${styles.dialog(resolvedMaxWidth, fixedHeight)} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            {icon && <div className={styles.iconBadge}>{icon}</div>}
            <div style={{ minWidth: 0 }}>
              {title && <div className={styles.titleText}>{title}</div>}
              {subtitle && <div className={styles.subtitleText}>{subtitle}</div>}
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        <div className={`${styles.body} ${bodyClassName}`}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
