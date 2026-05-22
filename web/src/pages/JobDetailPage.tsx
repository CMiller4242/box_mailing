import { Link, useParams } from 'react-router-dom';
import { BlockerBadge, StatusBadge } from '../components/StatusBadge';
import { CommentsPanel } from '../components/CommentsPanel';
import { FilesPanel } from '../components/FilesPanel';
import { StageTransitionPanel } from '../components/StageTransitionPanel';
import { useJob } from '../hooks/useJob';
import { useStages } from '../hooks/useStages';
import { formatDate, formatDateTime, formatDuration } from '../utils/format';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: job, isLoading, error } = useJob(id ?? '');
  const { data: allStages } = useStages();

  if (isLoading) return <p className="loading">Loading job…</p>;
  if (error)
    return (
      <div className="error-msg">
        Failed to load job: {(error as Error).message}
      </div>
    );
  if (!job) return null;

  const currentSeq = job.currentStage?.sequence ?? 0;

  return (
    <div>
      <Link to="/jobs" className="back-link">
        ← All Jobs
      </Link>

      {/* Page header */}
      <div className="page-header" style={{ alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 className="page-title" style={{ fontSize: 22 }}>{job.title}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={job.jobStatus} />
            <BlockerBadge blocker={job.blockerType} />
            {job.team && (
              <span className="badge badge-draft">{job.team.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stage progress strip */}
      {allStages && allStages.length > 0 && (
        <div className="card" style={{ marginBottom: 20, overflowX: 'auto' }}>
          <div style={{ padding: '16px 20px 24px', position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 16 }}>
              Workflow Progress
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {allStages.map((stage, i) => {
                const done = stage.sequence < currentSeq;
                const current = stage.sequence === currentSeq;
                return (
                  <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {i > 0 && (
                      <div
                        style={{
                          width: 32,
                          height: 2,
                          background: done || current ? (done ? 'var(--success)' : 'var(--accent)') : 'var(--border)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ position: 'relative', textAlign: 'center' }}>
                      <div
                        className={`stage-dot${done ? ' done' : current ? ' current' : ''}`}
                        title={stage.name}
                      >
                        {done ? '✓' : stage.sequence}
                      </div>
                      <div
                        className={`stage-label${current ? ' current' : ''}`}
                        style={{ maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={stage.name}
                      >
                        {stage.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main detail grid */}
      <div className="detail-grid">
        {/* Left: metadata + history + comments + files */}
        <div className="detail-main">
          {/* Job metadata */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Details</span>
            </div>
            <div className="card-body">
              <div className="meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Requested By</span>
                  <span className="meta-value">{job.requestedBy.name}</span>
                  <span className="text-sm text-muted">{job.requestedBy.email}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Assigned To</span>
                  <span className="meta-value">
                    {job.assignedTo?.name ?? (
                      <span className="muted">Unassigned</span>
                    )}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Target Mail Date</span>
                  <span className="meta-value">{formatDate(job.targetMailDate)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Overall Due Date</span>
                  <span className="meta-value">{formatDate(job.overallDueDate)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Requested</span>
                  <span className="meta-value">{formatDate(job.requestedDate)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Last Updated</span>
                  <span className="meta-value">{formatDateTime(job.updatedAt)}</span>
                </div>
              </div>

              {job.description && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div className="meta-label" style={{ marginBottom: 6 }}>Description</div>
                  <p className="description-text">{job.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vendor tasks if any */}
          {job.vendorTasks.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Vendor Tasks</span>
                <span className="text-muted text-sm">{job.vendorTasks.length}</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {job.vendorTasks.map((vt) => (
                  <div
                    key={vt.id}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      background: '#faf5ff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{vt.vendorName}</span>
                      <span className="badge badge-vendor">{vt.taskStatus.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-muted text-sm">{vt.description}</div>
                    {vt.expectedReturnDate && (
                      <div className="text-sm text-muted" style={{ marginTop: 4 }}>
                        Expected return: {formatDate(vt.expectedReturnDate)}
                      </div>
                    )}
                    {vt.returnNotes && (
                      <div className="text-sm text-muted" style={{ marginTop: 4, fontStyle: 'italic' }}>
                        {vt.returnNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage history */}
          {job.stageHistories.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Stage History</span>
              </div>
              <div className="card-body" style={{ padding: '0 18px' }}>
                <div className="history-list">
                  {job.stageHistories.map((h) => (
                    <div key={h.id} className="history-row">
                      <div>
                        <div className="history-stage">{h.stage.name}</div>
                        {h.assignedTo && (
                          <div className="text-sm text-muted">{h.assignedTo.name}</div>
                        )}
                      </div>
                      <div className="history-note">
                        {h.transitionNote ?? ''}
                      </div>
                      <div className="history-duration">
                        {h.durationMinutes != null
                          ? formatDuration(h.durationMinutes)
                          : h.exitedAt == null
                          ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>current</span>
                          : '—'}
                      </div>
                      <div className="history-date">{formatDate(h.enteredAt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Milestones if any */}
          {job.milestones.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Milestones</span>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {job.milestones.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      background: m.completedAt ? 'var(--success-light)' : '#fafafa',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{m.label}</span>
                      {m.notes && <div className="text-sm text-muted">{m.notes}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {m.completedAt ? (
                        <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>
                          ✓ Done {formatDate(m.completedAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted">Due {formatDate(m.dueDate)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CommentsPanel jobId={job.id} comments={job.comments} />
          <FilesPanel files={job.files} />
        </div>

        {/* Right sidebar: stage panel */}
        <div className="detail-sidebar">
          <StageTransitionPanel
            jobId={job.id}
            currentStage={job.currentStage}
            stageEnteredAt={job.stageEnteredAt}
            currentStageDueDate={job.currentStageDueDate}
          />
        </div>
      </div>
    </div>
  );
}
