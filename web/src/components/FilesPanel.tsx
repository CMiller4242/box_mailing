import { useRef, useState } from 'react';
import type { JobFile } from '../api/types';
import { useAddFile } from '../hooks/useAddFile';
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

export function FilesPanel({ jobId, files }: Props) {
  const { data: users } = useUsers();
  const addFile = useAddFile(jobId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // First active user until auth is wired — Phase 2: replace with auth context
  const actor = users?.[0];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!selectedFile || !actor) return;

    await addFile.mutateAsync({
      displayName: selectedFile.name,
      // storageKey is a reference only — actual binary storage is handled separately
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
              <div key={f.id} className="file-row">
                <span className="file-icon">{fileIcon(f.mimeType)}</span>
                <div className="file-info">
                  <div className="file-name">{f.displayName}</div>
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
              </div>
            ))}
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
