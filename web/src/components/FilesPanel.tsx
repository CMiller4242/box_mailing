import type { JobFile } from '../api/types';
import { formatDate } from '../utils/format';

const MIME_ICONS: Record<string, string> = {
  'text/csv': '📊',
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

function formatBytes(raw: string | null): string {
  if (!raw) return '';
  const n = Number(raw);
  if (isNaN(n)) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  files: JobFile[];
}

export function FilesPanel({ files }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Files</span>
        <span className="text-muted text-sm">{files.length}</span>
      </div>
      <div className="card-body">
        {files.length === 0 ? (
          <p className="text-muted text-sm">No files attached yet.</p>
        ) : (
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
                    {' · '}uploaded by {f.uploadedBy.name}
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
      </div>
    </div>
  );
}
