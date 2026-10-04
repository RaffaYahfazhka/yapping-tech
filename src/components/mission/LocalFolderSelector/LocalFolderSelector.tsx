'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { css } from '@emotion/css';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

export interface InspectionData {
  success?: boolean;
  isValid?: boolean;
  isGitRepo?: boolean;
  isDevBranch?: boolean;
  currentBranch?: string | null;
  projectType?: string;
  uncommittedFiles?: number;
  error?: string;
  folderName?: string;
  path?: string;
  [key: string]: any;
}

export interface LocalFolderSelectorProps {
  value?: string;
  onChange?: (val: string) => void;
  onValidationChange?: (state: {
    path: string;
    isValid: boolean;
    isDevBranch: boolean;
    currentBranch: string | null | undefined;
    inspection: InspectionData | null;
  }) => void;
  className?: string;
}

const styles = {
  box: css`
    padding: 16px 18px;
    border-radius: 18px;
    background: #111218;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,

  topBar: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  `,

  titleLabel: css`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    font-weight: 750;
    color: #ffffff;
  `,

  badgeWorkspace: css`
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  `,

  pickerRow: css`
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  `,

  uploadBtn: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
    border: 1px dashed rgba(16, 185, 129, 0.5);
    color: #6ee7b7;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2));
      border-color: #34d399;
      color: #ffffff;
      transform: translateY(-1px);
    }
  `,

  quickWorkspaceBtn: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #d4d4d8;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
  `,

  selectedCard: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: 12px;
    background: #151720;
    border: 1px solid rgba(255, 255, 255, 0.08);
    gap: 12px;
    flex-wrap: wrap;
  `,

  folderInfo: css`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  `,

  folderIcon: css`
    font-size: 20px;
  `,

  folderMeta: css`
    display: flex;
    flex-direction: column;
    min-width: 0;
  `,

  folderNameText: css`
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 6px;
  `,

  folderPathText: css`
    font-size: 11px;
    color: #71717a;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 520px;
  `,

  resultCard: css`
    padding: 14px;
    border-radius: 12px;
    background: #14151b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 12px;
  `,

  branchWarningBox: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 10px;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #fef3c7;
    font-size: 11.5px;
    line-height: 1.4;
  `,

  actionNotice: (isSuccess: boolean) => css`
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 11.5px;
    background: ${isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'};
    color: ${isSuccess ? '#6ee7b7' : '#fda4af'};
    border: 1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'};
  `,
};

const DEFAULT_WORKSPACE = '/Users/raffayahfazhka/Downloads/master/yapping-techflow';

export default function LocalFolderSelector({
  value,
  onChange,
  onValidationChange,
  className = '',
}: LocalFolderSelectorProps) {
  const [selectedPath, setSelectedPath] = useState(value || DEFAULT_WORKSPACE);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<InspectionData | null>(null);
  const [switchingBranch, setSwitchingBranch] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: string; text: string } | null>(null);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch available projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/repo/local-inspect');
        const data = await res.json();
        if (data.availableProjects && data.availableProjects.length > 0) {
          setAvailableProjects(data.availableProjects);
        }
      } catch (err) {
        console.error('Failed to load local projects:', err);
      }
    }
    fetchProjects();
  }, []);

  // 2. Inspect path
  const handleInspect = useCallback(
    async (pathToCheck: string) => {
      const pathValue = pathToCheck || selectedPath;
      if (!pathValue) return;

      setInspecting(true);
      setActionNotice(null);

      try {
        const res = await fetch(`/api/repo/local-inspect?path=${encodeURIComponent(pathValue)}`);
        const data = await res.json();
        setInspectionResult(data);

        const isBranchDev = data.isDevBranch;
        const isValid = data.isValid && data.isGitRepo;
        onValidationChange?.({
          path: pathValue,
          isValid,
          isDevBranch: isBranchDev,
          currentBranch: data.currentBranch,
          inspection: data,
        });
      } catch (err: any) {
        setInspectionResult({
          success: false,
          error: err.message,
          isValid: false,
        });
        onValidationChange?.({
          path: pathValue,
          isValid: false,
          isDevBranch: false,
          currentBranch: null,
          inspection: null,
        });
      } finally {
        setInspecting(false);
      }
    },
    [selectedPath, onValidationChange]
  );

  useEffect(() => {
    if (selectedPath) {
      handleInspect(selectedPath);
    }
  }, [selectedPath]);

  // Handle native folder picker change
  const handleFolderUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Browser gives relative path like "yapping-techflow/package.json"
    const firstFile = files[0];
    const relativePath = firstFile.webkitRelativePath || '';
    const folderName = relativePath.split('/')[0] || 'Selected Folder';

    // Match with available projects from server if exists, or match workspace
    const matched = availableProjects.find((p) => p.name === folderName || p.folderName === folderName);
    const resolvedPath = matched ? matched.path : `${DEFAULT_WORKSPACE.replace(/yapping-techflow$/, '')}${folderName}`;

    setSelectedPath(resolvedPath);
    onChange?.(resolvedPath);
    handleInspect(resolvedPath);
  };

  const handleSelectWorkspace = (path: string) => {
    setSelectedPath(path);
    onChange?.(path);
    handleInspect(path);
  };

  const handleSwitchToDev = async () => {
    setSwitchingBranch(true);
    setActionNotice(null);
    try {
      const res = await fetch('/api/repo/local-inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: selectedPath,
          action: 'checkout_dev',
          targetBranch: 'dev',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice({ type: 'success', text: data.message });
        setInspectionResult(data);
        onValidationChange?.({
          path: selectedPath,
          isValid: data.isValid,
          isDevBranch: data.isDevBranch,
          currentBranch: data.currentBranch,
          inspection: data,
        });
      } else {
        setActionNotice({ type: 'error', text: data.error || 'Gagal checkout ke dev' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err.message });
    } finally {
      setSwitchingBranch(false);
    }
  };

  return (
    <div className={`${styles.box} ${className}`}>
      <div className={styles.topBar}>
        <div className={styles.titleLabel}>
          <span>📁 Folder Repositori Target (Lokal Komputer)</span>
          <span className={styles.badgeWorkspace}>Git Autonomous</span>
        </div>

        <Button
          variant="ghost"
          size="xs"
          loading={inspecting}
          onClick={() => handleInspect(selectedPath)}
        >
          🔄 Refresh Status Git
        </Button>
      </div>

      {/* Hidden native directory picker */}
      <input
        ref={fileInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        style={{ display: 'none' }}
        onChange={handleFolderUploadChange}
      />

      {/* Action buttons: Pick Folder & Quick Workspaces */}
      <div className={styles.pickerRow}>
        <button
          type="button"
          className={styles.uploadBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          <span>📂 Cari & Pilih Folder di Komputer (Upload Folder)</span>
        </button>

        <button
          type="button"
          className={styles.quickWorkspaceBtn}
          onClick={() => handleSelectWorkspace(DEFAULT_WORKSPACE)}
        >
          <span>⚡ Gunakan yapping-techflow</span>
        </button>
      </div>

      {/* Selected folder preview card */}
      <div className={styles.selectedCard}>
        <div className={styles.folderInfo}>
          <span className={styles.folderIcon}>📂</span>
          <div className={styles.folderMeta}>
            <span className={styles.folderNameText}>
              {inspectionResult?.folderName || selectedPath.split('/').pop() || 'yapping-techflow'}
              {inspectionResult?.projectType && (
                <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                  {inspectionResult.projectType}
                </span>
              )}
            </span>
            <span className={styles.folderPathText} title={selectedPath}>
              {selectedPath}
            </span>
          </div>
        </div>

        <Badge variant={inspectionResult?.isDevBranch ? 'emerald' : inspectionResult?.isValid ? 'amber' : 'rose'} size="sm">
          {inspectionResult?.currentBranch ? `Branch: ${inspectionResult.currentBranch}` : 'Memeriksa…'}
        </Badge>
      </div>

      {/* Git inspection info & dev branch warning */}
      {inspectionResult && inspectionResult.isValid && (
        <div className={styles.resultCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#a1a1aa' }}>Status Git:</span>
              <Badge variant={inspectionResult.isDevBranch ? 'emerald' : 'amber'} dot={true} size="sm">
                {inspectionResult.currentBranch || 'No Branch'}
              </Badge>
              {inspectionResult.isDevBranch ? (
                <span style={{ color: '#34d399', fontWeight: 600 }}>✓ Siap Eksekusi (Branch dev / development)</span>
              ) : (
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>⚠ Bukan branch dev</span>
              )}
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>
              <span>{inspectionResult.uncommittedFiles ?? 0} uncommitted files</span>
            </div>
          </div>

          {!inspectionResult.isDevBranch && inspectionResult.isGitRepo && (
            <div className={styles.branchWarningBox}>
              <span>Standar pengerjaan tiket Jira mensyaratkan branch <b>dev</b> atau <b>development</b>.</span>
              <Button
                variant="accent"
                size="xs"
                loading={switchingBranch}
                onClick={handleSwitchToDev}
              >
                ⚡ Checkout / Buat 'dev'
              </Button>
            </div>
          )}

          {actionNotice && (
            <div className={styles.actionNotice(actionNotice.type === 'success')}>
              {actionNotice.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
