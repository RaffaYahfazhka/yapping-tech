'use client';

import React, { useRef, useEffect } from 'react';
import { css } from '@emotion/css';

export interface TerminalLogItem {
  time?: string;
  agent?: 'tara' | 'arga' | 'jajang' | 'kian' | 'vani' | 'reno' | 'sys' | string;
  level?: 'info' | 'warn' | 'error' | 'success';
  text?: string;
  message?: string;
  [key: string]: any;
}

export interface GitDiffItem {
  path: string;
  diff: string;
}

export interface TerminalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs?: TerminalLogItem[];
  onClearLogs?: () => void;
  simSpeed?: number;
  onSpeedToggle?: () => void;
  termTab?: 'logs' | 'diff';
  setTermTab?: (tab: 'logs' | 'diff') => void;
  diffData?: GitDiffItem[];
  selectedDiffIndex?: number;
  setSelectedDiffIndex?: (index: number) => void;
}

// -------------------------------------------------------------
// Emotion CSS Styles - Isolated, Pixel-perfect, High Legibility
// -------------------------------------------------------------
const styles = {
  drawer: (isOpen: boolean) => css`
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 100;
    width: 100%;
    max-width: 660px;
    height: 380px;
    display: flex;
    flex-direction: column;
    background: rgba(9, 9, 11, 0.96);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    border-left: 1px solid rgba(255, 255, 255, 0.12);
    border-right: 1px solid rgba(255, 255, 255, 0.12);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.7);
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    transform: ${isOpen ? 'translateY(0)' : 'translateY(100%)'};
    pointer-events: ${isOpen ? 'auto' : 'none'};
    color: #e4e4e7;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

    @media (max-width: 640px) {
      max-width: 100%;
      height: 340px;
      border-radius: 16px 16px 0 0;
    }
  `,

  titlebar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    background: rgba(0, 0, 0, 0.55);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    user-select: none;
  `,

  leftBrand: css`
    display: flex;
    align-items: center;
    gap: 12px;
  `,

  trafficDots: css`
    display: flex;
    align-items: center;
    gap: 6px;
    span {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
  `,

  hostPrompt: css`
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #d4d4d8;
  `,

  pathHighlight: css`
    color: #a78bfa;
    font-weight: 700;
    margin-left: 4px;
  `,

  toolbarActions: css`
    display: flex;
    align-items: center;
    gap: 8px;
  `,

  toolBtn: css`
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #e4e4e7;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
    }
  `,

  closeBtn: css`
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: transparent;
    border: none;
    color: #a1a1aa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
  `,

  tabBar: css`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px 0;
    background: rgba(0, 0, 0, 0.35);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  `,

  tabItem: (isActive: boolean) => css`
    padding: 8px 14px;
    font-size: 12px;
    font-weight: ${isActive ? 700 : 500};
    color: ${isActive ? '#34d399' : '#a1a1aa'};
    background: transparent;
    border: none;
    border-bottom: 2px solid ${isActive ? '#10b981' : 'transparent'};
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
      color: ${isActive ? '#34d399' : '#f4f4f5'};
    }
  `,

  logScrollArea: css`
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    font-size: 12px;
    line-height: 1.7;
    background: rgba(0, 0, 0, 0.75);
    user-select: text;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.3);
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
    }
  `,

  logRow: css`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 6px;
  `,

  logTimestamp: css`
    color: #71717a;
    font-size: 11px;
    flex-shrink: 0;
    user-select: none;
  `,

  logBadge: (color: string) => css`
    color: ${color};
    font-weight: 700;
    flex-shrink: 0;
  `,

  logContent: (level?: string) => {
    let textColor = '#f4f4f5';
    let fontWeight = 400;
    if (level === 'error') {
      textColor = '#f87171';
      fontWeight = 700;
    } else if (level === 'warn') {
      textColor = '#fbbf24';
      fontWeight = 600;
    } else if (level === 'success') {
      textColor = '#34d399';
      fontWeight = 600;
    }
    return css`
      color: ${textColor};
      font-weight: ${fontWeight};
      word-break: break-word;
      white-space: pre-wrap;
    `;
  },

  emptyNotice: css`
    color: #71717a;
    font-style: italic;
    text-align: center;
    padding: 40px 16px;
    font-size: 12px;
  `,

  diffTabHeader: css`
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    margin-bottom: 12px;
  `,

  diffFilePill: (isSelected: boolean) => css`
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: ${isSelected ? 700 : 500};
    border: 1px solid ${isSelected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
    background: ${isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${isSelected ? '#6ee7b7' : '#a1a1aa'};
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;

    &:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.12);
    }
  `,

  diffBox: css`
    padding: 16px;
    border-radius: 12px;
    background: #09090b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 11px;
    line-height: 1.6;
    color: #e4e4e7;
    overflow-x: auto;
    white-space: pre;
  `,
};

const AGENT_COLORS: Record<string, string> = {
  tara: '#fbbf24',
  arga: '#38bdf8',
  jajang: '#c084fc',
  kian: '#34d399',
  vani: '#fb7185',
  reno: '#22d3ee',
  sys: '#94a3b8',
};

export default function TerminalDrawer({
  isOpen,
  onClose,
  logs = [],
  onClearLogs,
  simSpeed = 1,
  onSpeedToggle,
  termTab = 'logs',
  setTermTab,
  diffData = [],
  selectedDiffIndex = 0,
  setSelectedDiffIndex,
}: TerminalDrawerProps) {
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom on new output
  useEffect(() => {
    if (logScrollRef.current && termTab === 'logs') {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs, termTab]);

  return (
    <aside className={styles.drawer(isOpen)} aria-label="Terminal Drawer">
      {/* Terminal Titlebar */}
      <div className={styles.titlebar}>
        <div className={styles.leftBrand}>
          <div className={styles.trafficDots} aria-hidden="true">
            <span style={{ backgroundColor: '#ef4444' }} />
            <span style={{ backgroundColor: '#f59e0b' }} />
            <span style={{ backgroundColor: '#10b981' }} />
          </div>
          <div className={styles.hostPrompt}>
            raffa@kantor<span style={{ color: '#71717a' }}>:</span>
            <span className={styles.pathHighlight}>~/mission</span>
          </div>
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={onSpeedToggle}
            title="Kecepatan Simulasi"
          >
            ⚡ {simSpeed}×
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={onClearLogs}
            title="Bersihkan Log"
          >
            clear
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Terminal"
            className={styles.closeBtn}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        <button
          type="button"
          className={styles.tabItem(termTab === 'logs')}
          onClick={() => setTermTab?.('logs')}
        >
          <span>$</span> Output Logs ({logs.length})
        </button>

        <button
          type="button"
          className={styles.tabItem(termTab === 'diff')}
          onClick={() => setTermTab?.('diff')}
        >
          <span>±</span> Git Diffs {diffData?.length ? `(${diffData.length})` : ''}
        </button>
      </div>

      {/* Tab 1: Live Terminal Log Streams */}
      {termTab === 'logs' ? (
        <div ref={logScrollRef} className={styles.logScrollArea}>
          {logs.map((item, idx) => {
            const agentKey = (item.agent || 'sys').toLowerCase();
            const color = AGENT_COLORS[agentKey] || '#a1a1aa';
            const logMsg = item.text || item.message || JSON.stringify(item);

            return (
              <div key={idx} className={styles.logRow}>
                <span className={styles.logTimestamp}>{item.time || '»'}</span>
                <span className={styles.logBadge(color)}>
                  [{item.agent?.toUpperCase() || 'SYS'}]
                </span>
                <span className={styles.logContent(item.level)}>{logMsg}</span>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className={styles.emptyNotice}>
              Terminal standby. Tidak ada log eksekusi saat ini. Jalankan task di Mission Control untuk melihat log live streaming.
            </div>
          )}
        </div>
      ) : (
        /* Tab 2: Git Diff View */
        <div className={styles.logScrollArea}>
          {diffData && diffData.length > 0 ? (
            <div>
              <div className={styles.diffTabHeader}>
                {diffData.map((f, i) => (
                  <button
                    key={f.path || i}
                    type="button"
                    onClick={() => setSelectedDiffIndex?.(i)}
                    className={styles.diffFilePill(selectedDiffIndex === i)}
                  >
                    {f.path}
                  </button>
                ))}
              </div>

              <pre className={styles.diffBox}>
                {diffData[selectedDiffIndex]?.diff || 'Tidak ada konten diff.'}
              </pre>
            </div>
          ) : (
            <div className={styles.emptyNotice}>
              Belum ada file diff dari repositori aktif.
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
