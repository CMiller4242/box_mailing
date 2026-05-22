import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { WorkflowStage } from '../api/types';
import { api } from '../api/client';
import { useStages } from '../hooks/useStages';
import { useTransition } from '../hooks/useTransition';
import { useUsers } from '../hooks/useUsers';
import { formatDate, isOverdue, timeAgo } from '../utils/format';

interface Props {
  jobId: string;
  currentStage: WorkflowStage | null;
  stageEnteredAt: string | null;
  currentStageDueDate: string | null;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function StageTransitionPanel({
  jobId,
  currentStage,
  stageEnteredAt,
  currentStageDueDate,
}: Props) {
  const { data: stages } = useStages();
  const { data: users } = useUsers();
  const transition = useTransition(jobId);
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetStageId, setTargetStageId] = useState('');
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [pending, setPending] = useState(false);

  // First active user until auth is wired — Phase 2: replace with auth context
  const actor = users?.[0];

  const availableStages = (stages ?? []).filter(
    (s) => s.id !== currentStage?.id,
  );

  const overdue = currentStageDueDate != null && isOverdue(currentStageDueDate);

  async function handleSubmit() {
    if (!targetStageId) return;
    setStatus('idle');
    setPending(true);

    try {
      // Step 1: transition the stage
      const result = await transition.mutateAsync({
        targetStageId,
        transitionNote: note || undefined,
        transitionedById: actor?.id,
      });

      // Step 2: if a file was selected, upload it attributed to the new stage
      if (selectedFile && actor) {
        await api.files.add(jobId, {
          displayName: selectedFile.name,
          storageKey: selectedFile.name,
          mimeType: selectedFile.type || undefined,
          sizeBytes: selectedFile.size > 0 ? String(selectedFile.size) : undefined,
          uploadedById: actor.id,
          stageId: result.currentStage?.id,
        });
        // Re-fetch after file upload since transition's onSuccess already fired once
        void qc.invalidateQueries({ queryKey: ['jobs', jobId] });
      }

      const newStageName = result.currentStage?.name ?? 'new stage';
      const fileNote = selectedFile ? ` File "${selectedFile.name}" recorded.` : '';
      setStatusMsg(`Moved to "${newStageName}".${fileNote}`);
      setStatus('success');

      // Reset
      setTargetStageId('');
      setNote('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setStatus('idle'), 5000);
    } catch (e) {
      setStatusMsg((e as Error).message);
      setStatus('error');
    } finally {
      setPending(false);
    }
  }

  const hasFile = selectedFile !== null;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Workflow Stage</span>
        {currentStage?.isExternalStep && (
          <span className="vendor-tag">⏳ Vendor</span>
        )}
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Current stage info */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            {currentStage?.name ?? <span className="text-muted">Not started</span>}
          </div>
          {currentStage?.phaseGroup && (
            <div className="text-muted text-sm">Phase: {currentStage.phaseGroup}</div>
          )}
          {stageEnteredAt && (
            <div className="text-muted text-sm">Entered {timeAgo(stageEnteredAt)}</div>
          )}
          {currentStageDueDate && (
            <div
              className="text-sm"
              style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}
            >
              {overdue ? '⚠ Overdue — ' : 'Stage due '}
              {formatDate(currentStageDueDate)}
            </div>
          )}
          {currentStage?.slaDays != null && (
            <div className="text-muted text-sm">
              SLA: {currentStage.slaDays} day{currentStage.slaDays !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Transition form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="label">Move to stage</div>

          <select
            className="select"
            value={targetStageId}
            onChange={(e) => setTargetStageId(e.target.value)}
            disabled={pending}
          >
            <option value="">— select stage —</option>
            {availableStages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sequence}. {s.name}{s.isExternalStep ? ' (vendor)' : ''}
              </option>
            ))}
          </select>

          <textarea
            className="textarea"
            placeholder="Transition note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={pending}
            style={{ minHeight: 52 }}
          />

          {/* Optional file attachment */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>Attach file (optional)</div>
            <div className="upload-file-trigger">
              <label className="upload-file-btn" style={{ fontSize: 12, padding: '5px 10px' }}>
                📎 Choose file
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  disabled={pending}
                />
              </label>
              {selectedFile ? (
                <span className="upload-selected-name">
                  {selectedFile.name}
                  {selectedFile.size > 0 ? ` · ${formatBytes(selectedFile.size)}` : ''}
                </span>
              ) : (
                <span className="upload-hint">No file</span>
              )}
            </div>
          </div>

          {actor && (
            <div className="acting-as">
              Acting as: <strong style={{ marginLeft: 2 }}>{actor.name}</strong>
            </div>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={() => void handleSubmit()}
            disabled={!targetStageId || pending}
          >
            {pending
              ? 'Working…'
              : hasFile
              ? '→ Advance Stage + Attach File'
              : '→ Advance Stage'}
          </button>

          {status === 'error' && (
            <div className="error-msg">{statusMsg}</div>
          )}
          {status === 'success' && (
            <div className="success-msg">{statusMsg}</div>
          )}
        </div>
      </div>
    </div>
  );
}
