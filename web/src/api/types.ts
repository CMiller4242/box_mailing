// Mirror of backend Prisma/DTO shapes. Keep in sync with the NestJS API.

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';
export type JobStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'WAITING_EXTERNAL'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';
export type BlockerType = 'NONE' | 'INTERNAL' | 'VENDOR';
export type VendorTaskStatus =
  | 'PENDING'
  | 'SENT_TO_VENDOR'
  | 'RECEIVED_FROM_VENDOR'
  | 'OVERDUE';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface User extends UserSummary {
  role: UserRole;
  isActive: boolean;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string | null;
  sequence: number;
  phaseGroup: string | null;
  isExternalStep: boolean;
  slaDays: number | null;
  isActive: boolean;
}

export interface StageHistory {
  id: string;
  stageId: string;
  stage: WorkflowStage;
  enteredAt: string;
  exitedAt: string | null;
  durationMinutes: number | null;
  assignedTo: UserSummary | null;
  transitionedBy: UserSummary | null;
  transitionNote: string | null;
}

export interface JobComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
}

export interface JobFile {
  id: string;
  displayName: string;
  storageKey: string;
  mimeType: string | null;
  // BigInt serialized as string from the backend (see backend fix note)
  sizeBytes: string | null;
  version: number;
  isLatest: boolean;
  isApproved: boolean;
  approvedAt: string | null;
  stage: WorkflowStage | null;
  uploadedBy: { id: string; name: string };
  createdAt: string;
}

export interface ScheduleMilestone {
  id: string;
  label: string;
  dueDate: string;
  completedAt: string | null;
  notes: string | null;
}

export interface VendorTask {
  id: string;
  vendorName: string;
  description: string;
  taskStatus: VendorTaskStatus;
  sentAt: string | null;
  expectedReturnDate: string | null;
  receivedAt: string | null;
  returnNotes: string | null;
}

export interface MailingJobSummary {
  id: string;
  title: string;
  description: string | null;
  jobStatus: JobStatus;
  blockerType: BlockerType;
  targetMailDate: string | null;
  overallDueDate: string | null;
  requestedDate: string;
  requestedBy: UserSummary;
  assignedTo: UserSummary | null;
  team: Team | null;
  currentStage: WorkflowStage | null;
  stageEnteredAt: string | null;
  currentStageDueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MailingJobDetail extends MailingJobSummary {
  stageHistories: StageHistory[];
  comments: JobComment[];
  files: JobFile[];
  milestones: ScheduleMilestone[];
  vendorTasks: VendorTask[];
}

// ── Request payloads ─────────────────────────────────────────────────────────

export interface CreateJobPayload {
  title: string;
  description?: string;
  requestedById: string;
  assignedToId?: string;
  targetMailDate?: string;
  overallDueDate?: string;
}

export interface TransitionPayload {
  targetStageId: string;
  transitionNote?: string;
  transitionedById?: string;
}

export interface AddFilePayload {
  displayName: string;
  storageKey: string;
  mimeType?: string;
  sizeBytes?: string;
  uploadedById: string;
  stageId?: string;
}

export interface RenameFilePayload {
  displayName: string;
  actorId?: string;
}

export interface AddCommentPayload {
  content: string;
  authorId: string;
}
