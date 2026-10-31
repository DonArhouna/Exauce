import type { Problem } from './types';

/** Erreur API normalisée (RFC 7807) avec statut et Retry-After. */
export class ApiError extends Error {
  readonly problem: Problem;
  readonly status: number;
  readonly retryAfter?: number;

  constructor(problem: Problem, status: number, retryAfter?: number) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.problem = problem;
    this.status = status;
    this.retryAfter = retryAfter;
  }

  get code(): Problem['code'] {
    return this.problem.code;
  }
}

export function isProblem(value: unknown): value is Problem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'title' in value &&
    'status' in value
  );
}

export function fallbackProblem(status: number, detail?: string): Problem {
  return {
    type: 'about:blank',
    title: `HTTP ${status}`,
    status,
    code: 'SERVER_ERROR',
    detail,
  };
}
