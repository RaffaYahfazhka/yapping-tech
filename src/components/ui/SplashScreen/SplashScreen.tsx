'use client';

import React, { useEffect, useState } from 'react';
import { css, keyframes } from '@emotion/css';

export interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

const pulse = keyframes`
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.98); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
`;

const floatLogo = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const styles = {
  overlay: (fading: boolean) => css`
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 50% 30%, #151824 0%, #090a0f 70%, #040508 100%);
    color: #f4f4f5;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    user-select: none;
    transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: ${fading ? 0 : 1};
    transform: ${fading ? 'scale(1.04)' : 'scale(1)'};
    pointer-events: ${fading ? 'none' : 'auto'};
  `,

  card: css`
    width: min(92vw, 480px);
    padding: 36px 32px;
    border-radius: 28px;
    background: rgba(18, 20, 29, 0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 30px 80px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
  `,

  logoBadge: css`
    width: 68px;
    height: 68px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.1));
    border: 1px solid rgba(16, 185, 129, 0.4);
    display: grid;
    place-items: center;
    font-size: 32px;
    box-shadow: 0 10px 24px rgba(16, 185, 129, 0.25);
    animation: ${floatLogo} 3s ease-in-out infinite;
  `,

  titleGroup: css`
    display: flex;
    flex-direction: column;
    gap: 6px;
  `,

  badgeText: css`
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #34d399;
    text-transform: uppercase;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  `,

  heading: css`
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.02em;
    line-height: 1.3;
    margin: 0;
  `,

  desc: css`
    font-size: 12.5px;
    color: #94a3b8;
    line-height: 1.5;
    margin: 0;
  `,

  progressTrack: css`
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    position: relative;
    overflow: hidden;
  `,

  progressFill: (pct: number) => css`
    height: 100%;
    width: ${pct}%;
    border-radius: 999px;
    background: linear-gradient(90deg, #10b981, #34d399);
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
    transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `,

  progressShimmer: css`
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
    animation: ${shimmer} 1.6s infinite;
  `,

  statusRow: css`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #94a3b8;
  `,

  agentPills: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    padding-top: 4px;
  `,

  agentPill: (active: boolean) => css`
    font-size: 10.5px;
    padding: 3px 8px;
    border-radius: 6px;
    background: ${active ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)'};
    border: 1px solid ${active ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.07)'};
    color: ${active ? '#6ee7b7' : '#71717a'};
    transition: all 0.2s ease;
  `,

  enterBtn: css`
    width: 100%;
    padding: 13px 20px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 800;
    color: #04241a;
    background: linear-gradient(135deg, #34d399, #10b981);
    box-shadow: 0 10px 28px rgba(16, 185, 129, 0.45);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 34px rgba(16, 185, 129, 0.6);
      background: linear-gradient(135deg, #6ee7b7, #34d399);
    }

    &:active {
      transform: translateY(0);
    }
  `,
};

const STAGES = [
  { pct: 20, text: 'Memuat aset 3D isometric kantor…', agent: 'tara' },
  { pct: 45, text: 'Menginisialisasi 6 Karyawan AI…', agent: 'arga' },
  { pct: 70, text: 'Sinkronisasi Jira Cloud & Git local…', agent: 'jajang' },
  { pct: 90, text: 'Menyiapkan YouTube Music Audio Engine…', agent: 'vani' },
  { pct: 100, text: 'Kantor siap beroperasi!', agent: 'reno' },
];

export default function SplashScreen({
  onFinish,
  minDurationMs = 1800,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(15);
  const [stageIndex, setStageIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / minDurationMs);

      if (ratio < 0.25) {
        setProgress(25);
        setStageIndex(0);
      } else if (ratio < 0.5) {
        setProgress(50);
        setStageIndex(1);
      } else if (ratio < 0.75) {
        setProgress(75);
        setStageIndex(2);
      } else if (ratio < 1) {
        setProgress(92);
        setStageIndex(3);
      } else {
        setProgress(100);
        setStageIndex(4);
        setReady(true);
        clearInterval(interval);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [minDurationMs]);

  const handleEnter = () => {
    setFading(true);
    setTimeout(() => {
      onFinish?.();
    }, 550);
  };

  return (
    <div className={styles.overlay(fading)} role="dialog" aria-modal="true" aria-label="Loading Kantor Raffa">
      <div className={styles.card}>
        <div className={styles.logoBadge}>⚡</div>

        <div className={styles.titleGroup}>
          <span className={styles.badgeText}>Autonomous Mission Control v2.6</span>
          <h2 className={styles.heading}>Kantor Raffa Virtual 3D</h2>
          <p className={styles.desc}>
            Workspace autonomous AI engineering terintegrasi Jira Cloud, Git local detection, dan YouTube Music.
          </p>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill(progress)}>
            <div className={styles.progressShimmer} />
          </div>
        </div>

        <div className={styles.statusRow}>
          <span>{STAGES[stageIndex]?.text || 'Menyiapkan…'}</span>
          <span>{progress}%</span>
        </div>

        <div className={styles.agentPills}>
          {['Tara (PM)', 'Arga (Arch)', 'Jajang (FE)', 'Kian (BE)', 'Vani (QA)', 'Reno (DevOps)'].map((name, i) => (
            <span key={name} className={styles.agentPill(i <= stageIndex)}>
              {name}
            </span>
          ))}
        </div>

        <button
          type="button"
          className={styles.enterBtn}
          onClick={handleEnter}
          disabled={!ready}
          style={ready ? undefined : { opacity: 0.6, cursor: 'wait' }}
        >
          {ready ? '🚀 Masuk ke Kantor Raffa' : '⚡ Memuat Workspace…'}
        </button>
      </div>
    </div>
  );
}
