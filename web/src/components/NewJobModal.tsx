import { useState } from 'react';
import { useCreateJob } from '../hooks/useCreateJob';
import { useUsers } from '../hooks/useUsers';

interface Props {
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function NewJobModal({ onClose, onCreated }: Props) {
  const { data: users } = useUsers();
  const createJob = useCreateJob();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedById, setRequestedById] = useState('');
  const [targetMailDate, setTargetMailDate] = useState('');
  const [overallDueDate, setOverallDueDate] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const job = await createJob.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      requestedById,
      targetMailDate: targetMailDate || undefined,
      overallDueDate: overallDueDate || undefined,
    });
    onCreated(job.id);
  }

  const canSubmit = title.trim().length >= 3 && requestedById;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Mailing Job</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="modal-body">
            <div className="field">
              <label className="label">Job Title *</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Spring 2025 Donor Mailing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field">
              <label className="label">Description</label>
              <textarea
                className="textarea"
                placeholder="Any relevant context for this mailing…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Requested By *</label>
              <select
                className="select"
                value={requestedById}
                onChange={(e) => setRequestedById(e.target.value)}
              >
                <option value="">— select user —</option>
                {(users ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {users?.length === 0 && (
                <span className="field-error">No users found. Create a user via the API first.</span>
              )}
            </div>

            <div className="form-row">
              <div className="field">
                <label className="label">Target Mail Date</label>
                <input
                  className="input"
                  type="date"
                  value={targetMailDate}
                  onChange={(e) => setTargetMailDate(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Overall Due Date</label>
                <input
                  className="input"
                  type="date"
                  value={overallDueDate}
                  onChange={(e) => setOverallDueDate(e.target.value)}
                />
              </div>
            </div>

            {createJob.isError && (
              <div className="error-msg">
                {(createJob.error as Error).message}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit || createJob.isPending}
            >
              {createJob.isPending ? 'Creating…' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
