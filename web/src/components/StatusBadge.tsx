import type { BlockerType, JobStatus } from '../api/types';

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  WAITING_EXTERNAL: 'Waiting: Vendor',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_CLASS: Record<JobStatus, string> = {
  DRAFT: 'badge badge-draft',
  ACTIVE: 'badge badge-active',
  WAITING_EXTERNAL: 'badge badge-external',
  ON_HOLD: 'badge badge-hold',
  COMPLETED: 'badge badge-completed',
  CANCELLED: 'badge badge-cancelled',
};

const BLOCKER_LABELS: Record<BlockerType, string | null> = {
  NONE: null,
  INTERNAL: 'Needs internal action',
  VENDOR: 'Waiting on vendor',
};

const BLOCKER_CLASS: Record<BlockerType, string> = {
  NONE: '',
  INTERNAL: 'badge badge-internal',
  VENDOR: 'badge badge-vendor',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={STATUS_CLASS[status]}>{STATUS_LABELS[status]}</span>
  );
}

export function BlockerBadge({ blocker }: { blocker: BlockerType }) {
  const label = BLOCKER_LABELS[blocker];
  if (!label) return null;
  return <span className={BLOCKER_CLASS[blocker]}>{label}</span>;
}
