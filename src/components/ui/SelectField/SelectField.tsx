'use client';

import React from 'react';
import { css } from '@emotion/css';

export interface SelectOption {
  value: string;
  label?: string;
  [key: string]: any;
}

export interface SelectFieldProps {
  label?: string;
  value?: string;
  onChange?: (val: string, e: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  status?: 'default' | 'success' | 'warning' | 'error';
  statusText?: string;
  helper?: string;
  actionButton?: React.ReactNode;
  className?: string;
  id?: string;
  name?: string;
}

const styles = {
  wrap: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `,

  labelRow: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,

  label: css`
    font-size: 12px;
    font-weight: 700;
    color: #e4e4e7;
  `,

  relativeInput: css`
    position: relative;
    display: flex;
    align-items: center;
  `,

  select: (status: string) => {
    let border = 'rgba(255, 255, 255, 0.12)';
    let bg = '#14151b';
    if (status === 'success') {
      border = 'rgba(16, 185, 129, 0.5)';
      bg = 'rgba(16, 185, 129, 0.05)';
    } else if (status === 'warning') {
      border = 'rgba(245, 158, 11, 0.5)';
      bg = 'rgba(245, 158, 11, 0.05)';
    } else if (status === 'error') {
      border = 'rgba(244, 63, 94, 0.5)';
      bg = 'rgba(244, 63, 94, 0.05)';
    }

    return css`
      width: 100%;
      padding: 10px 38px 10px 14px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 12px;
      background: ${bg};
      color: #f4f4f5;
      border: 1px solid ${border};
      appearance: none;
      cursor: pointer;
      outline: none;
      transition: all 0.15s ease;

      &:focus {
        border-color: #34d399;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
  },

  rightIcons: css`
    position: absolute;
    right: 12px;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #a1a1aa;
  `,

  helperRow: (status: string) => {
    let color = '#71717a';
    if (status === 'success') color = '#34d399';
    if (status === 'warning') color = '#fbbf24';
    if (status === 'error') color = '#fb7185';

    return css`
      font-size: 11px;
      line-height: 1.4;
      color: ${color};
    `;
  },
};

export default function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih salah satu...',
  disabled = false,
  status = 'default',
  statusText = '',
  helper = '',
  actionButton = null,
  className = '',
  id,
  name,
}: SelectFieldProps) {
  return (
    <div className={`${styles.wrap} ${className}`}>
      {label && (
        <div className={styles.labelRow}>
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
          {actionButton}
        </div>
      )}

      <div className={styles.relativeInput}>
        <select
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value, e)}
          className={styles.select(status)}
        >
          {placeholder && (
            <option value="" disabled style={{ background: '#14151b', color: '#71717a' }}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              style={{ background: '#14151b', color: '#f4f4f5' }}
            >
              {opt.label || opt.value}
            </option>
          ))}
        </select>

        <div className={styles.rightIcons}>
          {status === 'success' && <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span>}
          {status === 'warning' && <span style={{ color: '#fbbf24', fontWeight: 800 }}>⚠</span>}
          {status === 'error' && <span style={{ color: '#fb7185', fontWeight: 800 }}>✕</span>}
          <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {(statusText || helper) && (
        <div className={styles.helperRow(status)}>
          {statusText || helper}
        </div>
      )}
    </div>
  );
}
