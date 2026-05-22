import type {
  AddCommentPayload,
  CreateJobPayload,
  JobComment,
  MailingJobDetail,
  MailingJobSummary,
  StageHistory,
  TransitionPayload,
  User,
  WorkflowStage,
} from './types';

const BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      const detail = Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message;
      if (detail) message = detail;
    } catch {
      // body was not JSON — use status text
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  jobs: {
    list: (params?: Record<string, string>) => {
      const qs = params
        ? '?' + new URLSearchParams(params).toString()
        : '';
      return request<MailingJobSummary[]>(`/mailing-jobs${qs}`);
    },
    get: (id: string) =>
      request<MailingJobDetail>(`/mailing-jobs/${id}`),
    create: (body: CreateJobPayload) =>
      request<MailingJobSummary>('/mailing-jobs', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  workflow: {
    stages: () => request<WorkflowStage[]>('/workflow/stages'),
    transition: (jobId: string, body: TransitionPayload) =>
      request<MailingJobSummary>(`/workflow/jobs/${jobId}/transition`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    history: (jobId: string) =>
      request<StageHistory[]>(`/workflow/jobs/${jobId}/history`),
  },

  users: {
    list: () => request<User[]>('/users'),
  },

  comments: {
    list: (jobId: string) =>
      request<JobComment[]>(`/mailing-jobs/${jobId}/comments`),
    add: (jobId: string, body: AddCommentPayload) =>
      request<JobComment>(`/mailing-jobs/${jobId}/comments`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
};
