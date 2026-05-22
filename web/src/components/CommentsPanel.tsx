import { useState } from 'react';
import type { JobComment } from '../api/types';
import { useAddComment } from '../hooks/useAddComment';
import { useUsers } from '../hooks/useUsers';
import { formatDateTime } from '../utils/format';

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface Props {
  jobId: string;
  comments: JobComment[];
}

export function CommentsPanel({ jobId, comments }: Props) {
  const addComment = useAddComment(jobId);
  const { data: users } = useUsers();
  const [text, setText] = useState('');
  // Use the first available user as the author until real auth is wired.
  // TODO Phase 2: replace with auth context user ID.
  const authorId = users?.[0]?.id ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (!authorId) return;
    await addComment.mutateAsync({ content, authorId });
    setText('');
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Comments</span>
        <span className="text-muted text-sm">{comments.length}</span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {comments.length === 0 ? (
          <p className="text-muted text-sm">No comments yet.</p>
        ) : (
          <div className="comment-list">
            {comments.map((c) => (
              <div key={c.id} className="comment">
                <div className="comment-avatar">{initials(c.author.name)}</div>
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="comment-author">{c.author.name}</span>
                    {' · '}
                    <span>{formatDateTime(c.createdAt)}</span>
                  </div>
                  <div className="comment-content">{c.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <form className="add-comment-form" onSubmit={(e) => void handleSubmit(e)}>
          <textarea
            className="textarea"
            placeholder="Add a note or update…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={addComment.isPending}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              disabled={!text.trim() || !authorId || addComment.isPending}
            >
              {addComment.isPending ? 'Posting…' : 'Add Comment'}
            </button>
          </div>
          {addComment.isError && (
            <div className="error-msg">
              {(addComment.error as Error).message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
