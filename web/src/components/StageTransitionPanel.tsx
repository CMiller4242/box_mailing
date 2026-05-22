import { useState } from 'react';
import type { WorkflowStage } from '../api/types';
import { useStages } from '../hooks/useStages';
import { useTransition } from '../hooks/useTransition';
import { formatDate, isOverdue, timeAgo } from '../utils/format';

interface Props {
  jobId: string;
  currentStage: WorkflowStage | null;
  stageEnteredAt: string | null;
  currentStageDueDate: string | null;
}

export function StageTransitionPanel({
  jobId,
  currentStage,
  stageEnteredAt,
  currentStageDueDate,
}: Props) {
  const { data: stages } = useStages();
  const transition = useTransition(jobId);
  const [targetStageId, setTargetStageId] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);

  const availableStages = (stages ?? []).filter(
    (s) => s.id !== currentStage?.id,
  );

  const overdue =
    currentStageDueDate != null && isOverdue(currentStageDueDate);

  async function handleTransition() {
    if (!targetStageId) return;
    setSuccess(false);
    await transition.mutateAsync({ targetStageId, transitionNote: note || undefined });
    setTargetStageId('');
    setNote('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

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
            <div className="text-muted text-sm">
              Entered {timeAgo(stageEnteredAt)}
            </div>
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
          {currentStage?.slaDays && (
            <div className="text-muted text-sm">SLA: {currentStage.slaDays} day{currentStage.slaDays !== 1 ? 's' : ''}</div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Transition action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="label">Move to stage</div>

          <select
            className="select"
            value={targetStageId}
            onChange={(e) => setTargetStageId(e.target.value)}
            disabled={transition.isPending}
          >
            <option value="">— select stage —</option>
            {availableStages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sequence}. {s.name}
                {s.isExternalStep ? ' (vendor)' : ''}
              </option>
            ))}
          </select>

          <textarea
            className="textarea"
            placeholder="Transition note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={transition.isPending}
            style={{ minHeight: 56 }}
          />

          <button
            className="btn btn-primary btn-sm"
            onClick={() => void handleTransition()}
            disabled={!targetStageId || transition.isPending}
          >
            {transition.isPending ? 'Moving…' : '→ Advance Stage'}
          </button>

          {transition.isError && (
            <div className="error-msg">
              {(transition.error as Error).message}
            </div>
          )}
          {success && (
            <div className="success-msg">Stage updated.</div>
          )}
        </div>
      </div>
    </div>
  );
}
