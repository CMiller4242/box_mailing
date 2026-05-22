import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewJobModal } from '../components/NewJobModal';
import { StatusBadge } from '../components/StatusBadge';
import { useJobs } from '../hooks/useJobs';
import { formatDate, isOverdue } from '../utils/format';

export function JobsListPage() {
  const navigate = useNavigate();
  const { data: jobs, isLoading, error } = useJobs();
  const [showCreate, setShowCreate] = useState(false);

  function handleCreated(id: string) {
    setShowCreate(false);
    navigate(`/jobs/${id}`);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mailing Jobs</div>
          <div className="page-subtitle">
            {jobs != null ? `${jobs.length} job${jobs.length !== 1 ? 's' : ''}` : ' '}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + New Job
        </button>
      </div>

      {isLoading && <p className="loading">Loading jobs…</p>}

      {error && (
        <div className="error-msg">
          Could not load jobs: {(error as Error).message}
        </div>
      )}

      {jobs && jobs.length === 0 && (
        <div className="table-wrap">
          <div className="empty">
            <div className="empty-icon">📬</div>
            <div className="empty-title">No mailing jobs yet</div>
            <div className="empty-body">
              Create the first job to start tracking the mailing workflow.
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New Job
            </button>
          </div>
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Status</th>
                <th>Current Stage</th>
                <th>Assigned To</th>
                <th>Mail Date</th>
                <th>Due Date</th>
                <th>Requester</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const dueOverdue = isOverdue(job.overallDueDate);
                return (
                  <tr
                    key={job.id}
                    className="clickable"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <td className="td-title">{job.title}</td>
                    <td>
                      <StatusBadge status={job.jobStatus} />
                    </td>
                    <td className="td-muted">
                      {job.currentStage ? (
                        <span title={job.currentStage.description ?? undefined}>
                          {job.currentStage.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>Not started</span>
                      )}
                    </td>
                    <td className="td-muted">
                      {job.assignedTo?.name ?? (
                        <span style={{ color: 'var(--text-faint)' }}>Unassigned</span>
                      )}
                    </td>
                    <td className="td-muted">{formatDate(job.targetMailDate)}</td>
                    <td className={dueOverdue ? 'td-danger' : 'td-muted'}>
                      {formatDate(job.overallDueDate)}
                      {dueOverdue && ' ⚠'}
                    </td>
                    <td className="td-muted">{job.requestedBy.name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <NewJobModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
