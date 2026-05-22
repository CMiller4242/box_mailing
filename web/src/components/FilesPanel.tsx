import { useRef, useState } from 'react';
import type { JobFile } from '../api/types';
import { useAddFile } from '../hooks/useAddFile';
import { useDeleteFile } from '../hooks/useDeleteFile';
import { useRenameFile } from '../hooks/useRenameFile';
import { useUsers } from '../hooks/useUsers';
import { formatDate } from '../utils/format';

const MIME_ICONS: Record<string, string> = {
  'text/csv': '📊',
  'text/plain': '📄',
  'application/pdf': '📄',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'image/png': '🖼',
  'image/jpeg': '🖼',
};

function fileIcon(mime: string | null): string {
  if (!mime) return '📎';
  return MIME_ICONS[mime] ?? '📎';
}

function formatBytes(raw: string | null | undefined): string {
  if (!raw) return '';
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  jobId: string;
  files: JobFile[];
}

interface FileRowProps {
  jobId: string;
  file: JobFile;
  canEdit: boolean;
  onDeleteConfirm: (fileId: string, name: string) => void;
}

function FileRow({ jobId, file: f, canEdit, onDeleteConfirm }: FileRowProps) {
  const renameFile = useRenameFile(jobId);
  const { data: users } = useUsers();
  const actor = users?.[0];

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(f.displayName);

  function startEdit() {
    setEditValue(f.displayName);
    setEditing(true);
  }

  async function saveEdit() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === f.displayName) {
      setEditing(false);
      return;
    }
    await renameFile.mutateAsync({ fileId: f.id, payload: { displayName: trimmed, actorId: actor?.id } });
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
    setEditValue(f.displayName);
    renameFile.reset();
  }

  return (
    <div className="file-row">
      <span className="file-icon">{fileIcon(f.mimeType)}</span>
      <div className="file-info" style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input
              className="input"
              style={{ fontSize: 13, padding: '2px 6px', flex: 1 }}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
              disabled={renameFile.isPending}
            />
            <button
              className="btn btn-primary btn-sm"
              style={{ padding: '2px 8px', fontSize: 11 }}
              onClick={() => void saveEdit()}
              disabled={renameFile.isPending}
            >
              Save
            </button>
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 8px', fontSize: 11 }}
              onClick={cancelEdit}
              disabled={renameFile.isPending}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="file-name">{f.displayName}</div>
        )}
        {renameFile.isError && (
          <div className="error-msg" style={{ fontSize: 11, padding: '2px 0' }}>
            {(renameFile.error as Error).message}
          </div>
        )}
        <div className="file-meta">
          v{f.version}
          {f.stage ? ` · ${f.stage.name}` : ''}
          {f.sizeBytes ? ` · ${formatBytes(f.sizeBytes)}` : ''}
          {' · '}by {f.uploadedBy.name}
          {' · '}{formatDate(f.createdAt)}
        </div>
      </div>
      {f.isApproved && (
        <span className="file-approved">✓ Approved</span>
      )}
      <div className="file-actions">
        <a
          href={`/api/v1/mailing-jobs/${jobId}/files/${f.id}/download`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-sm file-action-btn"
          title="Download"
        >
          ↓
        </a>
        {canEdit && !editing && (
          <button
            className="btn btn-secondary btn-sm file-action-btn"
            title="Rename"
            onClick={startEdit}
          >
            ✎
          </button>
        )}
        {canEdit && (
          <button
            className="btn btn-secondary btn-sm file-action-btn file-action-danger"
            title="Delete"
            onClick={() => onDeleteConfirm(f.id, f.displayName)}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export function FilesPanel({ jobId, files }: Props) {
  const { data: users } = useUsers();
  const addFile = useAddFile(jobId);
  const deleteFile = useDeleteFile(jobId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const actor = users?.[0];

  function canEditFile(f: JobFile): boolean {
    if (!actor) return false;
    return actor.id === f.uploadedBy.id || actor.role === 'ADMIN';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!selectedFile || !actor) return;

    await addFile.mutateAsync({
      displayName: selectedFile.name,
      storageKey: selectedFile.name,
      mimeType: selectedFile.type || undefined,
      sizeBytes: selectedFile.size > 0 ? String(selectedFile.size) : undefined,
      uploadedById: actor.id,
    });

    setSelectedFile(null);
    setUploadOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleCancel() {
    setSelectedFile(null);
    setUploadOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addFile.reset();
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    await deleteFile.mutateAsync({ fileId: confirmDelete.id, actorId: actor?.id });
    setConfirmDelete(null);
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Files</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="text-muted text-sm">{files.length}</span>
          {!uploadOpen && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setUploadOpen(true)}
              disabled={!actor}
              title={!actor ? 'No users found — create a user first' : undefined}
            >
              + Attach File
            </button>
          )}
        </div>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {files.length === 0 && !uploadOpen && (
          <p className="text-muted text-sm">No files attached yet.</p>
        )}

        {files.length > 0 && (
          <div className="file-list">
            {files.map((f) => (
              <FileRow
                key={f.id}
                jobId={jobId}
                file={f}
                canEdit={canEditFile(f)}
                onDeleteConfirm={(id, name) => setConfirmDelete({ id, name })}
              />
            ))}
          </div>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="upload-zone" style={{ background: '#fff5f5', borderColor: 'var(--danger)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)', marginBottom: 6 }}>
              Delete "{confirmDelete.name}"?
            </div>
            <div className="text-sm text-muted" style={{ marginBottom: 10 }}>
              This cannot be undone.
            </div>
            {deleteFile.isError && (
              <div className="error-msg" style={{ marginBottom: 8 }}>
                {(deleteFile.error as Error).message}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
                onClick={() => void handleDeleteConfirmed()}
                disabled={deleteFile.isPending}
              >
                {deleteFile.isPending ? 'Deleting…' : 'Delete'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setConfirmDelete(null); deleteFile.reset(); }}
                disabled={deleteFile.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {uploadOpen && (
          <div className="upload-zone">
            <div className="upload-file-trigger">
              <label className="upload-file-btn">
                📎 Choose file
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
              {selectedFile ? (
                <span className="upload-selected-name">
                  {selectedFile.name}
                  {selectedFile.size > 0 ? ` (${formatBytes(String(selectedFile.size))})` : ''}
                </span>
              ) : (
                <span className="upload-hint">No file selected</span>
              )}
            </div>

            <div className="acting-as">
              Uploading as: <strong style={{ marginLeft: 2 }}>{actor?.name ?? '—'}</strong>
            </div>

            <div className="upload-hint">
              File metadata is recorded. Actual storage is managed separately.
            </div>

            {addFile.isError && (
              <div className="error-msg">
                {(addFile.error as Error).message}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => void handleUpload()}
                disabled={!selectedFile || !actor || addFile.isPending}
              >
                {addFile.isPending ? 'Recording…' : 'Record File'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCancel}
                disabled={addFile.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
